import {
  BadRequestException,
  Injectable,
} from '@nestjs/common'

import { Cron } from '@nestjs/schedule'

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
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Lock the slot record pessimistically to prevent race conditions
        await tx.$queryRawUnsafe(
          `SELECT * FROM "Slot" WHERE id = $1 FOR UPDATE`,
          slotId,
        )

        const now = new Date()

        const existingBooking =
          await tx.booking.findFirst({
            where: {
              slotId,
              status: {
                in: [
                  'CONFIRMED',
                  'PENDING',
                ],
              },
            },
          })

        if (existingBooking) {
          throw new BadRequestException(
            'Slot already booked',
          )
        }

        const activeLock =
          await tx.slotLock.findFirst({
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
          now.getTime() +
            10 * 60 * 1000,
        )

        return tx.slotLock.create({
          data: {
            slotId,
            userId,
            expiresAt,
          },
        })
      })
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error
      console.error('lockSlot error:', error)
      throw new BadRequestException(
        error?.message || 'Failed to lock slot',
      )
    }
  }

  async confirmBooking(
    slotId: string,
    userId: string,
  ) {
    try {
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
          'Lock expired or not found — please try selecting the slot again',
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

      // Check if slot is already booked by a confirmed/pending booking
      const existingBooking = await this.prisma.booking.findFirst({
        where: {
          slotId,
          status: {
            in: ['CONFIRMED', 'PENDING'],
          },
        },
      })

      if (existingBooking) {
        throw new BadRequestException('Slot is already booked')
      }

      const userProfile =
        await this.prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

      const advancePaid = Math.floor(slot.price * 0.25)

      const booking = await this.prisma.booking.create({
        data: {
          userId,
          venueId: slot.turf.venue.id,
          turfId: slot.turf.id,
          slotId: slot.id,
          customerName: userProfile?.name || 'Temp User',
          customerPhone: userProfile?.phone || '9999999999',
          bookingDate: slot.date,
          totalAmount: slot.price,
          advancePaid,
          remainingAmount: slot.price - advancePaid,
          paymentStatus: 'PENDING',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
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
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error
      console.error('confirmBooking error:', error)
      throw new BadRequestException(
        error?.message || 'Failed to confirm booking',
      )
    }
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
        bookingDate:
          'desc',
      },
    })
  }

  async getAdminBookings(
    user: any,
  ) {
    const whereClause: any =
      {}

    if (
      user.role ===
      'VENUE_OWNER'
    ) {
      whereClause.venue = {
        ownerId: user.id,
      }
    } else if (
      user.role === 'MANAGER'
    ) {
      whereClause.venueId =
        user.venueId ||
        'none'
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
        createdAt:
          'desc',
      },
    })
  }

  async requestCashPayment(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('Unauthorized to modify this booking');
    }

    if (booking.paymentStatus === 'PAID') {
      throw new BadRequestException('Booking is already paid');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        cashPaymentRequested: true,
      },
    });
  }

  async confirmCashPayment(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.paymentStatus === 'PAID') {
      throw new BadRequestException('Booking is already paid');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        remainingAmount: 0,
        cashPaymentRequested: false,
        paidAt: new Date(),
        paymentMethod: 'CASH',
      },
    });
  }

  async createCustomBooking(
    dto: {
      venueId: string;
      customerName: string;
      customerPhone?: string;
      startTime: string;
      endTime: string;
      totalAmount: number;
      gameActivity?: string;
      paymentMethod?: string;
      notes?: string;
      turfId?: string;
      slotId?: string;
    },
    userId: string
  ) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });

    if (!venue) {
      throw new BadRequestException('Venue not found');
    }

    return this.prisma.booking.create({
      data: {
        userId,
        venueId: dto.venueId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone || '9999999999',
        startTime: dto.startTime,
        endTime: dto.endTime,
        totalAmount: Number(dto.totalAmount),
        advancePaid: Number(dto.totalAmount),
        remainingAmount: 0,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        bookingDate: new Date(),
        gameActivity: dto.gameActivity || 'SNOOKER',
        paymentMethod: dto.paymentMethod || 'CASH',
        notes: dto.notes,
        turfId: dto.turfId,
        slotId: dto.slotId,
      },
    });
  }

  @Cron('*/1 * * * *')
  async releaseExpiredBookings() {
    const now = new Date();
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
    });

    if (expiredBookings.length > 0) {
      console.log(`Releasing ${expiredBookings.length} expired bookings...`);
      await this.prisma.booking.updateMany({
        where: {
          id: {
            in: expiredBookings.map((b) => b.id),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });
    }
  }

  async markAsCompleted(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });
  }
}