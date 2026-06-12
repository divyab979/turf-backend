import {
  Injectable,
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

        const hasConfirmedBooking =
          slot.bookings.some(
            (booking) =>
              booking.status ===
              "CONFIRMED"
          );

        const hasActiveLock =
          slot.locks.some(
            (lock) =>
              lock.status === "ACTIVE" &&
              new Date(
                lock.expiresAt
              ) > now
          );

        let computedStatus =
          slot.status;

        if (hasConfirmedBooking) {

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
}