import {
  BadRequestException,
  Injectable,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async lockSlot(
    slotId: string,
    userId: string,
  ) {
    const now = new Date()

    const existingBooking =
      await this.prisma.booking.findFirst({
        where: {
          slotId,
          status: {
            in: ['CONFIRMED', 'PENDING'],
          },
        },
      })

    if (existingBooking) {
      throw new BadRequestException(
        'Slot already booked',
      )
    }

    const activeLock =
      await this.prisma.slotLock.findFirst({
        where: {
          slotId,
          status: 'ACTIVE',
          expiresAt: {
            gt: now,
          },
        },
      })

    if (activeLock) {
      throw new BadRequestException(
        'Slot temporarily locked',
      )
    }

    const expiresAt = new Date(
      now.getTime() + 10 * 60 * 1000,
    )

    return this.prisma.slotLock.create({
      data: {
        slotId,
        userId,
        expiresAt,
      },
    })
  }

  async confirmBooking(
    slotId: string,
    userId: string,
  ) {
    const now = new Date()

    const lock =
      await this.prisma.slotLock.findFirst({
        where: {
          slotId,
          userId,
          status: 'ACTIVE',
          expiresAt: {
            gt: now,
          },
        },
      })

    if (!lock) {
      throw new BadRequestException(
        'Lock expired',
      )
    }

    const slot =
      await this.prisma.slot.findUnique({
        where: {
          id: slotId,
        },
        include: {
          turf: {
            include: {
              venue: true,
            },
          },
        },
      })

    if (!slot) {
      throw new BadRequestException(
        'Slot not found',
      )
    }

    const booking =
      await this.prisma.booking.create({
        data: {
          userId,

          venueId: slot.turf.venue.id,

          turfId: slot.turf.id,

          slotId: slot.id,

          customerName: 'Temp User',
          customerPhone: '9999999999',

          bookingDate: slot.date,

          totalAmount: slot.price,

          advancePaid: Math.floor(
            slot.price * 0.25,
          ),

          paymentStatus: 'PARTIAL',

          status: 'CONFIRMED',
        },
      })

    await this.prisma.slotLock.update({
      where: {
        id: lock.id,
      },
      data: {
        status: 'CONVERTED',
      },
    })

    return booking
  }

  async getMyBookings(
  userId: string,
) {

  return this.prisma.booking.findMany({
    where: {
      userId,
    },

    include: {

      venue: true,

      turf: true,

      slot: true,
    },

    orderBy: {
      bookingDate: 'desc',
    },
  });
}

async getAdminBookings(
  user: any,
) {

  const whereClause: any = {};

  if (
    user.role === "VENUE_OWNER"
  ) {

    whereClause.venue = {
      ownerId: user.id,
    };
  }

  return this.prisma.booking.findMany({

    where: whereClause,

    include: {

      venue: true,

      turf: true,

      slot: true,

      user: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}
}