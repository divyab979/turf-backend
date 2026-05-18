import {
  Injectable,
} from "@nestjs/common";

import { PrismaService }
  from "../prisma/prisma.service";

import { CreateVenueDto }
  from "./dto/create-venue.dto";

@Injectable()
export class VenueService {

  constructor(
    private prisma: PrismaService
  ) {}

  create(
    dto: CreateVenueDto,
    ownerId: string
  ) {
    return this.prisma.venue.create({
      data: {
        name: dto.name,
        location: dto.location,
        ownerId,
      },
    });
  }

  findAll(user: {
    id: string;
    role: string;
  }) {
    if (
      user.role === "SUPER_ADMIN" ||
      user.role === "CUSTOMER"
    ) {
      return this.prisma.venue.findMany({
        include: {
          owner: true,
          turfs: true,
        },
      });
    }

    return this.prisma.venue.findMany({
      where: {
        ownerId: user.id,
      },
      include: {
        owner: true,
        turfs: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.venue.findUnique({
      where: {
        id,
      },
      include: {
        owner: true,
        turfs: {
          include: {
            slots: true,
          },
        },
      },
    });
  }
}