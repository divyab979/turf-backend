import { IsString } from 'class-validator'

export class LockSlotDto {
  @IsString()
  slotId: string
}