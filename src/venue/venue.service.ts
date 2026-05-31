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

  async create(
    dto: CreateVenueDto,
    ownerId: string
  ) {
    const venue = await this.prisma.venue.create({
      data: {
        name: dto.name,
        location: dto.location,
        address: dto.address,
        ownerId,
        businessType: dto.businessType || "TURF",
        bookingMode: dto.bookingMode || "FIXED_SLOTS",
        gamesHosted: dto.gamesHosted || [],
        numPoolTables: dto.numPoolTables,
        numSnookerTables: dto.numSnookerTables,
        numTvScreens: dto.numTvScreens,
        numPsConsoles: dto.numPsConsoles,
        numControllers: dto.numControllers,
        description: dto.description,
        amenities: dto.amenities || [],
      },
    });

    if (dto.imageUrls && dto.imageUrls.length > 0) {
      await this.prisma.venueImage.createMany({
        data: dto.imageUrls.map((url) => ({
          url,
          venueId: venue.id,
        })),
      });
    }

    return this.findOne(venue.id);
  }

  findAll(user: {
    id: string;
    role: string;
    venueId?: string;
  }) {
    const includeOption = {
      owner: true,
      images: true,
      turfs: {
        include: {
          images: true,
        },
      },
    };

    if (
      user.role === "SUPER_ADMIN" ||
      user.role === "CUSTOMER"
    ) {
      return this.prisma.venue.findMany({
        include: includeOption,
      });
    }

    if (user.role === "MANAGER") {
      return this.prisma.venue.findMany({
        where: {
          id: user.venueId || "none",
        },
        include: includeOption,
      });
    }

    return this.prisma.venue.findMany({
      where: {
        ownerId: user.id,
      },
      include: includeOption,
    });
  }

  findOne(id: string) {
    return this.prisma.venue.findUnique({
      where: {
        id,
      },
      include: {
        owner: true,
        images: true,
        turfs: {
          include: {
            slots: true,
            images: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    dto: Partial<CreateVenueDto>
  ) {
    const updateData: any = {
      name: dto.name,
      location: dto.location,
      address: dto.address,
      businessType: dto.businessType,
      bookingMode: dto.bookingMode,
      gamesHosted: dto.gamesHosted,
      numPoolTables: dto.numPoolTables,
      numSnookerTables: dto.numSnookerTables,
      numTvScreens: dto.numTvScreens,
      numPsConsoles: dto.numPsConsoles,
      numControllers: dto.numControllers,
      description: dto.description,
      amenities: dto.amenities,
    };

    // Filter undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    await this.prisma.venue.update({
      where: {
        id,
      },
      data: updateData,
    });

    if (dto.imageUrls) {
      await this.prisma.venueImage.deleteMany({
        where: { venueId: id },
      });
      if (dto.imageUrls.length > 0) {
        await this.prisma.venueImage.createMany({
          data: dto.imageUrls.map((url) => ({
            url,
            venueId: id,
          })),
        });
      }
    }

    return this.findOne(id);
  }
}