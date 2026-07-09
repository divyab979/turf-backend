import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  turfId: string;

  @IsString()
  @IsNotEmpty()
  issue: string;

  @IsString()
  @IsNotEmpty()
  severity: string;

  @IsOptional()
  @IsString()
  supervisor?: string;
}
