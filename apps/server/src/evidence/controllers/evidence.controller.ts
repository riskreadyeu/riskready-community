import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { EvidenceService } from '../services/evidence.service';
import {
  CreateEvidenceRecordDto,
  UpdateEvidenceDto,
  ApproveEvidenceDto,
  RejectEvidenceDto,
  CreateEvidenceVersionDto,
} from '../dto/evidence.dto';
import {
  EvidenceType,
  EvidenceStatus,
  EvidenceClassification,
  EvidenceSourceType,
} from '@prisma/client';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('evidence')
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('evidenceType') evidenceType?: EvidenceType,
    @Query('status') status?: EvidenceStatus,
    @Query('classification') classification?: EvidenceClassification,
    @Query('sourceType') sourceType?: EvidenceSourceType,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('collectedById') collectedById?: string,
    @Query('validUntilBefore') validUntilBefore?: string,
    @Query('validUntilAfter') validUntilAfter?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      evidenceType,
      status,
      classification,
      sourceType,
      category,
      search,
      collectedById,
      validUntilBefore: validUntilBefore ? new Date(validUntilBefore) : undefined,
      validUntilAfter: validUntilAfter ? new Date(validUntilAfter) : undefined,
    });
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get('expiring')
  async getExpiring(@Query('days') days?: string) {
    return this.service.getExpiring(days ? parseInt(days, 10) : 30);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() data: CreateEvidenceRecordDto,
  ) {
    return this.service.create({
      ...data,
      collectedAt: data.collectedAt ? new Date(data.collectedAt) : undefined,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      retainUntil: data.retainUntil ? new Date(data.retainUntil) : undefined,
      createdById: req.user.id,
    });
  }

  @Put(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdateEvidenceDto,
  ) {
    return this.service.update(id, {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      retainUntil: data.retainUntil ? new Date(data.retainUntil) : undefined,
      updatedById: req.user.id,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // ============================================
  // WORKFLOW ACTIONS
  // ============================================

  @Post(':id/submit-for-review')
  async submitForReview(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.submitForReview(id, req.user.id);
  }

  @Post(':id/approve')
  async approve(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: ApproveEvidenceDto,
  ) {
    return this.service.approve(id, req.user.id, data.notes);
  }

  @Post(':id/reject')
  async reject(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: RejectEvidenceDto,
  ) {
    return this.service.reject(id, req.user.id, data.reason);
  }

  @Post(':id/archive')
  async archive(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.archive(id, req.user.id);
  }

  @Post(':id/new-version')
  async createNewVersion(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: CreateEvidenceVersionDto,
  ) {
    return this.service.createNewVersion(id, {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      createdById: req.user.id,
    });
  }
}
