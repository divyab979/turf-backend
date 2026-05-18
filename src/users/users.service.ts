import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {

  constructor(
    private prisma: PrismaService
  ) {}

  findByEmail(email: string) {

    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  createUser(data: {
    name: string;
    email: string;
    password: string;
    role: any;
  }) {

    return this.prisma.user.create({
      data,
    });
  }
}