import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { DocumentMappingService } from '../services/document-mapping.service';
import { ControlMappingType, CoverageLevel, RiskRelationshipType, DocumentRelationType } from '@prisma/client';

@Controller('policies')
export class DocumentMappingController {
  constructor(private readonly service: DocumentMappingService) {}

  // =============================================
  // CONTROL MAPPINGS
  // =============================================

  @Get(':documentId/controls')
  async getControlMappings(@Param('documentId') documentId: string) {
    return this.service.getControlMappings(documentId);
  }

  @Post(':documentId/controls')
  async addControlMapping(
    @Param('documentId') documentId: string,
    @Body() data: {
      controlId: string;
      mappingType?: ControlMappingType;
      coverage?: CoverageLevel;
      notes?: string;
      evidenceRequired?: boolean;
      evidenceDescription?: string;
      createdById?: string;
    },
  ) {
    return this.service.addControlMapping({ documentId, ...data });
  }

  @Put('control-mappings/:id')
  async updateControlMapping(
    @Param('id') id: string,
    @Body() data: {
      mappingType?: ControlMappingType;
      coverage?: CoverageLevel;
      notes?: string;
      evidenceRequired?: boolean;
      evidenceDescription?: string;
    },
  ) {
    return this.service.updateControlMapping(id, data);
  }

  @Delete('control-mappings/:id')
  async removeControlMapping(@Param('id') id: string) {
    return this.service.removeControlMapping(id);
  }

  @Get('by-control/:controlId')
  async getDocumentsByControl(@Param('controlId') controlId: string) {
    return this.service.getDocumentsByControl(controlId);
  }

  // =============================================
  // RISK MAPPINGS
  // =============================================

  @Get(':documentId/risks')
  async getRiskMappings(@Param('documentId') documentId: string) {
    return this.service.getRiskMappings(documentId);
  }

  @Post(':documentId/risks')
  async addRiskMapping(
    @Param('documentId') documentId: string,
    @Body() data: {
      riskId: string;
      relationshipType?: RiskRelationshipType;
      notes?: string;
      createdById?: string;
    },
  ) {
    return this.service.addRiskMapping({ documentId, ...data });
  }

  @Put('risk-mappings/:id')
  async updateRiskMapping(
    @Param('id') id: string,
    @Body() data: {
      relationshipType?: RiskRelationshipType;
      notes?: string;
    },
  ) {
    return this.service.updateRiskMapping(id, data);
  }

  @Delete('risk-mappings/:id')
  async removeRiskMapping(@Param('id') id: string) {
    return this.service.removeRiskMapping(id);
  }

  @Get('by-risk/:riskId')
  async getDocumentsByRisk(@Param('riskId') riskId: string) {
    return this.service.getDocumentsByRisk(riskId);
  }

  // =============================================
  // DOCUMENT RELATIONS
  // =============================================

  @Get(':documentId/relations')
  async getDocumentRelations(@Param('documentId') documentId: string) {
    return this.service.getDocumentRelations(documentId);
  }

  @Post(':documentId/relations')
  async addDocumentRelation(
    @Param('documentId') sourceDocumentId: string,
    @Body() data: {
      targetDocumentId: string;
      relationType: DocumentRelationType;
      description?: string;
      createdById?: string;
    },
  ) {
    return this.service.addDocumentRelation({ sourceDocumentId, ...data });
  }

  @Delete('relations/:id')
  async removeDocumentRelation(@Param('id') id: string) {
    return this.service.removeDocumentRelation(id);
  }

  // =============================================
  // COVERAGE ANALYSIS
  // =============================================

  @Get('reports/control-coverage')
  async getControlCoverageReport(@Query('organisationId') organisationId: string) {
    return this.service.getControlCoverageReport(organisationId);
  }

  @Get('reports/gap-analysis')
  async getGapAnalysis(@Query('organisationId') organisationId: string) {
    return this.service.getGapAnalysis(organisationId);
  }
}
