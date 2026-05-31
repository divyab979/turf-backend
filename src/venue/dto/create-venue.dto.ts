import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsArray,
} from "class-validator";

export class CreateVenueDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  bookingMode?: string;

  @IsArray()
  @IsOptional()
  gamesHosted?: string[];

  @IsInt()
  @IsOptional()
  numPoolTables?: number;

  @IsInt()
  @IsOptional()
  numSnookerTables?: number;

  @IsInt()
  @IsOptional()
  numTvScreens?: number;

  @IsInt()
  @IsOptional()
  numPsConsoles?: number;

  @IsInt()
  @IsOptional()
  numControllers?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsOptional()
  imageUrls?: string[];
}