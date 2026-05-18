import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";

import * as bcrypt from "bcrypt";

import { SignupDto } from "./dto/signup.dto";

import { LoginDto } from "./dto/login.dto";

import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,

    private jwtService: JwtService
  ) {}

  async signup(dto: SignupDto) {

    const existingUser =
      await this.usersService.findByEmail(
        dto.email
      );

    if (existingUser) {
      throw new BadRequestException(
        "User already exists"
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        dto.password,
        10
      );

    const user =
      await this.usersService.createUser({
        ...dto,
        password: hashedPassword,
      });

    return {
      message:
        "Signup successful",

      user,
    };
  }

  async login(dto: LoginDto) {

  const user =
    await this.usersService.findByEmail(
      dto.email
    );

  if (!user) {
    throw new UnauthorizedException(
      "Invalid credentials"
    );
  }

  const passwordMatch =
    await bcrypt.compare(
      dto.password,
      user.password
    );

  if (!passwordMatch) {
    throw new UnauthorizedException(
      "Invalid credentials"
    );
  }

  const token =
  await this.jwtService.signAsync({
    sub: user.id,

    role: user.role,

    email: user.email,

    name: user.name,
  });

  const { password, ...safeUser } = user;

  return {
    access_token: token,

    user: safeUser,
  };
}
async customerSignup(
  dto: SignupDto,
) {
  const existingUser =
    await this.usersService.findByEmail(
      dto.email
    );

  if (existingUser) {
    throw new BadRequestException(
      "User already exists"
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      dto.password,
      10,
    );

  const user =
    await this.usersService.createUser({
      ...dto,
      password: hashedPassword,
      role: "CUSTOMER",
    });

  return {
    message:
      "Signup successful",
    user,
  };
}
}