import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { AuthService } from "./auth.service";

import { AuthController } from "./auth.controller";

import { UsersModule } from "../users/users.module";
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    FirebaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") || "secret",
        signOptions: {
          expiresIn: "7d",
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}