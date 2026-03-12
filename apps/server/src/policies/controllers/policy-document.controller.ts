import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { PolicyDocumentService } from '../services/policy-document.service';
import {
  CreatePolicyDocumentDto,
  UpdatePolicyDocumentDto,
  UpdatePolicyStatusDto,
} from '../dto/policy.dto';
import { DocumentType, DocumentStatus, Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('policies')
export class PolicyDocumentController {
  constructor(private readonly service: PolicyDocumentService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('organisationId') organisationId?: string,
    @Query('documentType') documentType?: DocumentType,
    @Query('status') status?: DocumentStatus,
    @Query('search') search?: string,
    @Query('parentDocumentId') parentDocumentId?: string,
  ) {
    const where: Prisma.PolicyDocumentWhereInput = {};
    
    if (documentType) where.documentType = documentType;
    if (status) where.status = status;
    if (parentDocumentId) where.parentDocumentId = parentDocumentId;
    if (search) {
      where.OR = [
        { documentId: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
      organisationId,
    });
  }

  @Get('stats')
  async getStats(@Query('organisationId') organisationId: string) {
    return this.service.getStats(organisationId);
  }

  @Get('hierarchy')
  async getHierarchy(@Query('organisationId') organisationId: string) {
    return this.service.getHierarchy(organisationId);
  }

  @Get('upcoming-reviews')
  async getUpcomingReviews(
    @Query('organisationId') organisationId: string,
    @Query('days') days?: string,
  ) {
    return this.service.getUpcomingReviews(organisationId, days ? parseInt(days) : 30);
  }

  @Get('overdue-reviews')
  async getOverdueReviews(@Query('organisationId') organisationId: string) {
    return this.service.getOverdueReviews(organisationId);
  }

  @Get('search')
  async search(
    @Query('organisationId') organisationId: string,
    @Query('query') query?: string,
    @Query('documentType') documentType?: DocumentType,
    @Query('status') status?: DocumentStatus,
    @Query('tags') tags?: string,
    @Query('controlId') controlId?: string,
    @Query('riskId') riskId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.search({
      organisationId,
      query,
      documentType,
      status,
      tags: tags ? tags.split(',') : undefined,
      controlId,
      riskId,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('generate-id')
  async generateDocumentId(
    @Query('organisationId') organisationId: string,
    @Query('documentType') documentType: DocumentType,
    @Query('parentDocumentId') parentDocumentId?: string,
  ) {
    const documentId = await this.service.generateDocumentId(documentType, organisationId, parentDocumentId);
    return { documentId };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreatePolicyDocumentDto,
  ) {
    const { organisationId, ...rest } = dto;
    return this.service.create({
      ...rest,
      organisation: { connect: { id: organisationId } },
    }, req.user.id);
  }

  @Put(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDocumentDto,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Put(':id/status')
  async updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdatePolicyStatusDto,
  ) {
    return this.service.updateStatus(id, data.status, req.user.id);
  }

  @Delete(':id')
  async delete(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('hard') hard?: string,
  ) {
    return this.service.delete(id, req.user.id, hard !== 'true');
  }
}
