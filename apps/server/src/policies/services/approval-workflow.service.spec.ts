import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditService } from './policy-audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ApprovalWorkflowType, WorkflowStatus, ApprovalStepStatus, ApprovalDecision, ApprovalOutcome, ApprovalLevel } from '@prisma/client';

describe('ApprovalWorkflowService', () => {
  let service: ApprovalWorkflowService;
  let prismaService: PrismaService;
  let auditService: PolicyAuditService;

  const mockPrismaService = {
    documentApprovalWorkflow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    approvalStep: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    policyDocument: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    policyDocumentAuditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService.$transaction.mockImplementation(
      async (
        callback: (tx: {
          documentApprovalWorkflow: typeof mockPrismaService.documentApprovalWorkflow;
          approvalStep: typeof mockPrismaService.approvalStep;
          policyDocument: typeof mockPrismaService.policyDocument;
          policyDocumentAuditLog: typeof mockPrismaService.policyDocumentAuditLog;
        }) => unknown,
      ) =>
        callback({
          documentApprovalWorkflow: mockPrismaService.documentApprovalWorkflow,
          approvalStep: mockPrismaService.approvalStep,
          policyDocument: mockPrismaService.policyDocument,
          policyDocumentAuditLog: mockPrismaService.policyDocumentAuditLog,
        }),
    );
    mockPrismaService.policyDocument.findUnique.mockResolvedValue({
      id: 'doc-1',
      documentId: 'DOC-001',
      documentType: 'POLICY',
      title: 'Test Document',
    });
    mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalWorkflowService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PolicyAuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ApprovalWorkflowService>(ApprovalWorkflowService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<PolicyAuditService>(PolicyAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all workflows for a document ordered by initiatedAt desc', async () => {
      const documentId = 'doc-1';
      const mockWorkflows = [
        {
          id: 'workflow-1',
          documentId,
          workflowType: 'SEQUENTIAL',
          status: 'IN_PROGRESS',
          initiatedAt: new Date('2024-01-15'),
          initiatedBy: { id: 'user-1', email: 'user1@test.com', firstName: 'User', lastName: 'One' },
          steps: [
            {
              id: 'step-1',
              stepOrder: 1,
              stepName: 'Technical Review',
              status: 'IN_REVIEW',
              approver: { id: 'user-2', email: 'user2@test.com', firstName: 'User', lastName: 'Two' },
              delegatedTo: null,
            },
          ],
        },
        {
          id: 'workflow-2',
          documentId,
          workflowType: 'PARALLEL',
          status: 'APPROVED',
          initiatedAt: new Date('2024-01-10'),
          initiatedBy: { id: 'user-1', email: 'user1@test.com', firstName: 'User', lastName: 'One' },
          steps: [],
        },
      ];

      mockPrismaService.documentApprovalWorkflow.findMany.mockResolvedValue(mockWorkflows);

      const result = await service.findAll(documentId);

      expect(result).toEqual(mockWorkflows);
      expect(mockPrismaService.documentApprovalWorkflow.findMany).toHaveBeenCalledWith({
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
    });

    it('should return empty array when no workflows exist', async () => {
      mockPrismaService.documentApprovalWorkflow.findMany.mockResolvedValue([]);

      const result = await service.findAll('doc-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return workflow with document and steps', async () => {
      const workflowId = 'workflow-1';
      const mockWorkflow = {
        id: workflowId,
        documentId: 'doc-1',
        workflowType: 'SEQUENTIAL',
        status: 'IN_PROGRESS',
        currentStepOrder: 1,
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Document', status: 'PENDING_APPROVAL' },
        initiatedBy: { id: 'user-1', email: 'user1@test.com', firstName: 'User', lastName: 'One' },
        steps: [
          {
            id: 'step-1',
            stepOrder: 1,
            stepName: 'Technical Review',
            status: 'IN_REVIEW',
            approver: { id: 'user-2', email: 'user2@test.com', firstName: 'User', lastName: 'Two' },
            delegatedTo: null,
          },
        ],
      };

      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue(mockWorkflow);

      const result = await service.findOne(workflowId);

      expect(result).toEqual(mockWorkflow);
      expect(mockPrismaService.documentApprovalWorkflow.findUnique).toHaveBeenCalledWith({
        where: { id: workflowId },
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
    });

    it('should throw NotFoundException when workflow does not exist', async () => {
      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Workflow with ID non-existent not found'
      );
    });
  });

  describe('getCurrentWorkflow', () => {
    it('should return current workflow with PENDING or IN_PROGRESS status', async () => {
      const documentId = 'doc-1';
      const mockWorkflow = {
        id: 'workflow-1',
        documentId,
        status: 'IN_PROGRESS',
        steps: [
          {
            id: 'step-1',
            stepOrder: 1,
            stepName: 'Technical Review',
            status: 'IN_REVIEW',
            approver: { id: 'user-2', email: 'user2@test.com', firstName: 'User', lastName: 'Two' },
          },
        ],
      };

      mockPrismaService.documentApprovalWorkflow.findFirst.mockResolvedValue(mockWorkflow);

      const result = await service.getCurrentWorkflow(documentId);

      expect(result).toEqual(mockWorkflow);
      expect(mockPrismaService.documentApprovalWorkflow.findFirst).toHaveBeenCalledWith({
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
    });

    it('should return null when no active workflow exists', async () => {
      mockPrismaService.documentApprovalWorkflow.findFirst.mockResolvedValue(null);

      const result = await service.getCurrentWorkflow('doc-1');

      expect(result).toBeNull();
    });
  });

  describe('createWorkflow', () => {
    it('should create workflow with steps and update document status', async () => {
      const createData = {
        documentId: 'doc-1',
        workflowType: 'SEQUENTIAL' as ApprovalWorkflowType,
        steps: [
          { stepOrder: 1, stepName: 'Technical Review', approverId: 'user-2' },
          { stepOrder: 2, stepName: 'Management Review', approverRole: 'Manager' },
        ],
        initiatedById: 'user-1',
        comments: 'Initial submission',
      };

      const mockCreatedWorkflow = {
        id: 'workflow-1',
        documentId: createData.documentId,
        workflowType: createData.workflowType,
        status: 'IN_PROGRESS',
        currentStepOrder: 1,
        comments: createData.comments,
        steps: [
          {
            id: 'step-1',
            stepOrder: 1,
            stepName: 'Technical Review',
            status: 'IN_REVIEW',
            approver: { id: 'user-2', email: 'user2@test.com', firstName: 'User', lastName: 'Two' },
          },
          {
            id: 'step-2',
            stepOrder: 2,
            stepName: 'Management Review',
            status: 'PENDING',
            approver: null,
          },
        ],
      };

      mockPrismaService.documentApprovalWorkflow.findFirst.mockResolvedValue(null);
      mockPrismaService.documentApprovalWorkflow.create.mockResolvedValue(mockCreatedWorkflow);
      mockPrismaService.policyDocument.update.mockResolvedValue({ id: createData.documentId });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.createWorkflow(createData);

      expect(result).toEqual(mockCreatedWorkflow);
      expect(mockPrismaService.documentApprovalWorkflow.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: createData.documentId } },
          workflowType: createData.workflowType,
          status: 'IN_PROGRESS',
          currentStepOrder: 1,
          comments: createData.comments,
          initiatedBy: { connect: { id: createData.initiatedById } },
          steps: {
            create: [
              {
                stepOrder: 1,
                stepName: 'Technical Review',
                approver: { connect: { id: 'user-2' } },
                approverRole: undefined,
                dueDate: undefined,
                status: 'IN_REVIEW',
              },
              {
                stepOrder: 2,
                stepName: 'Management Review',
                approver: undefined,
                approverRole: 'Manager',
                dueDate: undefined,
                status: 'PENDING',
              },
            ],
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
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: createData.documentId },
        data: { status: 'PENDING_APPROVAL' },
      });
      expect(mockPrismaService.policyDocumentAuditLog.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: createData.documentId } },
          action: 'SUBMITTED_FOR_APPROVAL',
          description: 'Approval workflow started: SEQUENTIAL',
          performedBy: { connect: { id: createData.initiatedById } },
          newValue: { workflowType: createData.workflowType, stepsCount: 2 },
        },
      });
    });

    it('should throw BadRequestException when active workflow already exists', async () => {
      const createData = {
        documentId: 'doc-1',
        workflowType: 'SEQUENTIAL' as ApprovalWorkflowType,
        steps: [{ stepOrder: 1, stepName: 'Review', approverId: 'user-2' }],
        initiatedById: 'user-1',
      };

      mockPrismaService.documentApprovalWorkflow.findFirst.mockResolvedValue({
        id: 'existing-workflow',
        status: 'IN_PROGRESS',
      });

      await expect(service.createWorkflow(createData)).rejects.toThrow(BadRequestException);
      await expect(service.createWorkflow(createData)).rejects.toThrow(
        'An active approval workflow already exists for this document'
      );
    });

    it('should create workflow with steps having due dates', async () => {
      const dueDate = new Date('2024-02-01');
      const createData = {
        documentId: 'doc-1',
        workflowType: 'SEQUENTIAL' as ApprovalWorkflowType,
        steps: [
          { stepOrder: 1, stepName: 'Review', approverId: 'user-2', dueDate },
        ],
        initiatedById: 'user-1',
      };

      mockPrismaService.documentApprovalWorkflow.findFirst.mockResolvedValue(null);
      mockPrismaService.documentApprovalWorkflow.create.mockResolvedValue({
        id: 'workflow-1',
        steps: [],
      });
      mockPrismaService.policyDocument.update.mockResolvedValue({});
      mockAuditService.log.mockResolvedValue({});

      await service.createWorkflow(createData);

      expect(mockPrismaService.documentApprovalWorkflow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            steps: {
              create: [
                expect.objectContaining({
                  dueDate,
                }),
              ],
            },
          }),
        })
      );
    });
  });

  describe('processStep', () => {
    const mockStep = {
      id: 'step-1',
      stepOrder: 1,
      stepName: 'Technical Review',
      status: 'IN_REVIEW',
      workflowId: 'workflow-1',
      workflow: {
        id: 'workflow-1',
        documentId: 'doc-1',
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Document' },
        steps: [
          { id: 'step-1', stepOrder: 1, stepName: 'Technical Review', status: 'IN_REVIEW' },
          { id: 'step-2', stepOrder: 2, stepName: 'Management Review', status: 'PENDING' },
        ],
      },
    };

    it('should approve step and move to next step', async () => {
      const processData = {
        decision: 'APPROVE' as ApprovalDecision,
        comments: 'Looks good',
        signature: 'digital-signature',
        userId: 'user-2',
      };

      mockPrismaService.approvalStep.findUnique.mockResolvedValue(mockStep);
      mockPrismaService.approvalStep.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue({
        id: 'workflow-1',
        steps: [],
      });

      await service.processStep('step-1', processData);

      expect(mockPrismaService.approvalStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: {
          status: 'APPROVED',
          decision: 'APPROVE',
          comments: processData.comments,
          signature: processData.signature,
          signedAt: expect.any(Date),
          approver: { connect: { id: processData.userId } },
        },
      });
      expect(mockPrismaService.approvalStep.update).toHaveBeenCalledWith({
        where: { id: 'step-2' },
        data: { status: 'IN_REVIEW' },
      });
      expect(mockPrismaService.documentApprovalWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-1' },
        data: { currentStepOrder: 2 },
      });
    });

    it('should approve final step and complete workflow', async () => {
      const finalStepMock = {
        ...mockStep,
        workflow: {
          ...mockStep.workflow,
          steps: [
            { id: 'step-1', stepOrder: 1, stepName: 'Technical Review', status: 'IN_REVIEW' },
          ],
        },
      };

      const processData = {
        decision: 'APPROVE' as ApprovalDecision,
        comments: 'Final approval',
        signature: 'digital-signature',
        userId: 'user-2',
      };

      mockPrismaService.approvalStep.findUnique.mockResolvedValue(finalStepMock);
      mockPrismaService.approvalStep.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.update.mockResolvedValue({});
      mockPrismaService.policyDocument.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue({
        id: 'workflow-1',
        steps: [],
      });

      await service.processStep('step-1', processData);

      expect(mockPrismaService.documentApprovalWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-1' },
        data: {
          status: 'APPROVED',
          completedAt: expect.any(Date),
          finalOutcome: 'APPROVED',
        },
      });
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          status: 'APPROVED',
          approvedBy: 'Technical Review',
          approverId: processData.userId,
          approvalDate: expect.any(Date),
          digitalSignature: processData.signature,
        },
      });
      expect(mockPrismaService.policyDocumentAuditLog.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: 'doc-1' } },
          action: 'APPROVED',
          description: 'Document approved through workflow',
          performedBy: { connect: { id: processData.userId } },
          newValue: { decision: 'APPROVE', signature: true },
        },
      });
    });

    it('should reject step and complete workflow with rejection', async () => {
      const processData = {
        decision: 'REJECT' as ApprovalDecision,
        comments: 'Does not meet requirements',
        userId: 'user-2',
      };

      mockPrismaService.approvalStep.findUnique.mockResolvedValue(mockStep);
      mockPrismaService.approvalStep.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.update.mockResolvedValue({});
      mockPrismaService.policyDocument.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue({
        id: 'workflow-1',
        steps: [],
      });

      await service.processStep('step-1', processData);

      expect(mockPrismaService.approvalStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: {
          status: 'REJECTED',
          decision: 'REJECT',
          comments: processData.comments,
          signature: undefined,
          signedAt: undefined,
          approver: { connect: { id: processData.userId } },
        },
      });
      expect(mockPrismaService.documentApprovalWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-1' },
        data: {
          status: 'REJECTED',
          completedAt: expect.any(Date),
          finalOutcome: 'REJECTED',
        },
      });
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { status: 'DRAFT' },
      });
      expect(mockPrismaService.policyDocumentAuditLog.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: 'doc-1' } },
          action: 'REJECTED',
          description: 'Approval rejected at step: Technical Review',
          performedBy: { connect: { id: processData.userId } },
          newValue: { decision: 'REJECT', comments: processData.comments },
        },
      });
    });

    it('should handle APPROVE_WITH_CHANGES decision', async () => {
      const processData = {
        decision: 'APPROVE_WITH_CHANGES' as ApprovalDecision,
        comments: 'Approved with minor changes',
        userId: 'user-2',
      };

      mockPrismaService.approvalStep.findUnique.mockResolvedValue(mockStep);
      mockPrismaService.approvalStep.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue({
        id: 'workflow-1',
        steps: [],
      });

      await service.processStep('step-1', processData);

      expect(mockPrismaService.approvalStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: {
          status: 'APPROVED',
          decision: 'APPROVE_WITH_CHANGES',
          comments: processData.comments,
          signature: undefined,
          signedAt: undefined,
          approver: { connect: { id: processData.userId } },
        },
      });
    });

    it('should handle REQUEST_CHANGES decision', async () => {
      const processData = {
        decision: 'REQUEST_CHANGES' as ApprovalDecision,
        comments: 'Please update section 3',
        userId: 'user-2',
      };

      mockPrismaService.approvalStep.findUnique.mockResolvedValue(mockStep);
      mockPrismaService.approvalStep.update.mockResolvedValue({});
      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue({
        id: 'workflow-1',
        steps: [],
      });

      await service.processStep('step-1', processData);

      expect(mockPrismaService.policyDocumentAuditLog.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: 'doc-1' } },
          action: 'REVIEWED',
          description: 'Changes requested at step: Technical Review',
          performedBy: { connect: { id: processData.userId } },
          newValue: { decision: 'REQUEST_CHANGES', comments: processData.comments },
        },
      });
    });

    it('should throw NotFoundException when step does not exist', async () => {
      mockPrismaService.approvalStep.findUnique.mockResolvedValue(null);

      await expect(
        service.processStep('non-existent', {
          decision: 'APPROVE' as ApprovalDecision,
          userId: 'user-1',
        })
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.processStep('non-existent', {
          decision: 'APPROVE' as ApprovalDecision,
          userId: 'user-1',
        })
      ).rejects.toThrow('Step with ID non-existent not found');
    });

    it('should throw BadRequestException when step is not in review', async () => {
      const completedStep = {
        ...mockStep,
        status: 'APPROVED',
      };

      mockPrismaService.approvalStep.findUnique.mockResolvedValue(completedStep);

      await expect(
        service.processStep('step-1', {
          decision: 'APPROVE' as ApprovalDecision,
          userId: 'user-1',
        })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processStep('step-1', {
          decision: 'APPROVE' as ApprovalDecision,
          userId: 'user-1',
        })
      ).rejects.toThrow('This step is not currently in review');
    });
  });

  describe('delegateStep', () => {
    it('should delegate step to another user', async () => {
      const mockStep = {
        id: 'step-1',
        stepOrder: 1,
        stepName: 'Technical Review',
        status: 'IN_REVIEW',
        workflowId: 'workflow-1',
        dueDate: new Date('2024-02-01'),
        workflow: {
          documentId: 'doc-1',
        },
      };

      const mockNewStep = {
        id: 'step-delegated',
        stepOrder: 1,
        stepName: 'Technical Review (Delegated)',
        status: 'IN_REVIEW',
      };

      mockPrismaService.approvalStep.findUnique.mockResolvedValue(mockStep);
      mockPrismaService.approvalStep.update.mockResolvedValue({});
      mockPrismaService.approvalStep.create.mockResolvedValue(mockNewStep);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.delegateStep('step-1', 'user-3', 'user-2');

      expect(result).toEqual(mockNewStep);
      expect(mockPrismaService.approvalStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: {
          status: 'DELEGATED',
          decision: 'DELEGATE',
          delegatedTo: { connect: { id: 'user-3' } },
        },
      });
      expect(mockPrismaService.approvalStep.create).toHaveBeenCalledWith({
        data: {
          workflow: { connect: { id: 'workflow-1' } },
          stepOrder: 1,
          stepName: 'Technical Review (Delegated)',
          approver: { connect: { id: 'user-3' } },
          status: 'IN_REVIEW',
          dueDate: mockStep.dueDate,
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'UPDATED',
        description: 'Step "Technical Review" delegated',
        performedById: 'user-2',
      });
    });

    it('should throw NotFoundException when step does not exist', async () => {
      mockPrismaService.approvalStep.findUnique.mockResolvedValue(null);

      await expect(service.delegateStep('non-existent', 'user-3', 'user-2')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.delegateStep('non-existent', 'user-3', 'user-2')).rejects.toThrow(
        'Step with ID non-existent not found'
      );
    });
  });

  describe('cancelWorkflow', () => {
    it('should cancel workflow and update document status', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        documentId: 'doc-1',
        status: 'IN_PROGRESS',
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Document', status: 'PENDING_APPROVAL' },
        initiatedBy: { id: 'user-1', email: 'user1@test.com', firstName: 'User', lastName: 'One' },
        steps: [],
      };

      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrismaService.documentApprovalWorkflow.update.mockResolvedValue({});
      mockPrismaService.policyDocument.update.mockResolvedValue({});
      const result = await service.cancelWorkflow('workflow-1', 'user-1');

      expect(mockPrismaService.documentApprovalWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-1' },
        data: {
          status: 'CANCELLED',
          completedAt: expect.any(Date),
          finalOutcome: 'WITHDRAWN',
        },
      });
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { status: 'DRAFT' },
      });
      expect(mockPrismaService.policyDocumentAuditLog.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: 'doc-1' } },
          action: 'UPDATED',
          description: 'Approval workflow cancelled',
          performedBy: { connect: { id: 'user-1' } },
        },
      });
    });

    it('should throw BadRequestException when workflow is already completed', async () => {
      const mockWorkflow = {
        id: 'workflow-1',
        documentId: 'doc-1',
        status: 'APPROVED',
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Document', status: 'APPROVED' },
        initiatedBy: { id: 'user-1', email: 'user1@test.com', firstName: 'User', lastName: 'One' },
        steps: [],
      };

      mockPrismaService.documentApprovalWorkflow.findUnique.mockResolvedValue(mockWorkflow);

      await expect(service.cancelWorkflow('workflow-1', 'user-1')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.cancelWorkflow('workflow-1', 'user-1')).rejects.toThrow(
        'Cannot cancel a completed workflow'
      );
    });
  });

  describe('getPendingApprovals', () => {
    it('should return pending approvals for a user', async () => {
      const userId = 'user-2';
      const mockPendingSteps = [
        {
          id: 'step-1',
          stepOrder: 1,
          stepName: 'Technical Review',
          status: 'IN_REVIEW',
          dueDate: new Date('2024-02-01'),
          workflow: {
            id: 'workflow-1',
            document: {
              id: 'doc-1',
              documentId: 'DOC-001',
              title: 'Test Document',
              documentType: 'POLICY',
            },
          },
        },
        {
          id: 'step-2',
          stepOrder: 1,
          stepName: 'Management Review',
          status: 'IN_REVIEW',
          dueDate: new Date('2024-02-05'),
          workflow: {
            id: 'workflow-2',
            document: {
              id: 'doc-2',
              documentId: 'DOC-002',
              title: 'Another Document',
              documentType: 'PROCEDURE',
            },
          },
        },
      ];

      mockPrismaService.approvalStep.findMany.mockResolvedValue(mockPendingSteps);

      const result = await service.getPendingApprovals(userId);

      expect(result).toEqual(mockPendingSteps);
      expect(mockPrismaService.approvalStep.findMany).toHaveBeenCalledWith({
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
    });

    it('should return empty array when user has no pending approvals', async () => {
      mockPrismaService.approvalStep.findMany.mockResolvedValue([]);

      const result = await service.getPendingApprovals('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getDefaultWorkflowSteps', () => {
    it('should return BOARD level workflow steps', async () => {
      const result = await service.getDefaultWorkflowSteps('BOARD' as ApprovalLevel);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        stepOrder: 1,
        stepName: 'Technical Review',
        approverRole: 'Security Team',
      });
      expect(result[3]).toEqual({
        stepOrder: 4,
        stepName: 'Board Approval',
        approverRole: 'Board',
      });
    });

    it('should return EXECUTIVE level workflow steps', async () => {
      const result = await service.getDefaultWorkflowSteps('EXECUTIVE' as ApprovalLevel);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        stepOrder: 1,
        stepName: 'Technical Review',
        approverRole: 'Security Team',
      });
      expect(result[2]).toEqual({
        stepOrder: 3,
        stepName: 'Executive Approval',
        approverRole: 'Executive',
      });
    });

    it('should return SENIOR_MANAGEMENT level workflow steps', async () => {
      const result = await service.getDefaultWorkflowSteps('SENIOR_MANAGEMENT' as ApprovalLevel);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        stepOrder: 1,
        stepName: 'Technical Review',
        approverRole: 'Security Team',
      });
      expect(result[1]).toEqual({
        stepOrder: 2,
        stepName: 'Senior Management Approval',
        approverRole: 'Senior Management',
      });
    });

    it('should return MANAGEMENT level workflow steps', async () => {
      const result = await service.getDefaultWorkflowSteps('MANAGEMENT' as ApprovalLevel);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        stepOrder: 1,
        stepName: 'Peer Review',
        approverRole: 'Peer',
      });
      expect(result[1]).toEqual({
        stepOrder: 2,
        stepName: 'Management Approval',
        approverRole: 'Manager',
      });
    });

    it('should return TEAM_LEAD level workflow steps', async () => {
      const result = await service.getDefaultWorkflowSteps('TEAM_LEAD' as ApprovalLevel);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        stepOrder: 1,
        stepName: 'Team Lead Approval',
        approverRole: 'Team Lead',
      });
    });

    it('should return PROCESS_OWNER level workflow steps', async () => {
      const result = await service.getDefaultWorkflowSteps('PROCESS_OWNER' as ApprovalLevel);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        stepOrder: 1,
        stepName: 'Process Owner Approval',
        approverRole: 'Process Owner',
      });
    });

    it('should return MANAGEMENT workflow as default for unknown level', async () => {
      const result = await service.getDefaultWorkflowSteps('UNKNOWN' as any);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        stepOrder: 1,
        stepName: 'Peer Review',
        approverRole: 'Peer',
      });
    });
  });
});
