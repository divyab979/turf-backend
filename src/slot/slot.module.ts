import {
  Module,
} from "@nestjs/common";

import {
  SlotController,
} from "./slot.controller";

import {
  SlotService,
} from "./slot.service";

import {
  PrismaService,
} from "../prisma/prisma.service";

@Module({
  controllers: [
    SlotController,
  ],

  providers: [
    SlotService,
    PrismaService,
  ],
})
export class SlotModule {}