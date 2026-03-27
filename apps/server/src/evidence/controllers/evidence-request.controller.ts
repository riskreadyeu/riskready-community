import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { EvidenceRequestService } from '../services/evidence-request.service';
import { EvidenceRequestStatus, EvidenceRequestPriority } from '@prisma/client';
import {
  CreateEvidenceRequestDto,
  UpdateEvidenceRequestDto,
  SubmitEvidenceRequestDto,
  RejectEvidenceSubmissionDto,
} from '../dto/evidence.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('evidence-requests')
export class EvidenceRequestController {
  constructor(private readonly service: EvidenceRequestService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: EvidenceRequestStatus,
    @Query('priority') priority?: EvidenceRequestPriority,
    @Query('assignedToId') assignedToId?: string,
    @Query('assignedDepartmentId') assignedDepartmentId?: string,
    @Query('requestedById') requestedById?: string,
    @Query('contextType') contextType?: string,
    @Query('contextId') contextId?: string,
    @Query('overdue') overdue?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      status,
      priority,
      assignedToId,
      assignedDepartmentId,
      requestedById,
      contextType,
      contextId,
      overdue: overdue === 'true',
    });
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get('my-requests/:userId')
  async getMyRequests(
    @Request() req: AuthenticatedRequest,
    @Param('userId') _userId: string,
  ) {
    return this.service.getMyRequests(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() data: CreateEvidenceRequestDto,
  ) {
    return this.service.create({
      ...data,
      dueDate: new Date(data.dueDate),
      requestedById: req.user.id,
      createdById: req.user.id,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateEvidenceRequestDto,
  ) {
    return this.service.update(id, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // ============================================
  // WORKFLOW ACTIONS
  // ============================================

  @Post(':id/start-progress')
  async startProgress(@Param('id') id: string) {
    return this.service.startProgress(id);
  }

  @Post(':id/submit')
  async submitEvidence(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: SubmitEvidenceRequestDto,
  ) {
    return this.service.submitEvidence(id, data.evidenceId, req.user.id, data.notes);
  }

  @Post(':id/accept')
  async acceptSubmission(@Param('id') id: string) {
    return this.service.acceptSubmission(id);
  }

  @Post(':id/reject')
  async rejectSubmission(
    @Param('id') id: string,
    @Body() data: RejectEvidenceSubmissionDto,
  ) {
    return this.service.rejectSubmission(id, data.reason);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
