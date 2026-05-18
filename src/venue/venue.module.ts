import { Module }
  from "@nestjs/common";

import { VenueController }
  from "./venue.controller";

import { VenueService }
  from "./venue.service";

import { PrismaService }
  from "../prisma/prisma.service";

@Module({
  controllers: [
    VenueController,
  ],

  providers: [
    VenueService,
    PrismaService,
  ],
})
export class VenueModule {}