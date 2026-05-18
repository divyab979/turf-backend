import { IsString } from 'class-validator'

export class ConfirmBookingDto {
  @IsString()
  slotId: string
}