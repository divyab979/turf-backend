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
    venueId?: string;
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

    if (user.role === "MANAGER") {
      return this.prisma.venue.findMany({
        where: {
          id: user.venueId || "none",
        },
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

  update(
    id: string,
    dto: { name?: string; location?: string }
  ) {
    return this.prisma.venue.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        location: dto.location,
      },
    });
  }
}