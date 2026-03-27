import { Controller, Get, Post, Put, Delete, Param, Query, Body, Request } from '@nestjs/common';
import { DocumentMappingService } from '../services/document-mapping.service';
import {
  AddControlMappingDto,
  UpdateControlMappingDto,
  AddRiskMappingDto,
  UpdateRiskMappingDto,
  AddDocumentRelationDto,
} from '../dto/mapping.dto';
import { AuthenticatedRequest } from '../../shared/types';

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
    @Request() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
    @Body() data: AddControlMappingDto,
  ) {
    return this.service.addControlMapping({ documentId, ...data, createdById: req.user.id });
  }

  @Put('control-mappings/:id')
  async updateControlMapping(
    @Param('id') id: string,
    @Body() data: UpdateControlMappingDto,
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
    @Request() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
    @Body() data: AddRiskMappingDto,
  ) {
    return this.service.addRiskMapping({ documentId, ...data, createdById: req.user.id });
  }

  @Put('risk-mappings/:id')
  async updateRiskMapping(
    @Param('id') id: string,
    @Body() data: UpdateRiskMappingDto,
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
    @Request() req: AuthenticatedRequest,
    @Param('documentId') sourceDocumentId: string,
    @Body() data: AddDocumentRelationDto,
  ) {
    return this.service.addDocumentRelation({ sourceDocumentId, ...data, createdById: req.user.id });
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
