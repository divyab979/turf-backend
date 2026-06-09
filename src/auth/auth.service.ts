import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";

import * as bcrypt from "bcrypt";

import { SignupDto } from "./dto/signup.dto";

import { LoginDto } from "./dto/login.dto";
import { GoogleLoginDto } from "./dto/google-login.dto";

import { UsersService } from "../users/users.service";
import { FirebaseService } from "../firebase/firebase.service";

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService
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

    venueId: user.venueId,
  });

  const { password, ...safeUser } = user;
  return {
    access_token: token,

    user: safeUser,
  };
}

async googleLogin(dto: GoogleLoginDto) {
  try {
    const decodedToken = await this.firebaseService.verifyIdToken(dto.idToken);
    const { email, name, picture } = decodedToken;

    if (!email) {
      throw new BadRequestException("Email is required but was not found in the Google ID Token");
    }

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create user with CUSTOMER role and dummy password to satisfy Prisma DB constraints
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await this.usersService.createUser({
        email,
        name: name || email.split("@")[0],
        password: dummyPassword,
        role: "CUSTOMER",
      });
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      venueId: user.venueId,
    });

    const { password, ...safeUser } = user;

    return {
      access_token: token,
      user: safeUser,
    };
  } catch (error) {
    throw new UnauthorizedException("Google login failed: " + error.message);
  }
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