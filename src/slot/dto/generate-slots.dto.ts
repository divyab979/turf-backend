import {
  IsInt,
  IsString,
  Min,
} from "class-validator";

export class GenerateSlotsDto {

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsInt()
  morningPrice: number;

  @IsInt()
  eveningPrice: number;

  @IsInt()
  days: number;
}