import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { DocumentVersionService } from '../services/document-version.service';
import { ChangeType } from '@prisma/client';

@Controller('policies/:documentId/versions')
export class DocumentVersionController {
  constructor(private readonly service: DocumentVersionService) {}

  @Get()
  async findAll(@Param('documentId') documentId: string) {
    return this.service.findAll(documentId);
  }

  @Get('history')
  async getVersionHistory(
    @Param('documentId') documentId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.getVersionHistory(documentId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('compare')
  async compareVersions(
    @Param('documentId') documentId: string,
    @Query('v1') version1: string,
    @Query('v2') version2: string,
  ) {
    return this.service.compareVersions(documentId, version1, version2);
  }

  @Get(':version')
  async findByVersion(
    @Param('documentId') documentId: string,
    @Param('version') version: string,
  ) {
    return this.service.findByVersion(documentId, version);
  }

  @Post()
  async createVersion(
    @Param('documentId') documentId: string,
    @Body() data: {
      changeDescription: string;
      changeSummary?: string;
      changeType: ChangeType;
      isMajor?: boolean;
      userId?: string;
    },
  ) {
    return this.service.createVersion({
      documentId,
      ...data,
    });
  }

  @Post('rollback')
  async rollback(
    @Param('documentId') documentId: string,
    @Body() data: { targetVersion: string; userId?: string },
  ) {
    return this.service.rollback(documentId, data.targetVersion, data.userId);
  }
}
