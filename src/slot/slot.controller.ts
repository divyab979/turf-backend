import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt-auth.guard";

import {
  SlotService,
} from "./slot.service";

import {
  GenerateSlotsDto,
} from "./dto/generate-slots.dto";

@Controller("slots")
export class SlotController {

  constructor(
    private slotService: SlotService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(":turfId/generate")
  generateSlots(

    @Param("turfId")
    turfId: string,

    @Body()
    dto: GenerateSlotsDto
  ) {

    return this.slotService.generateSlots(
      turfId,
      dto
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(":turfId")
  findByTurf(

    @Param("turfId")
    turfId: string
  ) {

    return this.slotService.findByTurf(
      turfId
    );
  }
}