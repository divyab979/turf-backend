import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;

  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsNumber()
  @IsOptional()
  amountPaid?: number;

  @IsBoolean()
  @IsOptional()
  cashPaymentRequested?: boolean;
}