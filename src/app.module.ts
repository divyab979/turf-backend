import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "./prisma/prisma.module";

import { AuthModule } from "./auth/auth.module";

import { UsersModule } from "./users/users.module";
import { VenueModule } from './venue/venue.module';
import { TurfModule } from './turf/turf.module';
import { SlotModule } from './slot/slot.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    AuthModule,

    UsersModule,

    VenueModule,

    TurfModule,

    SlotModule,

    BookingsModule,

    PaymentsModule,

    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}