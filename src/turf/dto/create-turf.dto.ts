import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

import {
  SportType,
} from "@prisma/client";

export class CreateTurfDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SportType)
  sport: SportType;

  @IsOptional()
  @IsString()
  description?: string;
}