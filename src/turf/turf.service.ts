import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";

import {
  PrismaService,
} from "../prisma/prisma.service";

import {
  CreateTurfDto,
} from "./dto/create-turf.dto";

@Injectable()
export class TurfService {

  constructor(
    private prisma: PrismaService
  ) {}

  create(
    venueId: string,
    dto: CreateTurfDto
  ) {

    return this.prisma.turf.create({
      data: {
        name: dto.name,

        sport: dto.sport,

        description:
          dto.description,

        venueId,
      },

      include: {
        images: true,
      },
    });
  }

  async findByVenue(
    venueId: string,
    date?: string,
  ) {
    const startOfDay = date ? new Date(date + "T00:00:00") : undefined;
    const endOfDay = date ? new Date(date + "T23:59:59") : undefined;

    const turfs =
      await this.prisma.turf.findMany({
        where: {
          venueId,
        },

        include: {
          images: true,

          slots: {
            where: startOfDay && endOfDay
              ? {
                  date: {
                    gte: startOfDay,
                    lte: endOfDay,
                  },
                }
              : undefined,

            include: {
              bookings: true,
              locks: true,
            },
          },
        },
      });

    const now = new Date();

    return turfs.map((turf) => ({

      ...turf,

      slots: turf.slots.map((slot) => {

        const hasActiveBooking =
          slot.status === "BOOKED" as any ||
          slot.bookings.some(
            (booking) =>
              booking.status === "CONFIRMED" ||
              booking.status === "PENDING"
          );

        const hasActiveLock =
          slot.status === "LOCKED" as any ||
          slot.locks.some(
            (lock) =>
              lock.status === "ACTIVE" &&
              new Date(
                lock.expiresAt
              ) > now
          );

        let computedStatus =
          slot.status;

        if (hasActiveBooking) {
          computedStatus =
            "BOOKED" as any;
        } else if (
          hasActiveLock
        ) {
          computedStatus =
            "LOCKED" as any;
        }

        return {

          ...slot,

          status:
            computedStatus,
        };
      }),
    }));
  }

  async addImage(
    turfId: string,
    url: string
  ) {

    return this.prisma.turfImage.create({
      data: {
        turfId,
        url,
      },
    });
  }

  async createMaintenanceIssue(
    dto: {
      turfId: string;
      issue: string;
      severity: string;
      supervisor?: string;
    }
  ) {
    const turf = await this.prisma.turf.findUnique({
      where: { id: dto.turfId },
    });
    if (!turf) {
      throw new Error("Turf not found");
    }

    return this.prisma.maintenanceIssue.create({
      data: {
        turfId: dto.turfId,
        venueId: turf.venueId,
        issue: dto.issue,
        severity: dto.severity || "Low",
        supervisor: dto.supervisor || "Staff",
        status: "Open",
      },
      include: {
        turf: true,
      },
    });
  }

  async getMaintenanceIssuesByVenue(venueId: string) {
    return this.prisma.maintenanceIssue.findMany({
      where: {
        venueId,
      },
      include: {
        turf: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getMaintenanceIssuesByOwner(ownerId: string) {
    return this.prisma.maintenanceIssue.findMany({
      where: {
        venue: {
          ownerId,
        },
      },
      include: {
        turf: true,
        venue: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateMaintenanceIssueStatus(id: string, status: string) {
    return this.prisma.maintenanceIssue.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string, user: { id: string; role: string }) {
    const turf = await this.prisma.turf.findUnique({
      where: { id },
      include: { venue: true },
    });
    if (!turf) {
      throw new NotFoundException("Turf not found");
    }

    if (user.role !== "SUPER_ADMIN" && turf.venue.ownerId !== user.id) {
      const userRecord = await this.prisma.user.findUnique({ where: { id: user.id } });
      if (userRecord?.venueId !== turf.venueId) {
        throw new ForbiddenException("You do not have permission to delete this turf");
      }
    }

    await this.prisma.slotLock.deleteMany({ where: { slot: { turfId: id } } });
    await this.prisma.slot.deleteMany({ where: { turfId: id } });
    await this.prisma.turfImage.deleteMany({ where: { turfId: id } });
    await this.prisma.booking.deleteMany({ where: { turfId: id } });
    await this.prisma.maintenanceIssue.deleteMany({ where: { turfId: id } });

    return this.prisma.turf.delete({
      where: { id },
    });
  }
}