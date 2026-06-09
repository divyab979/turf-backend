import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";

import { AuthService } from "./auth.service";

import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { GoogleLoginDto } from "./dto/google-login.dto";

import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {

  constructor(
    private authService: AuthService
  ) {}

  @Post("signup")
  signup(
    @Body()
    dto: SignupDto
  ) {
    return this.authService.signup(dto);
  }

  @Post("login")
  login(
    @Body()
    dto: LoginDto
  ) {
    return this.authService.login(dto);
  }

  @Post("google")
  googleLogin(
    @Body()
    dto: GoogleLoginDto
  ) {
    return this.authService.googleLogin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@Request() req) {
    return req.user;
  }

  @Post('customer-signup')
  customerSignup(
    @Body()
    dto: SignupDto,
  ) {

    return this.authService
      .customerSignup(dto);
  }
}