import { Controller, Get, Post, Put, Param, Query, Body, Request } from '@nestjs/common';
import { ChangeRequestService } from '../services/change-request.service';
import { ChangeRequestStatus } from '@prisma/client';
import {
  CreateChangeRequestDto,
  UpdateChangeRequestDto,
  ApproveChangeRequestDto,
  RejectChangeRequestDto,
  ImplementChangeRequestDto,
} from '../dto/change-request.dto';
import { AuthenticatedRequest } from '../../shared/types';

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
  async create(@Request() req: AuthenticatedRequest, @Body() data: CreateChangeRequestDto) {
    return this.service.create({
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      requestedById: req.user.id,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateChangeRequestDto) {
    return this.service.update(id, {
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    });
  }

  @Post(':id/approve')
  async approve(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: ApproveChangeRequestDto,
  ) {
    return this.service.approve(id, { approvedById: req.user.id, approvalComments: data.approvalComments });
  }

  @Post(':id/reject')
  async reject(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: RejectChangeRequestDto,
  ) {
    return this.service.reject(id, { approvedById: req.user.id, approvalComments: data.approvalComments });
  }

  @Post(':id/start-implementation')
  async startImplementation(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.startImplementation(id, req.user.id);
  }

  @Post(':id/complete')
  async completeImplementation(
    @Param('id') id: string,
    @Body() data: ImplementChangeRequestDto,
  ) {
    return this.service.completeImplementation(id, data);
  }

  @Post(':id/verify')
  async verify(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.verify(id, req.user.id);
  }
}
