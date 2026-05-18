import {
  Module,
} from "@nestjs/common";

import {
  TurfController,
} from "./turf.controller";

import {
  TurfService,
} from "./turf.service";

import {
  PrismaService,
} from "../prisma/prisma.service";

@Module({
  controllers: [
    TurfController,
  ],

  providers: [
    TurfService,
    PrismaService,
  ],
})
export class TurfModule {}