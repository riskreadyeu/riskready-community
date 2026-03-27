import { Controller, Get, Post, Param, Query, Body, Request } from '@nestjs/common';
import { DocumentVersionService } from '../services/document-version.service';
import {
  CreateDocumentVersionRequestDto,
  RollbackDocumentVersionDto,
} from '../dto/workflow.dto';
import { AuthenticatedRequest } from '../../shared/types';

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
    @Request() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
    @Body() data: CreateDocumentVersionRequestDto,
  ) {
    return this.service.createVersion({
      documentId,
      ...data,
      userId: req.user.id,
    });
  }

  @Post('rollback')
  async rollback(
    @Request() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
    @Body() data: RollbackDocumentVersionDto,
  ) {
    return this.service.rollback(documentId, data.targetVersion, req.user.id);
  }
}
