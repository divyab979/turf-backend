import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  constructor() {
    const dbUrl = (process.env.DATABASE_URL || "postgresql://gameup_user:StrongPassword123@localhost:5432/gameup").replace(/^"|"$/g, '');
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}