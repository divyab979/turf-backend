import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

import { BookingsService } from './bookings.service'

import { LockSlotDto } from './dto/lock-slot.dto'
import { ConfirmBookingDto } from './dto/confirm-booking.dto'

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('lock')
  lockSlot(
    @Body() dto: LockSlotDto,
    @Req() req: any,
  ) {
    return this.bookingsService.lockSlot(
      dto.slotId,
      req.user.id,
    )
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  confirmBooking(
    @Body() dto: ConfirmBookingDto,
    @Req() req: any,
  ) {
    return this.bookingsService.confirmBooking(
      dto.slotId,
      req.user.id,
    )
  }

@UseGuards(JwtAuthGuard)
@Get('admin')
getAdminBookings(
  @Req() req: any,
) {
  return this.bookingsService.getAdminBookings(
    req.user,
  );
}

@UseGuards(JwtAuthGuard)
@Get('my-bookings')
getMyBookings(
  @Req() req: any,
) {
  return this.bookingsService.getMyBookings(
    req.user.id,
  );
}
}