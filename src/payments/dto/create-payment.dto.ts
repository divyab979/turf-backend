import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  bookingId: string;
}