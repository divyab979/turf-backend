import {
  IsNotEmpty,
  IsString,
} from "class-validator";

export class CreateVenueDto {

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;
}