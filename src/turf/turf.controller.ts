import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
  Req,
  Patch
} from "@nestjs/common";

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

  @Param("turfId")
  turfId: string,

  @UploadedFile()
  file: Express.Multer.File
) {

  const uploaded =
    await cloudinary.uploader.upload(
      file.path,
      {
        folder:
          "gameup11/turfs",
      }
    );

  return this.turfService.addImage(
    turfId,
    uploaded.secure_url
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
}