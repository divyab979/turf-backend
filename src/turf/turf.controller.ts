import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
  Req,
  Patch,
  Delete,
  BadRequestException,
} from "@nestjs/common";
import * as fs from "fs";

import {
  JwtAuthGuard,
} from "../auth/guards/jwt-auth.guard";

import {
  TurfService,
} from "./turf.service";

import {
  CreateTurfDto,
} from "./dto/create-turf.dto";
import {
  CreateMaintenanceDto,
} from "./dto/create-maintenance.dto";

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


@Controller("turfs")
export class TurfController {

  constructor(
    private turfService: TurfService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(":venueId")
  create(
    @Param("venueId")
    venueId: string,

    @Body()
    dto: CreateTurfDto
  ) {

    return this.turfService.create(
      venueId,
      dto
    );
  }

  @UseGuards(JwtAuthGuard)
 @Get(':venueId')
findByVenue(
  @Param('venueId')
  venueId: string,

  @Query('date')
  date?: string,
) {

  return this.turfService.findByVenue(
    venueId,
    date,
  );
}

  @UseGuards(JwtAuthGuard)
  @Post(":turfId/image")
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
    @Param("turfId")
    turfId: string,

    @UploadedFile()
    file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("No image file provided");
    }

    let imageUrl: string;
    try {
      const uploaded = await cloudinary.uploader.upload(
        file.path,
        {
          folder: "gameup11/turfs",
        }
      );
      imageUrl = uploaded.secure_url;
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error("Cloudinary upload error, using base64 fallback:", error);
      const fileBuffer = fs.readFileSync(file.path);
      const mimeType = file.mimetype || "image/jpeg";
      imageUrl = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    return this.turfService.addImage(
      turfId,
      imageUrl
    );
  }

@UseGuards(JwtAuthGuard)
@Post(":turfId/image-url")
async addImageUrl(
  @Param("turfId")
  turfId: string,
  @Body("url")
  url: string
) {
  return this.turfService.addImage(
    turfId,
    url
  );
}

@UseGuards(JwtAuthGuard)
@Post("maintenance")
async createMaintenance(
  @Body()
  dto: CreateMaintenanceDto
) {
  return this.turfService.createMaintenanceIssue(dto);
}

  @UseGuards(JwtAuthGuard)
  @Get("maintenance/list")
  async getMaintenance(
    @Req() req: any
  ) {
    const user = req.user;
    if (user.role === "VENUE_OWNER") {
      return this.turfService.getMaintenanceIssuesByOwner(user.id);
    } else {
      const venueId = user.venueId || "none";
      return this.turfService.getMaintenanceIssuesByVenue(venueId);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch("maintenance/:id/status")
  async updateMaintenanceStatus(
    @Param("id") id: string,
    @Body("status") status: string
  ) {
    return this.turfService.updateMaintenanceIssueStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: any) {
    return this.turfService.remove(id, req.user);
  }
}