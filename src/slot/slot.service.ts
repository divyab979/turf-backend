import {
  Injectable,
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

    const today =
      new Date();

    for (
      let day = 0;
      day < dto.days;
      day++
    ) {

      const currentDate =
        new Date(today);

      currentDate.setDate(
        today.getDate() + day
      );

      const startHour =
        Number(
          dto.startTime.split(":")[0]
        );

      const endHour =
        Number(
          dto.endTime.split(":")[0]
        );

      for (
        let hour = startHour;
        hour < endHour;
        hour += dto.duration
      ) {

        const slotStart =
          `${hour
            .toString()
            .padStart(2, "0")}:00`;

        const slotEnd =
          `${(hour + dto.duration)
            .toString()
            .padStart(2, "0")}:00`;

        const isMorning =
          hour < 17;

        const price =
          isMorning
            ? dto.morningPrice
            : dto.eveningPrice;

        slots.push({
          turfId,

          date: currentDate,

          startTime:
            slotStart,

          endTime:
            slotEnd,

          duration:
            dto.duration,

          price,

          status:
            SlotStatus.AVAILABLE,
        });
      }
    }

    return this.prisma.slot.createMany({
      data: slots,

      skipDuplicates: true,
    });
  }

  findByTurf(
    turfId: string
  ) {

    return this.prisma.slot.findMany({
      where: {
        turfId,
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
  }
}