import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Patch,
  Param,
  Query,
} from "@nestjs/common";

import { VenueService }
  from "./venue.service";

import { CreateVenueDto }
  from "./dto/create-venue.dto";

import { JwtAuthGuard }
  from "../auth/guards/jwt-auth.guard";

@Controller("venues")
export class VenueController {

  constructor(
    private venueService: VenueService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    dto: CreateVenueDto,

    @Request()
    req
  ) {
    return this.venueService.create(
      dto,
      req.user.id
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Request()
    req,
    @Query("all")
    all?: string
  ) {
    const showAll = all === "true";
    return this.venueService.findAll(
      req.user,
      showAll
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findOne(
    @Param("id")
    id: string
  ) {
    return this.venueService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(
    @Param("id")
    id: string,

    @Body()
    dto: Partial<CreateVenueDto>
  ) {
    return this.venueService.update(id, dto);
  }
}