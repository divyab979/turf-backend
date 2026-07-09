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

    const urls = dto.imageUrls || dto.photos;
    if (urls && urls.length > 0) {
      await Promise.all(
        urls.map((url) =>
          this.prisma.venueImage.create({
            data: {
              url,
              venueId: venue.id,
            },
          })
        )
      );
    }

    return this.findOne(venue.id);
  }

  async findAll(
    user: {
      id: string;
      role: string;
      venueId?: string;
    },
    showAll = false
  ) {
    const includeOption = {
      owner: true,
      images: true,
      turfs: {
        include: {
          images: true,
          slots: true,
        },
      },
    };

    let venues: any[] = [];
    if (
      showAll ||
      user.role === "SUPER_ADMIN" ||
      user.role === "CUSTOMER"
    ) {
      venues = await this.prisma.venue.findMany({
        include: includeOption,
      });
    } else if (user.role === "MANAGER") {
      venues = await this.prisma.venue.findMany({
        where: {
          id: user.venueId || "none",
        },
        include: includeOption,
      });
    } else {
      venues = await this.prisma.venue.findMany({
        where: {
          ownerId: user.id,
        },
        include: includeOption,
      });
    }

    return venues.map(venue => this.mapVenueResponse(venue));
  }

  async findOne(id: string) {
    const venue = await this.prisma.venue.findUnique({
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
    return this.mapVenueResponse(venue);
  }

  private mapVenueResponse(venue: any) {
    if (!venue) return null;
    const imageUrls = venue.images?.map((img: any) => img.url) || [];
    const mappedTurfs = venue.turfs?.map((turf: any) => ({
      ...turf,
      basePrice: turf.slots?.[0]?.price || 800,
      images: turf.images
    })) || [];
    return {
      ...venue,
      photos: imageUrls,
      images: imageUrls, // array of string URLs for mobile app compatibility
      courts: mappedTurfs, // alias for mobile app
      turfs: mappedTurfs,
    };
  }

  async update(
    id: string,
    dto: Partial<CreateVenueDto>
  ) {
    console.log("VENUE UPDATE REQUEST RECEIVED - id:", id, "dto:", JSON.stringify(dto, null, 2));
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

    const urls = dto.imageUrls || dto.photos;
    if (urls) {
      await this.prisma.venueImage.deleteMany({
        where: { venueId: id },
      });
      if (urls.length > 0) {
        await Promise.all(
          urls.map((url) =>
            this.prisma.venueImage.create({
              data: {
                url,
                venueId: id,
              },
            })
          )
        );
      }
    }

    return this.findOne(id);
  }
}