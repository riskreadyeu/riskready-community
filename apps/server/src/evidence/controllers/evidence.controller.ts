import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { EvidenceService } from '../services/evidence.service';
import { CreateEvidenceDto } from '../dto/evidence.dto';
import {
  EvidenceType,
  EvidenceStatus,
  EvidenceClassification,
  EvidenceSourceType,
} from '@prisma/client';

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
    @Body() data: CreateEvidenceDto & {
      fileName?: string;
      originalFileName?: string;
      fileUrl?: string;
      fileSizeBytes?: number;
      mimeType?: string;
      storagePath?: string;
      storageProvider?: string;
      isEncrypted?: boolean;
      hashSha256?: string;
      hashMd5?: string;
      metadata?: any;
    },
  ) {
    return this.service.create({
      ...data,
      collectedAt: data.collectedAt ? new Date(data.collectedAt) : undefined,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      retainUntil: data.retainUntil ? new Date(data.retainUntil) : undefined,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      description?: string;
      evidenceType?: EvidenceType;
      classification?: EvidenceClassification;
      tags?: string[];
      category?: string;
      subcategory?: string;
      fileName?: string;
      originalFileName?: string;
      fileUrl?: string;
      fileSizeBytes?: number;
      mimeType?: string;
      storagePath?: string;
      storageProvider?: string;
      isEncrypted?: boolean;
      hashSha256?: string;
      hashMd5?: string;
      isForensicallySound?: boolean;
      chainOfCustodyNotes?: string;
      sourceType?: EvidenceSourceType;
      sourceSystem?: string;
      sourceReference?: string;
      collectionMethod?: string;
      validFrom?: string;
      validUntil?: string;
      retainUntil?: string;
      renewalRequired?: boolean;
      renewalReminderDays?: number;
      metadata?: any;
      notes?: string;
      updatedById: string;
    },
  ) {
    return this.service.update(id, {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      retainUntil: data.retainUntil ? new Date(data.retainUntil) : undefined,
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
    @Param('id') id: string,
    @Body() data: { userId: string },
  ) {
    return this.service.submitForReview(id, data.userId);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() data: { userId: string; notes?: string },
  ) {
    return this.service.approve(id, data.userId, data.notes);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() data: { userId: string; reason: string },
  ) {
    return this.service.reject(id, data.userId, data.reason);
  }

  @Post(':id/archive')
  async archive(
    @Param('id') id: string,
    @Body() data: { userId: string },
  ) {
    return this.service.archive(id, data.userId);
  }

  @Post(':id/new-version')
  async createNewVersion(
    @Param('id') id: string,
    @Body()
    data: {
      title: string;
      description?: string;
      evidenceType: EvidenceType;
      classification?: EvidenceClassification;
      fileName?: string;
      fileUrl?: string;
      fileSizeBytes?: number;
      mimeType?: string;
      hashSha256?: string;
      hashMd5?: string;
      validFrom?: string;
      validUntil?: string;
      notes?: string;
      createdById: string;
    },
  ) {
    return this.service.createNewVersion(id, {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    });
  }
}

