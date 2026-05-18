import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
} from "class-validator";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",

  VENUE_OWNER = "VENUE_OWNER",

  MANAGER = "MANAGER",

  STAFF = "STAFF",

  CUSTOMER = "CUSTOMER",
}

export class SignupDto {

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}