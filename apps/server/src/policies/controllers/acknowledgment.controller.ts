import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { AcknowledgmentService } from '../services/acknowledgment.service';
import { AcknowledgmentMethod } from '@prisma/client';

@Controller('acknowledgments')
export class AcknowledgmentController {
  constructor(private readonly service: AcknowledgmentService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('documentId') documentId?: string,
    @Query('userId') userId?: string,
    @Query('isAcknowledged') isAcknowledged?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      documentId,
      userId,
      isAcknowledged: isAcknowledged !== undefined ? isAcknowledged === 'true' : undefined,
    });
  }

  @Get('stats')
  async getStats(@Query('organisationId') organisationId: string) {
    return this.service.getStats(organisationId);
  }

  @Get('pending')
  async getUserPendingAcknowledgments(@Query('userId') userId: string) {
    return this.service.getUserPendingAcknowledgments(userId);
  }

  @Get('overdue')
  async getOverdueAcknowledgments(@Query('organisationId') organisationId: string) {
    return this.service.getOverdueAcknowledgments(organisationId);
  }

  @Get('document/:documentId')
  async getDocumentAcknowledgments(@Param('documentId') documentId: string) {
    return this.service.getDocumentAcknowledgments(documentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('request')
  async createAcknowledgmentRequest(@Body() data: {
    documentId: string;
    userIds: string[];
    dueDate?: string;
  }) {
    return this.service.createAcknowledgmentRequest({
      documentId: data.documentId,
      userIds: data.userIds,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
  }

  @Post(':id/acknowledge')
  async acknowledge(
    @Param('id') id: string,
    @Body() data: {
      method: AcknowledgmentMethod;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    return this.service.acknowledge(id, data);
  }

  @Post(':id/reminder')
  async sendReminder(@Param('id') id: string) {
    return this.service.sendReminder(id);
  }

  @Post('bulk-remind')
  async bulkSendReminders(@Body() data: {
    organisationId: string;
    overdueOnly?: boolean;
  }) {
    return this.service.bulkSendReminders(data.organisationId, data.overdueOnly);
  }
}
