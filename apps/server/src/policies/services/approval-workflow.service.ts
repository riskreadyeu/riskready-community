import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalWorkflowType, WorkflowStatus, ApprovalStepStatus, ApprovalDecision, ApprovalOutcome, ApprovalLevel, Prisma } from '@prisma/client';
import { PolicyAuditService } from './policy-audit.service';

export interface WorkflowStepConfig {
  stepOrder: number;
  stepName: string;
  approverId?: string;
  approverRole?: string;
  dueDate?: Date;
}

@Injectable()
export class ApprovalWorkflowService {
  constructor(
    private prisma: PrismaService,
    private auditService: PolicyAuditService,
  ) {}

  async findAll(documentId: string) {
    return this.prisma.documentApprovalWorkflow.findMany({
      where: { documentId },
      orderBy: { initiatedAt: 'desc' },
      include: {
        initiatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            approver: { select: { id: true, email: true, firstName: true, lastName: true } },
            delegatedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const workflow = await this.prisma.documentApprovalWorkflow.findUnique({
      where: { id },
      include: {
        document: { select: { id: true, documentId: true, title: true, status: true } },
        initiatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            approver: { select: { id: true, email: true, firstName: true, lastName: true } },
            delegatedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  async getCurrentWorkflow(documentId: string) {
    return this.prisma.documentApprovalWorkflow.findFirst({
      where: {
        documentId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            approver: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async createWorkflow(data: {
    documentId: string;
    workflowType: ApprovalWorkflowType;
    steps: WorkflowStepConfig[];
    initiatedById: string;
    comments?: string;
  }) {
    const { documentId, workflowType, steps, initiatedById, comments } = data;

    // Get document to check type
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
      select: { id: true, documentId: true, documentType: true, title: true },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // For all document types, apply defaults if no steps provided
    if (!steps || steps.length === 0) {
      const defaultConfig = await this.getDefaultWorkflowByDocumentType(
        document.documentType as 'POLICY' | 'STANDARD' | 'PROCEDURE' | 'GUIDELINE' | 'WORK_INSTRUCTION',
      );
      steps.push(...defaultConfig.steps);
    }

    // Ensure we have at least one step
    if (steps.length === 0) {
      throw new BadRequestException('At least one approval step is required');
    }

    // Check for existing active workflow
    const existingWorkflow = await this.getCurrentWorkflow(documentId);
    if (existingWorkflow) {
      throw new BadRequestException('An active approval workflow already exists for this document');
    }

    // Use transaction for atomic operations
    const workflow = await this.prisma.$transaction(async (tx) => {
      // 1. Create workflow with steps
      const newWorkflow = await tx.documentApprovalWorkflow.create({
        data: {
          document: { connect: { id: documentId } },
          workflowType,
          status: 'IN_PROGRESS',
          currentStepOrder: 1,
          comments,
          initiatedBy: { connect: { id: initiatedById } },
          steps: {
            create: steps.map(step => ({
              stepOrder: step.stepOrder,
              stepName: step.stepName,
              approver: step.approverId ? { connect: { id: step.approverId } } : undefined,
              approverRole: step.approverRole,
              dueDate: step.dueDate,
              status: step.stepOrder === 1 ? 'IN_REVIEW' : 'PENDING',
            })),
          },
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
            include: {
              approver: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          },
        },
      });

      // 2. Update document status to PENDING_APPROVAL
      await tx.policyDocument.update({
        where: { id: documentId },
        data: { status: 'PENDING_APPROVAL' },
      });

      // 3. Log audit entry
      await tx.policyDocumentAuditLog.create({
        data: {
          document: { connect: { id: documentId } },
          action: 'SUBMITTED_FOR_APPROVAL',
          description: `Approval workflow started: ${workflowType}`,
          performedBy: { connect: { id: initiatedById } },
          newValue: { workflowType, stepsCount: steps.length } as Prisma.JsonObject,
        },
      });

      return newWorkflow;
    });

    return workflow;
  }

  async processStep(stepId: string, data: {
    decision: ApprovalDecision;
    comments?: string;
    signature?: string;
    userId: string;
  }) {
    const { decision, comments, signature, userId } = data;

    const step = await this.prisma.approvalStep.findUnique({
      where: { id: stepId },
      include: {
        workflow: {
          include: {
            document: { select: { id: true, documentId: true, title: true } },
            steps: { orderBy: { stepOrder: 'asc' } },
          },
        },
      },
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${stepId} not found`);
    }

    if (step.status !== 'IN_REVIEW') {
      throw new BadRequestException('This step is not currently in review');
    }

    const isApproval = decision === 'APPROVE' || decision === 'APPROVE_WITH_CHANGES';
    const isRejection = decision === 'REJECT';

    // Use transaction for atomic operations
    await this.prisma.$transaction(async (tx) => {
      // 1. Update the step status/decision
      await tx.approvalStep.update({
        where: { id: stepId },
        data: {
          status: isApproval ? 'APPROVED' : isRejection ? 'REJECTED' : step.status,
          decision,
          comments,
          signature,
          signedAt: signature ? new Date() : undefined,
          approver: { connect: { id: userId } },
        },
      });

      if (isRejection) {
        // 2a. Workflow rejected - update workflow status
        await tx.documentApprovalWorkflow.update({
          where: { id: step.workflowId },
          data: {
            status: 'REJECTED',
            completedAt: new Date(),
            finalOutcome: 'REJECTED',
          },
        });

        // Update document status back to draft
        await tx.policyDocument.update({
          where: { id: step.workflow.documentId },
          data: { status: 'DRAFT' },
        });

        // Log audit entry
        await tx.policyDocumentAuditLog.create({
          data: {
            document: { connect: { id: step.workflow.documentId } },
            action: 'REJECTED',
            description: `Approval rejected at step: ${step.stepName}`,
            performedBy: { connect: { id: userId } },
            newValue: { decision, comments } as Prisma.JsonObject,
          },
        });

      } else if (isApproval) {
        // Check if there are more steps
        const nextStep = step.workflow.steps.find(s => s.stepOrder === step.stepOrder + 1);

        if (nextStep) {
          // 2b. Move to next step - advance workflow
          await tx.approvalStep.update({
            where: { id: nextStep.id },
            data: { status: 'IN_REVIEW' },
          });

          await tx.documentApprovalWorkflow.update({
            where: { id: step.workflowId },
            data: { currentStepOrder: nextStep.stepOrder },
          });

        } else {
          // 2c. All steps completed - workflow approved
          await tx.documentApprovalWorkflow.update({
            where: { id: step.workflowId },
            data: {
              status: 'APPROVED',
              completedAt: new Date(),
              finalOutcome: 'APPROVED',
            },
          });

          // Update document to approved
          await tx.policyDocument.update({
            where: { id: step.workflow.documentId },
            data: {
              status: 'APPROVED',
              approvedBy: step.stepName,
              approverId: userId,
              approvalDate: new Date(),
              digitalSignature: signature,
            },
          });

          // Log audit entry for approval
          await tx.policyDocumentAuditLog.create({
            data: {
              document: { connect: { id: step.workflow.documentId } },
              action: 'APPROVED',
              description: 'Document approved through workflow',
              performedBy: { connect: { id: userId } },
              newValue: { decision, signature: !!signature } as Prisma.JsonObject,
            },
          });
        }
      } else if (decision === 'REQUEST_CHANGES') {
        // Keep in review but note changes requested
        await tx.policyDocumentAuditLog.create({
          data: {
            document: { connect: { id: step.workflow.documentId } },
            action: 'REVIEWED',
            description: `Changes requested at step: ${step.stepName}`,
            performedBy: { connect: { id: userId } },
            newValue: { decision, comments } as Prisma.JsonObject,
          },
        });
      }
      // DELEGATE decision is handled separately in delegateStep
    });

    return this.findOne(step.workflowId);
  }

  async delegateStep(stepId: string, delegatedToId: string, userId: string) {
    const step = await this.prisma.approvalStep.findUnique({
      where: { id: stepId },
      include: { workflow: true },
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${stepId} not found`);
    }

    await this.prisma.approvalStep.update({
      where: { id: stepId },
      data: {
        status: 'DELEGATED',
        decision: 'DELEGATE',
        delegatedTo: { connect: { id: delegatedToId } },
      },
    });

    // Create a new step for the delegated approver
    const newStep = await this.prisma.approvalStep.create({
      data: {
        workflow: { connect: { id: step.workflowId } },
        stepOrder: step.stepOrder,
        stepName: `${step.stepName} (Delegated)`,
        approver: { connect: { id: delegatedToId } },
        status: 'IN_REVIEW',
        dueDate: step.dueDate,
      },
    });

    await this.auditService.log({
      documentId: step.workflow.documentId,
      action: 'UPDATED',
      description: `Step "${step.stepName}" delegated`,
      performedById: userId,
    });

    return newStep;
  }

  async cancelWorkflow(workflowId: string, userId: string) {
    const workflow = await this.findOne(workflowId);

    if (workflow.status !== 'PENDING' && workflow.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Cannot cancel a completed workflow');
    }

    // Use transaction for atomic operations
    await this.prisma.$transaction(async (tx) => {
      // 1. Update workflow status to cancelled
      await tx.documentApprovalWorkflow.update({
        where: { id: workflowId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
          finalOutcome: 'WITHDRAWN',
        },
      });

      // 2. Update document status back to draft
      await tx.policyDocument.update({
        where: { id: workflow.documentId },
        data: { status: 'DRAFT' },
      });

      // 3. Log audit entry
      await tx.policyDocumentAuditLog.create({
        data: {
          document: { connect: { id: workflow.documentId } },
          action: 'UPDATED',
          description: 'Approval workflow cancelled',
          performedBy: { connect: { id: userId } },
        },
      });
    });

    return this.findOne(workflowId);
  }

  async getPendingApprovals(userId: string) {
    return this.prisma.approvalStep.findMany({
      where: {
        approverId: userId,
        status: 'IN_REVIEW',
      },
      include: {
        workflow: {
          include: {
            document: {
              select: {
                id: true,
                documentId: true,
                title: true,
                documentType: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getDefaultWorkflowSteps(approvalLevel: ApprovalLevel): Promise<WorkflowStepConfig[]> {
    // Default workflow configuration based on approval level
    const workflows: Record<ApprovalLevel, WorkflowStepConfig[]> = {
      BOARD: [
        { stepOrder: 1, stepName: 'Technical Review', approverRole: 'Security Team' },
        { stepOrder: 2, stepName: 'Legal Review', approverRole: 'Legal' },
        { stepOrder: 3, stepName: 'Executive Review', approverRole: 'CISO' },
        { stepOrder: 4, stepName: 'Board Approval', approverRole: 'Board' },
      ],
      EXECUTIVE: [
        { stepOrder: 1, stepName: 'Technical Review', approverRole: 'Security Team' },
        { stepOrder: 2, stepName: 'Management Review', approverRole: 'Manager' },
        { stepOrder: 3, stepName: 'Executive Approval', approverRole: 'Executive' },
      ],
      SENIOR_MANAGEMENT: [
        { stepOrder: 1, stepName: 'Technical Review', approverRole: 'Security Team' },
        { stepOrder: 2, stepName: 'Senior Management Approval', approverRole: 'Senior Management' },
      ],
      MANAGEMENT: [
        { stepOrder: 1, stepName: 'Peer Review', approverRole: 'Peer' },
        { stepOrder: 2, stepName: 'Management Approval', approverRole: 'Manager' },
      ],
      TEAM_LEAD: [
        { stepOrder: 1, stepName: 'Team Lead Approval', approverRole: 'Team Lead' },
      ],
      PROCESS_OWNER: [
        { stepOrder: 1, stepName: 'Process Owner Approval', approverRole: 'Process Owner' },
      ],
    };

    return workflows[approvalLevel] || workflows.MANAGEMENT;
  }

  /**
   * Get default approval workflow configuration by document type.
   *
   * Document Type Approval Matrix:
   * - POLICY: Mandatory custom approver list (must be provided by caller)
   * - STANDARD: CISO/CIO approval
   * - PROCEDURE: Control Owner + CISO/CIO
   * - GUIDELINE: Control Owner only
   * - WORK_INSTRUCTION: Control Owner only
   */
  /**
   * Get members of the Information Security Steering Committee
   */
  async getSteeringCommitteeMembers(organisationId?: string): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>> {
    // Find the Information Security Steering Committee
    const committee = await this.prisma.securityCommittee.findFirst({
      where: {
        OR: [
          { name: { contains: 'Information Security Steering', mode: 'insensitive' } },
          { name: { contains: 'ISSC', mode: 'insensitive' } },
          { committeeType: { contains: 'STEERING', mode: 'insensitive' } },
        ],
        isActive: true,
      },
      include: {
        chair: { select: { id: true, email: true, firstName: true, lastName: true } },
        memberships: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!committee) {
      return [];
    }

    const members: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    }> = [];

    // Add chair first if exists
    if (committee.chair) {
      members.push({
        id: committee.chair.id,
        firstName: committee.chair.firstName || '',
        lastName: committee.chair.lastName || '',
        email: committee.chair.email,
        role: 'Chair',
      });
    }

    // Add other members
    for (const membership of committee.memberships) {
      // Skip if already added as chair
      if (committee.chair && membership.user.id === committee.chair.id) continue;

      members.push({
        id: membership.user.id,
        firstName: membership.user.firstName || '',
        lastName: membership.user.lastName || '',
        email: membership.user.email,
        role: (membership as Record<string, unknown>)['role'] as string || 'Member',
      });
    }

    return members;
  }

  async getDefaultWorkflowByDocumentType(
    documentType: 'POLICY' | 'STANDARD' | 'PROCEDURE' | 'GUIDELINE' | 'WORK_INSTRUCTION',
    controlOwnerId?: string,
    organisationId?: string,
  ): Promise<{ steps: WorkflowStepConfig[]; mandatory: boolean; description: string; committeeMembers?: Array<{ id: string; firstName: string; lastName: string; email: string; role: string }> }> {

    // For POLICY documents, get the steering committee members
    if (documentType === 'POLICY') {
      const committeeMembers = await this.getSteeringCommitteeMembers(organisationId);

      if (committeeMembers.length > 0) {
        // Create steps with actual committee members
        const steps: WorkflowStepConfig[] = committeeMembers.map((member, index) => ({
          stepOrder: index + 1,
          stepName: `${member.firstName} ${member.lastName} (${member.role}) Approval`,
          approverId: member.id,
          approverRole: `Steering Committee ${member.role}`,
        }));

        return {
          steps,
          mandatory: false,
          description: `Policies are approved by the Information Security Steering Committee (${committeeMembers.length} members).`,
          committeeMembers,
        };
      }

      // Fallback if no committee found
      return {
        steps: [
          { stepOrder: 1, stepName: 'Information Security Steering Committee Approval', approverRole: 'Information Security Steering Committee' },
        ],
        mandatory: false,
        description: 'Policies are approved by the Information Security Steering Committee. No committee members found - please configure the committee.',
        committeeMembers: [],
      };
    }

    const workflows: Record<string, { steps: WorkflowStepConfig[]; mandatory: boolean; description: string }> = {
      STANDARD: {
        steps: [
          { stepOrder: 1, stepName: 'CISO/CIO Approval', approverRole: 'CISO' },
        ],
        mandatory: false,
        description: 'Standards are approved by CISO or CIO.',
      },
      PROCEDURE: {
        steps: [
          { stepOrder: 1, stepName: 'Control Owner Review', approverRole: 'Control Owner', approverId: controlOwnerId },
          { stepOrder: 2, stepName: 'CISO/CIO Approval', approverRole: 'CISO' },
        ],
        mandatory: false,
        description: 'Procedures are reviewed by the Control Owner and approved by CISO/CIO.',
      },
      GUIDELINE: {
        steps: [
          { stepOrder: 1, stepName: 'Control Owner Approval', approverRole: 'Control Owner', approverId: controlOwnerId },
        ],
        mandatory: false,
        description: 'Guidelines are approved by the Control Owner.',
      },
      WORK_INSTRUCTION: {
        steps: [
          { stepOrder: 1, stepName: 'Control Owner Approval', approverRole: 'Control Owner', approverId: controlOwnerId },
        ],
        mandatory: false,
        description: 'Work Instructions are approved by the Control Owner.',
      },
    };

    return workflows[documentType] || workflows['GUIDELINE']!;
  }

  /**
   * Validate that a document has required approvers before workflow can be created.
   * Policies MUST have explicit approvers defined.
   */
  async validateApproversForDocument(documentId: string): Promise<{
    valid: boolean;
    documentType: string;
    message: string;
    requiredApprovers?: string[];
  }> {
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        documentId: true,
        documentType: true,
        approvalLevel: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // All document types have defaults
    const config = await this.getDefaultWorkflowByDocumentType(document.documentType as 'POLICY' | 'STANDARD' | 'PROCEDURE' | 'GUIDELINE' | 'WORK_INSTRUCTION');

    return {
      valid: true,
      documentType: document.documentType,
      message: config.description,
    };
  }

  /**
   * Get approval matrix summary for all document types
   */
  getApprovalMatrix(): Record<string, { approvers: string[]; workflow: string }> {
    return {
      POLICY: {
        approvers: ['Information Security Steering Committee'],
        workflow: 'SEQUENTIAL',
      },
      STANDARD: {
        approvers: ['CISO', 'CIO'],
        workflow: 'SEQUENTIAL',
      },
      PROCEDURE: {
        approvers: ['Control Owner', 'CISO/CIO'],
        workflow: 'SEQUENTIAL',
      },
      GUIDELINE: {
        approvers: ['Control Owner'],
        workflow: 'SEQUENTIAL',
      },
      WORK_INSTRUCTION: {
        approvers: ['Control Owner'],
        workflow: 'SEQUENTIAL',
      },
    };
  }
}
