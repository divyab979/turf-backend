import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

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

  @UseGuards(JwtAuthGuard)
  @Post(':id/request-cash-payment')
  requestCashPayment(
    @Param('id') bookingId: string,
    @Req() req: any,
  ) {
    return this.bookingsService.requestCashPayment(bookingId, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER, Role.MANAGER, Role.SUPER_ADMIN)
  @Post(':id/confirm-cash-payment')
  confirmCashPayment(
    @Param('id') bookingId: string,
  ) {
    return this.bookingsService.confirmCashPayment(bookingId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENUE_OWNER, Role.MANAGER, Role.SUPER_ADMIN)
  @Post('custom')
  createCustomBooking(
    @Body() dto: {
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
    @Req() req: any,
  ) {
    return this.bookingsService.createCustomBooking(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  markAsCompleted(
    @Param('id') bookingId: string,
  ) {
    return this.bookingsService.markAsCompleted(bookingId);
  }
}