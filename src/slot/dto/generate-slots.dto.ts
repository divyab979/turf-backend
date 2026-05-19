import {
  IsInt,
  IsString,
  Min,
  IsArray,
  IsOptional,
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

  @IsOptional()
  @IsInt()
  days?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  daysOfWeek?: number[];
}