import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ChangeRequestService } from '../services/change-request.service';
import { ChangeRequestStatus, ChangePriority, ChangeType } from '@prisma/client';

@Controller('change-requests')
export class ChangeRequestController {
  constructor(private readonly service: ChangeRequestService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('organisationId') organisationId?: string,
    @Query('documentId') documentId?: string,
    @Query('status') status?: ChangeRequestStatus,
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
    changeType: ChangeType;
    priority: ChangePriority;
    impactAssessment?: string;
    affectedDocuments?: string[];
    affectedProcesses?: string[];
    affectedSystems?: string[];
    targetDate?: string;
    requestedById: string;
  }) {
    return this.service.create({
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() data: { approvedById: string; approvalComments?: string },
  ) {
    return this.service.approve(id, data);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() data: { approvedById: string; approvalComments: string },
  ) {
    return this.service.reject(id, data);
  }

  @Post(':id/start-implementation')
  async startImplementation(
    @Param('id') id: string,
    @Body() data: { implementedById: string },
  ) {
    return this.service.startImplementation(id, data.implementedById);
  }

  @Post(':id/complete')
  async completeImplementation(
    @Param('id') id: string,
    @Body() data: { newVersionId?: string },
  ) {
    return this.service.completeImplementation(id, data);
  }

  @Post(':id/verify')
  async verify(
    @Param('id') id: string,
    @Body() data: { userId: string },
  ) {
    return this.service.verify(id, data.userId);
  }
}
