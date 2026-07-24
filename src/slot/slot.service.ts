import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

import {
  PrismaService,
} from "../prisma/prisma.service";

import {
  SlotStatus,
} from "@prisma/client";

import {
  GenerateSlotsDto,
} from "./dto/generate-slots.dto";

@Injectable()
export class SlotService {

  constructor(
    private prisma: PrismaService
  ) {}

  async generateSlots(
    turfId: string,
    dto: GenerateSlotsDto
  ) {
    const slots: {
      turfId: string;
      date: Date;
      startTime: string;
      endTime: string;
      duration: number;
      price: number;
      status: SlotStatus;
    }[] = [];

    let startDateObj = new Date();
    let endDateObj = new Date();

    if (dto.startDate && dto.endDate) {
      // Set to midnight UTC or local to avoid timezone shifts
      startDateObj = new Date(dto.startDate);
      endDateObj = new Date(dto.endDate);
    } else if (dto.days) {
      endDateObj.setDate(startDateObj.getDate() + dto.days - 1);
    }

    const startHour = Number(dto.startTime.split(":")[0]);
    const endHour = Number(dto.endTime.split(":")[0]);

    // Loop through dates
    let current = new Date(startDateObj);
    while (current <= endDateObj) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // If day of week array is provided, filter out unmatched days
      if (dto.daysOfWeek && !dto.daysOfWeek.includes(dayOfWeek)) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      for (
        let hour = startHour;
        hour < endHour;
        hour += dto.duration
      ) {
        const slotStart = `${hour.toString().padStart(2, "0")}:00`;
        const slotEnd = `${(hour + dto.duration).toString().padStart(2, "0")}:00`;
        const isMorning = hour < 17; // Morning is before 5 PM (17:00)
        const price = isMorning ? dto.morningPrice : dto.eveningPrice;

        slots.push({
          turfId,
          date: new Date(current), // Clone date object
          startTime: slotStart,
          endTime: slotEnd,
          duration: dto.duration,
          price,
          status: SlotStatus.AVAILABLE,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return this.prisma.slot.createMany({
      data: slots,
      skipDuplicates: true,
    });
  }

  async createManualSlot(
    turfId: string,
    dto: {
      date: string;
      startTime: string;
      endTime: string;
      price: number;
      duration: number;
    }
  ) {
    const dateObj = new Date(dto.date);
    return this.prisma.slot.create({
      data: {
        turfId,
        date: dateObj,
        startTime: dto.startTime,
        endTime: dto.endTime,
        price: dto.price,
        duration: dto.duration,
        status: SlotStatus.AVAILABLE,
      },
    });
  }

  async findByTurf(
    turfId: string
  ) {
    const slots = await this.prisma.slot.findMany({
      where: {
        turfId,
      },
      include: {
        bookings: true,
        locks: true,
      },
      orderBy: [
        {
          date: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    const now = new Date();

    return slots.map((slot) => {
      const isBooked =
        slot.status === SlotStatus.BOOKED ||
        slot.bookings.some(
          (b) => b.status === "CONFIRMED" || b.status === "PENDING"
        );

      const isLocked =
        slot.locks.some(
          (lock) => lock.status === "ACTIVE" && new Date(lock.expiresAt) > now
        );

      const computedStatus = isBooked
        ? SlotStatus.BOOKED
        : isLocked
        ? ("LOCKED" as any)
        : slot.status;

      return {
        ...slot,
        status: computedStatus,
        isBooked,
        isLocked,
      };
    });
  }

  async findAll(courtId?: string, date?: string, userId?: string) {
    const startOfDay = date ? new Date(date + "T00:00:00") : undefined;
    const endOfDay = date ? new Date(date + "T23:59:59") : undefined;

    const slots = await this.prisma.slot.findMany({
      where: {
        turfId: courtId,
        date: startOfDay && endOfDay
          ? {
              gte: startOfDay,
              lte: endOfDay,
            }
          : undefined,
      },
      include: {
        bookings: true,
        locks: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    const now = new Date();

    return slots.map((slot) => {
      const isBooked =
        slot.status === SlotStatus.BOOKED ||
        slot.bookings.some(
          (b) => b.status === "CONFIRMED" || b.status === "PENDING"
        );

      const isLocked =
        slot.locks.some(
          (lock) =>
            lock.status === "ACTIVE" &&
            new Date(lock.expiresAt) > now &&
            lock.userId !== userId
        ) ||
        slot.bookings.some(
          (booking) =>
            booking.status === "PENDING" &&
            booking.expiresAt &&
            new Date(booking.expiresAt) > now &&
            booking.userId !== userId
        );

      const computedStatus = isBooked
        ? SlotStatus.BOOKED
        : isLocked
        ? ("LOCKED" as any)
        : slot.status;

      return {
        id: slot.id,
        turfId: slot.turfId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        price: slot.price,
        status: computedStatus,
        isBooked,
        isLocked,
      };
    });
  }

  async toggleBlock(id: string) {
    const slot = await this.prisma.slot.findUnique({
      where: { id },
    });

    if (!slot) {
      throw new NotFoundException("Slot not found");
    }

    const nextStatus = slot.status === SlotStatus.AVAILABLE ? SlotStatus.BLOCKED : SlotStatus.AVAILABLE;

    if (nextStatus === SlotStatus.BLOCKED) {
      const hasActiveBooking = await this.prisma.booking.findFirst({
        where: {
          slotId: id,
          status: {
            in: ["CONFIRMED", "PENDING"],
          },
        },
      });

      if (hasActiveBooking) {
        throw new BadRequestException("Cannot block a slot that has active bookings");
      }
    }

    return this.prisma.slot.update({
      where: { id },
      data: {
        status: nextStatus,
      },
    });
  }
}