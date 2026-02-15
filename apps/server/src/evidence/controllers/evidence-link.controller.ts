import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { EvidenceLinkService } from '../services/evidence-link.service';

type LinkEntityType =
  | 'control'
  | 'layer'
  | 'nonconformity'
  | 'incident'
  | 'risk'
  | 'treatment'
  | 'policy'
  | 'vendor'
  | 'assessment'
  | 'contract'
  | 'asset'
  | 'change'
  | 'application'
  | 'isra';

@Controller('evidence-links')
export class EvidenceLinkController {
  constructor(private readonly service: EvidenceLinkService) {}

  // ============================================
  // LINK EVIDENCE TO ENTITY
  // ============================================

  @Post()
  async linkEvidence(
    @Body()
    data: {
      evidenceId: string;
      entityType: LinkEntityType;
      entityId: string;
      linkType?: string;
      notes?: string;
      createdById?: string;
    },
  ) {
    return this.service.linkEvidence(
      data.evidenceId,
      data.entityType,
      data.entityId,
      data.linkType,
      data.notes,
      data.createdById,
    );
  }

  // ============================================
  // UNLINK EVIDENCE FROM ENTITY
  // ============================================

  @Delete()
  async unlinkEvidence(
    @Query('evidenceId') evidenceId: string,
    @Query('entityType') entityType: LinkEntityType,
    @Query('entityId') entityId: string,
  ) {
    return this.service.unlinkEvidence(evidenceId, entityType, entityId);
  }

  // ============================================
  // GET EVIDENCE FOR ENTITY
  // ============================================

  @Get('entity/:entityType/:entityId')
  async getEvidenceForEntity(
    @Param('entityType') entityType: LinkEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.service.getEvidenceForEntity(entityType, entityId);
  }

  // ============================================
  // BULK LINK
  // ============================================

  @Post('bulk')
  async bulkLinkEvidence(
    @Body()
    data: {
      evidenceIds: string[];
      entityType: LinkEntityType;
      entityId: string;
      linkType?: string;
      createdById?: string;
    },
  ) {
    return this.service.bulkLinkEvidence(
      data.evidenceIds,
      data.entityType,
      data.entityId,
      data.linkType,
      data.createdById,
    );
  }
}

