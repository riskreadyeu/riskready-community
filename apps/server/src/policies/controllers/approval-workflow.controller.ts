import { Controller, Get, Post, Put, Param, Query, Body, Request } from '@nestjs/common';
import { ApprovalWorkflowService } from '../services/approval-workflow.service';
import { ApprovalLevel } from '@prisma/client';
import {
  CreateApprovalWorkflowDto,
  ProcessApprovalStepDto,
  DelegateApprovalStepDto,
} from '../dto/workflow.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('policies')
export class ApprovalWorkflowController {
  constructor(private readonly service: ApprovalWorkflowService) {}

  // Static routes MUST come before parameterized routes

  @Get('approvals/pending')
  async getPendingApprovals(
    @Request() req: AuthenticatedRequest,
    @Query('userId') _userId: string,
  ) {
    return this.service.getPendingApprovals(req.user.id);
  }

  @Get('workflows/default-steps')
  async getDefaultWorkflowSteps(@Query('approvalLevel') approvalLevel: ApprovalLevel) {
    return this.service.getDefaultWorkflowSteps(approvalLevel);
  }

  /**
   * Get the approval matrix showing required approvers by document type
   */
  @Get('workflows/approval-matrix')
  getApprovalMatrix() {
    return this.service.getApprovalMatrix();
  }

  /**
   * Get default workflow configuration for a specific document type
   */
  @Get('workflows/default-by-type')
  async getDefaultWorkflowByType(
    @Query('documentType') documentType: 'POLICY' | 'STANDARD' | 'PROCEDURE' | 'GUIDELINE' | 'WORK_INSTRUCTION',
    @Query('controlOwnerId') controlOwnerId?: string,
  ) {
    return this.service.getDefaultWorkflowByDocumentType(documentType, controlOwnerId);
  }

  // Parameterized routes come after static routes

  @Get('workflows/:id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':documentId/workflows')
  async findAll(@Param('documentId') documentId: string) {
    return this.service.findAll(documentId);
  }

  @Get(':documentId/workflow/current')
  async getCurrentWorkflow(@Param('documentId') documentId: string) {
    const workflow = await this.service.getCurrentWorkflow(documentId);
    return workflow ?? null;
  }

  @Get(':documentId/workflow/validate')
  async validateApprovers(@Param('documentId') documentId: string) {
    return this.service.validateApproversForDocument(documentId);
  }

  @Post(':documentId/workflows')
  async createWorkflow(
    @Request() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
    @Body() data: CreateApprovalWorkflowDto,
  ) {
    return this.service.createWorkflow({
      documentId,
      workflowType: data.workflowType,
      steps: data.steps.map(s => ({
        ...s,
        dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
      })),
      initiatedById: req.user.id,
      comments: data.comments,
    });
  }

  @Post('workflows/steps/:stepId/process')
  async processStep(
    @Request() req: AuthenticatedRequest,
    @Param('stepId') stepId: string,
    @Body() data: ProcessApprovalStepDto,
  ) {
    return this.service.processStep(stepId, { ...data, userId: req.user.id });
  }

  @Post('workflows/steps/:stepId/delegate')
  async delegateStep(
    @Request() req: AuthenticatedRequest,
    @Param('stepId') stepId: string,
    @Body() data: DelegateApprovalStepDto,
  ) {
    return this.service.delegateStep(stepId, data.delegatedToId, req.user.id);
  }

  @Post('workflows/:id/cancel')
  async cancelWorkflow(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.cancelWorkflow(id, req.user.id);
  }
}
