import { Controller, Get, Post, Put, Param, Query, Body, Request } from '@nestjs/common';
import { DocumentExceptionService } from '../services/document-exception.service';
import { ExceptionStatus } from '@prisma/client';
import {
  CreateDocumentExceptionDto,
  ApproveExceptionDto,
  CloseExceptionDto,
  ReviewExceptionDto,
} from '../dto/exception.dto';
import { AuthenticatedRequest } from '../../shared/types';

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
  async create(@Request() req: AuthenticatedRequest, @Body() data: CreateDocumentExceptionDto) {
    return this.service.create({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      expiryDate: new Date(data.expiryDate),
      requestedById: req.user.id,
    });
  }

  @Post(':id/approve')
  async approve(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: ApproveExceptionDto,
  ) {
    return this.service.approve(id, { approvedById: req.user.id, approvalComments: data.approvalComments });
  }

  @Post(':id/activate')
  async activate(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.activate(id, req.user.id);
  }

  @Post(':id/revoke')
  async revoke(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: CloseExceptionDto,
  ) {
    return this.service.revoke(id, { reason: data.reason, userId: req.user.id });
  }

  @Post(':id/close')
  async close(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: CloseExceptionDto,
  ) {
    return this.service.close(id, { reason: data.reason, userId: req.user.id });
  }

  @Post(':id/review')
  async review(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: ReviewExceptionDto,
  ) {
    return this.service.review(id, { userId: req.user.id, notes: data.notes });
  }
}
