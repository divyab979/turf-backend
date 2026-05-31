import {
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
  ) {}

  @Post('create-order')
  async createOrder(
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createOrder(
      dto.amount,
    );
  }

  @Post('verify')
  async verify(
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(
      dto,
    );
  }

  @Post('webhook')
  async handleWebhook(@Req() req) {
    console.log(req.body);

    return {
      received: true,
    };
  }
}