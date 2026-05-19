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
}