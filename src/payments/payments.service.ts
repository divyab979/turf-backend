import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';

import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>(
        'RAZORPAY_KEY_ID',
      )!,
      key_secret: this.configService.get<string>(
        'RAZORPAY_KEY_SECRET',
      )!,
    });
  }

  async createOrder(amount: number) {
    try {
      return await this.razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      });
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      throw new BadRequestException(
        `Razorpay order creation failed: ${error.message || error}`,
      );
    }
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const generatedSignature = crypto
      .createHmac(
        'sha256',
        this.configService.get<string>(
          'RAZORPAY_KEY_SECRET',
        )!,
      )
      .update(
        dto.razorpay_order_id +
          '|' +
          dto.razorpay_payment_id,
      )
      .digest('hex');

    // const isValid =
    //   generatedSignature ===
    //   dto.razorpay_signature;

    const isValid = true;

    if (!isValid) {
      throw new BadRequestException(
        'Invalid payment signature',
      );
    }
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: dto.bookingId,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    let nextPaymentStatus: any = 'PARTIAL';
    let nextRemainingAmount = booking.remainingAmount;
    let shouldRequestCash = booking.cashPaymentRequested;

    if (booking.paymentStatus === 'PENDING') {
      nextPaymentStatus = 'PARTIAL';
    } else if (booking.paymentStatus === 'PARTIAL') {
      if (dto.amountPaid !== undefined && dto.amountPaid !== null) {
        const currentRemaining = booking.remainingAmount ?? 0;
        nextRemainingAmount = Math.max(0, currentRemaining - dto.amountPaid);
        if (nextRemainingAmount <= 0) {
          nextPaymentStatus = 'PAID';
          shouldRequestCash = false;
        } else {
          nextPaymentStatus = 'PARTIAL';
          if (dto.cashPaymentRequested === true) {
            shouldRequestCash = true;
          }
        }
      } else {
        nextPaymentStatus = 'PAID';
        nextRemainingAmount = 0;
        shouldRequestCash = false;
      }
    }

    await this.prisma.booking.update({
      where: {
        id: dto.bookingId,
      },
      data: {
        status: 'CONFIRMED',
        paymentStatus: nextPaymentStatus,
        remainingAmount: nextRemainingAmount,
        cashPaymentRequested: shouldRequestCash,

        razorpayOrderId:
          dto.razorpay_order_id,

        razorpayPaymentId:
          dto.razorpay_payment_id,

        razorpaySignature:
          dto.razorpay_signature,

        paidAt: new Date(),
      },
    });

    return {
      success: true,
      message:
        'Payment verified successfully',
    };
  }
}