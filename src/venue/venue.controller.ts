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

import {
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";

import {
  FileInterceptor,
} from "@nestjs/platform-express";

import cloudinary
  from "../lib/cloudinary";

import {
  diskStorage,
} from "multer";

@Controller("venues")
export class VenueController {

  constructor(
    private venueService: VenueService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("upload-image")
  @UseInterceptors(
    FileInterceptor(
      "file",
      {
        storage:
          diskStorage({
            destination:
              "./uploads",

            filename:
              (
                req,
                file,
                cb
              ) => {
                cb(
                  null,
                  `${Date.now()}-${file.originalname}`
                );
              },
          }),
      }
    )
  )
  async uploadImage(
    @UploadedFile()
    file: Express.Multer.File
  ) {
    const uploaded =
      await cloudinary.uploader.upload(
        file.path,
        {
          folder:
            "gameup11/venues",
        }
      );

    return {
      url: uploaded.secure_url,
    };
  }

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