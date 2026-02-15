import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ApprovalWorkflowService } from '../services/approval-workflow.service';
import { ApprovalWorkflowType, ApprovalDecision, ApprovalLevel } from '@prisma/client';

@Controller('policies')
export class ApprovalWorkflowController {
  constructor(private readonly service: ApprovalWorkflowService) {}

  // Static routes MUST come before parameterized routes

  @Get('approvals/pending')
  async getPendingApprovals(@Query('userId') userId: string) {
    return this.service.getPendingApprovals(userId);
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
    @Param('documentId') documentId: string,
    @Body() data: {
      workflowType: ApprovalWorkflowType;
      steps: Array<{
        stepOrder: number;
        stepName: string;
        approverId?: string;
        approverRole?: string;
        dueDate?: string;
      }>;
      initiatedById: string;
      comments?: string;
    },
  ) {
    return this.service.createWorkflow({
      documentId,
      workflowType: data.workflowType,
      steps: data.steps.map(s => ({
        ...s,
        dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
      })),
      initiatedById: data.initiatedById,
      comments: data.comments,
    });
  }

  @Post('workflows/steps/:stepId/process')
  async processStep(
    @Param('stepId') stepId: string,
    @Body() data: {
      decision: ApprovalDecision;
      comments?: string;
      signature?: string;
      userId: string;
    },
  ) {
    return this.service.processStep(stepId, data);
  }

  @Post('workflows/steps/:stepId/delegate')
  async delegateStep(
    @Param('stepId') stepId: string,
    @Body() data: { delegatedToId: string; userId: string },
  ) {
    return this.service.delegateStep(stepId, data.delegatedToId, data.userId);
  }

  @Post('workflows/:id/cancel')
  async cancelWorkflow(
    @Param('id') id: string,
    @Body() data: { userId: string },
  ) {
    return this.service.cancelWorkflow(id, data.userId);
  }
}
