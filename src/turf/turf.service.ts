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

    const turfs =
      await this.prisma.turf.findMany({
        where: {
          venueId,
        },

        include: {

          images: true,

          slots: {

 where: date
  ? {
      date: {
        gte: new Date(date),

        lt: new Date(
          new Date(date).getTime() +
          24 * 60 * 60 * 1000
        ),
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
}