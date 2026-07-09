import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {

  constructor(
    private prisma: PrismaService
  ) {}

  findByEmail(email: string) {

    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  createUser(data: {
    name: string;
    email: string;
    password: string;
    role: any;
    venueId?: string;
  }) {

    return this.prisma.user.create({
      data,
    });
  }

  findStaff(user: any) {
    if (user.role === "SUPER_ADMIN") {
      return this.prisma.user.findMany({
        where: {
          role: "MANAGER",
        },
        include: {
          venue: true,
        },
      });
    }
    return this.prisma.user.findMany({
      where: {
        role: "MANAGER",
        venue: {
          ownerId: user.id,
        },
      },
      include: {
        venue: true,
      },
    });
  }

  findOwners() {
    return this.prisma.user.findMany({
      where: {
        role: "VENUE_OWNER",
      },
      include: {
        ownedVenues: true,
      },
    });
  }

  deleteStaff(id: string, ownerId: string) {
    return this.prisma.user.deleteMany({
      where: {
        id,
        role: "MANAGER",
        venue: {
          ownerId: ownerId,
        },
      },
    });
  }

  async toggleOwnerStatus(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new Error("Owner not found");
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        isSuspended: !user.isSuspended,
      },
    });
  }

  async getCustomersDataForExport(user: any) {
    let bookings;
    if (user.role === "SUPER_ADMIN") {
      bookings = await this.prisma.booking.findMany({
        include: {
          user: true,
          turf: true,
        },
      });
    } else {
      bookings = await this.prisma.booking.findMany({
        where: {
          venue: {
            ownerId: user.id,
          },
        },
        include: {
          user: true,
          turf: true,
        },
      });
    }

    const customerMap = new Map<string, any>();
    bookings.forEach((b) => {
      const key = b.userId || b.customerName || "Unknown";
      const name = b.customerName || b.user?.name || "Walk-in Customer";
      const email = b.user?.email || `${name.toLowerCase().replace(/\s+/g, "")}@example.com`;
      const phone = b.customerPhone || b.user?.phone || "+91 99999 99999";
      const amount = b.totalAmount || 0;
      const sport = b.turf?.sport || "Football";

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key.startsWith("usr_") || key.length > 10 ? `CUST-${key.slice(-4).toUpperCase()}` : `CUST-${key}`,
          name,
          email,
          phone,
          bookingsCount: 0,
          totalSpent: 0,
          preference: sport,
        });
      }

      const existing = customerMap.get(key);
      existing.bookingsCount += 1;
      existing.totalSpent += amount;
      if (b.turf?.sport) {
        existing.preference = b.turf.sport;
      }
    });

    return Array.from(customerMap.values());
  }
}