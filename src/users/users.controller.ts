import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("staff")
  @Roles(Role.VENUE_OWNER, Role.SUPER_ADMIN)
  async getStaff(@Req() req: any) {
    return this.usersService.findStaff(req.user);
  }

  @Get("owners")
  @Roles(Role.SUPER_ADMIN)
  async getOwners() {
    return this.usersService.findOwners();
  }

  @Post("staff")
  @Roles(Role.VENUE_OWNER)
  async createStaff(@Req() req: any, @Body() body: any) {
    const { name, email, password, venueId } = body;
    if (!name || !email || !password || !venueId) {
      throw new BadRequestException("Missing required fields");
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = await this.usersService.createUser({
      name,
      email,
      password: hashedPassword,
      role: Role.MANAGER,
      venueId,
    });

    const { password: _, ...safeStaff } = staff;
    return safeStaff;
  }

  @Delete("staff/:id")
  @Roles(Role.VENUE_OWNER)
  async deleteStaff(@Req() req: any, @Param("id") id: string) {
    const result = await this.usersService.deleteStaff(id, req.user.id);
    return {
      message: "Staff member deleted successfully",
      count: result.count,
    };
  }

  @Post("owners/:id/toggle-status")
  @Roles(Role.SUPER_ADMIN)
  async toggleOwnerStatus(@Param("id") id: string) {
    return this.usersService.toggleOwnerStatus(id);
  }
}
