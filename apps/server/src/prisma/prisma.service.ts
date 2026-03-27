import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createAuditMiddleware } from './prisma-audit.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    this.$use(createAuditMiddleware(this));
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
