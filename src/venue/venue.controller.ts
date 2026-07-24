import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Patch,
  Delete,
  Param,
  Query,
  BadRequestException,
} from "@nestjs/common";
import * as fs from "fs";

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
            destination: (req, file, cb) => {
              const uploadDir = "./uploads";
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }
              cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
              const safeName = file.originalname.replace(/\s+/g, "_");
              cb(null, `${Date.now()}-${safeName}`);
            },
          }),
      }
    )
  )
  async uploadImage(
    @UploadedFile()
    file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("No image file provided");
    }

    try {
      const uploaded = await cloudinary.uploader.upload(
        file.path,
        {
          folder: "gameup11/venues",
        }
      );

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        url: uploaded.secure_url,
      };
    } catch (error) {
      console.error("Cloudinary upload failed, falling back to base64 data URL:", error);
      const fileBuffer = fs.readFileSync(file.path);
      const mimeType = file.mimetype || "image/jpeg";
      const base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        url: base64Data,
      };
    }
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

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: any) {
    return this.venueService.remove(id, req.user);
  }
}