import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { McpActionStatus, McpActionType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { McpApprovalService } from './mcp-approval.service';
import { McpApprovalExecutorService } from './mcp-approval-executor.service';
import { ApproveActionDto, RejectActionDto } from './dto/review-action.dto';
import { AuthenticatedRequest } from '../shared/types';
import { AdminOnly, AdminOnlyGuard } from '../shared/guards/admin-only.guard';

@Controller('mcp-approvals')
@UseGuards(AdminOnlyGuard)
@AdminOnly()
export class McpApprovalController {
  private readonly logger = new Logger(McpApprovalController.name);

  constructor(
    private approvalService: McpApprovalService,
    private executorService: McpApprovalExecutorService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get()
  findAll(
    @Query('status') status?: McpActionStatus,
    @Query('actionType') actionType?: McpActionType,
    @Query('organisationId') organisationId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.approvalService.findAll({
      status,
      actionType,
      organisationId,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('stats')
  getStats(@Query('organisationId') organisationId?: string) {
    return this.approvalService.getStats(organisationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.approvalService.findOne(id);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveActionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const reviewedById = req.user?.id;

    // Mark as approved
    const action = await this.approvalService.approve(id, reviewedById, dto.reviewNotes);

    // Attempt execution if an executor is registered
    if (this.executorService.canExecute(action.actionType)) {
      try {
        const payload = {
          organisationId: action.organisationId,
          ...(action.payload as Record<string, unknown>),
        };
        const result = await this.executorService.execute(
          action.actionType,
          payload,
          reviewedById,
        );
        await this.approvalService.markExecuted(id, result);
        return this.approvalService.findOne(id);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorStack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `Failed to execute action ${id} (${action.actionType}): ${errorMessage}`,
          errorStack,
        );
        await this.approvalService.markFailed(id, errorMessage || 'Unknown execution error');
        return this.approvalService.findOne(id);
      }
    }

    // Emit approval resolved event
    this.eventEmitter.emit('approval.resolved', {
      actionId: id,
      actionType: action.actionType,
      status: 'APPROVED',
      reviewNotes: dto.reviewNotes,
      organisationId: action.organisationId,
    });

    // No executor registered — stays in APPROVED status
    return action;
  }

  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.approvalService.retry(id);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectActionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const reviewedById = req.user?.id;
    const action = await this.approvalService.reject(id, reviewedById, dto.reviewNotes);

    // Emit rejection event
    this.eventEmitter.emit('approval.resolved', {
      actionId: id,
      actionType: action.actionType,
      status: 'REJECTED',
      reviewNotes: dto.reviewNotes,
      organisationId: action.organisationId,
    });

    return action;
  }
}
