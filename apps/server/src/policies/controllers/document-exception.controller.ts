import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { DocumentExceptionService } from '../services/document-exception.service';
import { ExceptionStatus, ApprovalLevel, ReviewFrequency } from '@prisma/client';

@Controller('exceptions')
export class DocumentExceptionController {
  constructor(private readonly service: DocumentExceptionService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('organisationId') organisationId?: string,
    @Query('documentId') documentId?: string,
    @Query('status') status?: ExceptionStatus,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      organisationId,
      documentId,
      status,
    });
  }

  @Get('stats')
  async getStats(@Query('organisationId') organisationId: string) {
    return this.service.getStats(organisationId);
  }

  @Get('expiring')
  async getExpiring(
    @Query('organisationId') organisationId: string,
    @Query('days') days?: string,
  ) {
    return this.service.getExpiring(organisationId, days ? parseInt(days) : 30);
  }

  @Get('expired')
  async getExpired(@Query('organisationId') organisationId: string) {
    return this.service.getExpired(organisationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: {
    documentId: string;
    organisationId: string;
    title: string;
    description: string;
    justification: string;
    scope: string;
    affectedEntities?: string[];
    riskAssessment: string;
    residualRisk: string;
    compensatingControls?: string;
    startDate?: string;
    expiryDate: string;
    approvalLevel: ApprovalLevel;
    reviewFrequency?: ReviewFrequency;
    requestedById: string;
  }) {
    return this.service.create({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      expiryDate: new Date(data.expiryDate),
    });
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() data: { approvedById: string; approvalComments?: string },
  ) {
    return this.service.approve(id, data);
  }

  @Post(':id/activate')
  async activate(
    @Param('id') id: string,
    @Body() data: { userId: string },
  ) {
    return this.service.activate(id, data.userId);
  }

  @Post(':id/revoke')
  async revoke(
    @Param('id') id: string,
    @Body() data: { reason: string; userId: string },
  ) {
    return this.service.revoke(id, data);
  }

  @Post(':id/close')
  async close(
    @Param('id') id: string,
    @Body() data: { reason: string; userId: string },
  ) {
    return this.service.close(id, data);
  }

  @Post(':id/review')
  async review(
    @Param('id') id: string,
    @Body() data: { userId: string; notes?: string },
  ) {
    return this.service.review(id, data);
  }
}
