import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";

import { VenueService }
  from "./venue.service";

import { CreateVenueDto }
  from "./dto/create-venue.dto";

import { JwtAuthGuard }
  from "../auth/guards/jwt-auth.guard";

import {
  Param,
} from "@nestjs/common";

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
  req
) {
  return this.venueService.findAll(
    req.user
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
}