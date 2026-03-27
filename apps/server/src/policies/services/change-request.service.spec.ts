import { Test, TestingModule } from '@nestjs/testing';
import { ChangeRequestService } from './change-request.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditService } from './policy-audit.service';
import { NotFoundException } from '@nestjs/common';
import { ChangeRequestStatus, ChangePriority, ChangeType } from '@prisma/client';

describe('ChangeRequestService', () => {
  let service: ChangeRequestService;
  let prismaService: PrismaService;
  let auditService: PolicyAuditService;

  const mockPrismaService = {
    documentChangeRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    policyDocument: {
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeRequestService,
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

    service = module.get<ChangeRequestService>(ChangeRequestService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<PolicyAuditService>(PolicyAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all change requests with count', async () => {
      const mockChangeRequests = [
        {
          id: 'cr-1',
          changeRequestId: 'CR-2026-001',
          documentId: 'doc-1',
          organisationId: 'org-1',
          title: 'Update policy',
          status: 'SUBMITTED',
          document: { id: 'doc-1', documentId: 'POL-001', title: 'Test Policy' },
          requestedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
          approvedBy: null,
          implementedBy: null,
        },
      ];

      mockPrismaService.documentChangeRequest.findMany.mockResolvedValue(mockChangeRequests);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result).toEqual({ results: mockChangeRequests, count: 1 });
      expect(mockPrismaService.documentChangeRequest.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {},
        orderBy: { requestedAt: 'desc' },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          implementedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should filter by organisationId', async () => {
      const organisationId = 'org-1';
      mockPrismaService.documentChangeRequest.findMany.mockResolvedValue([]);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

      await service.findAll({ organisationId });

      expect(mockPrismaService.documentChangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organisationId },
        })
      );
    });

    it('should filter by documentId', async () => {
      const documentId = 'doc-1';
      mockPrismaService.documentChangeRequest.findMany.mockResolvedValue([]);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

      await service.findAll({ documentId });

      expect(mockPrismaService.documentChangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentId },
        })
      );
    });

    it('should filter by status', async () => {
      const status = 'SUBMITTED' as ChangeRequestStatus;
      mockPrismaService.documentChangeRequest.findMany.mockResolvedValue([]);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

      await service.findAll({ status });

      expect(mockPrismaService.documentChangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status },
        })
      );
    });

    it('should apply pagination with skip and take', async () => {
      mockPrismaService.documentChangeRequest.findMany.mockResolvedValue([]);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

      await service.findAll({ skip: 10, take: 20 });

      expect(mockPrismaService.documentChangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });

    it('should combine multiple filters', async () => {
      const params = {
        organisationId: 'org-1',
        documentId: 'doc-1',
        status: 'APPROVED' as ChangeRequestStatus,
        skip: 5,
        take: 10,
      };

      mockPrismaService.documentChangeRequest.findMany.mockResolvedValue([]);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

      await service.findAll(params);

      expect(mockPrismaService.documentChangeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organisationId: 'org-1',
            documentId: 'doc-1',
            status: 'APPROVED',
          },
          skip: 5,
          take: 10,
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a change request by id', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Update policy',
        status: 'SUBMITTED',
        document: {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Test Policy',
          documentType: 'POLICY',
          version: 1,
          status: 'PUBLISHED',
        },
        requestedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        approvedBy: null,
        implementedBy: null,
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);

      const result = await service.findOne('cr-1');

      expect(result).toEqual(mockChangeRequest);
      expect(mockPrismaService.documentChangeRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'cr-1' },
        include: {
          document: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              version: true,
              status: true,
            },
          },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          implementedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should throw NotFoundException when change request does not exist', async () => {
      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Change request with ID non-existent not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new change request with generated ID', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Update privacy policy',
        description: 'Update for GDPR compliance',
        justification: 'Required by regulation',
        changeType: 'MINOR_REVISION' as ChangeType,
        priority: 'HIGH' as ChangePriority,
        requestedById: 'user-1',
      };

      const mockCreatedRequest = {
        id: 'cr-new',
        changeRequestId: 'CR-2026-001',
        ...createData,
        status: 'SUBMITTED',
        document: { id: 'doc-1', documentId: 'POL-001', title: 'Test Policy' },
        requestedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);
      mockPrismaService.documentChangeRequest.create.mockResolvedValue(mockCreatedRequest);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.create(createData);

      expect(result).toEqual(mockCreatedRequest);
      expect(mockPrismaService.documentChangeRequest.count).toHaveBeenCalledWith({
        where: { organisationId: 'org-1' },
      });
      expect(mockPrismaService.documentChangeRequest.create).toHaveBeenCalledWith({
        data: {
          changeRequestId: 'CR-2026-001',
          document: { connect: { id: 'doc-1' } },
          organisation: { connect: { id: 'org-1' } },
          requestedBy: { connect: { id: 'user-1' } },
          status: 'SUBMITTED',
          title: createData.title,
          description: createData.description,
          justification: createData.justification,
          changeType: createData.changeType,
          priority: createData.priority,
        },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should generate sequential change request IDs', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Test',
        description: 'Test',
        justification: 'Test',
        changeType: 'MINOR_REVISION' as ChangeType,
        priority: 'MEDIUM' as ChangePriority,
        requestedById: 'user-1',
      };

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(5);
      mockPrismaService.documentChangeRequest.create.mockResolvedValue({
        id: 'cr-new',
        changeRequestId: 'CR-2026-006',
      });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.create(createData);

      expect(mockPrismaService.documentChangeRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeRequestId: 'CR-2026-006',
          }),
        })
      );
    });

    it('should include optional fields when provided', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Major update',
        description: 'Complete policy overhaul',
        justification: 'Business needs',
        changeType: 'MAJOR_REVISION' as ChangeType,
        priority: 'CRITICAL' as ChangePriority,
        impactAssessment: 'High impact on operations',
        affectedDocuments: ['doc-2', 'doc-3'],
        affectedProcesses: ['process-1'],
        affectedSystems: ['system-1', 'system-2'],
        targetDate: new Date('2026-03-01'),
        requestedById: 'user-1',
      };

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);
      mockPrismaService.documentChangeRequest.create.mockResolvedValue({
        id: 'cr-new',
        changeRequestId: 'CR-2026-001',
      });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.create(createData);

      expect(mockPrismaService.documentChangeRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            impactAssessment: 'High impact on operations',
            affectedDocuments: ['doc-2', 'doc-3'],
            affectedProcesses: ['process-1'],
            affectedSystems: ['system-1', 'system-2'],
            targetDate: new Date('2026-03-01'),
          }),
        })
      );
    });

    it('should create audit log entry', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Test change',
        description: 'Test',
        justification: 'Test',
        changeType: 'MINOR_REVISION' as ChangeType,
        priority: 'MEDIUM' as ChangePriority,
        requestedById: 'user-1',
      };

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);
      mockPrismaService.documentChangeRequest.create.mockResolvedValue({
        id: 'cr-new',
        changeRequestId: 'CR-2026-001',
      });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.create(createData);

      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'UPDATED',
        description: 'Change request CR-2026-001 submitted: Test change',
        performedById: 'user-1',
        newValue: {
          changeRequestId: 'CR-2026-001',
          changeType: 'MINOR_REVISION',
          priority: 'MEDIUM',
        },
      });
    });
  });

  describe('update', () => {
    it('should update a change request', async () => {
      const updateData = {
        title: 'Updated title',
        description: 'Updated description',
        priority: 'CRITICAL' as ChangePriority,
      };

      const mockUpdatedRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        ...updateData,
        document: { id: 'doc-1', documentId: 'POL-001', title: 'Test Policy' },
        requestedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentChangeRequest.update.mockResolvedValue(mockUpdatedRequest);

      const result = await service.update('cr-1', updateData);

      expect(result).toEqual(mockUpdatedRequest);
      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith({
        where: { id: 'cr-1' },
        data: updateData,
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });
  });

  describe('approve', () => {
    it('should approve a submitted change request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'SUBMITTED',
      };

      const mockApprovedRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        status: 'APPROVED',
        approvedBy: { id: 'approver-1' },
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue(mockApprovedRequest);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.approve('cr-1', {
        approvedById: 'approver-1',
        approvalComments: 'Approved for implementation',
      });

      expect(result).toEqual(mockApprovedRequest);
      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith({
        where: { id: 'cr-1' },
        data: {
          status: 'APPROVED',
          approvedBy: { connect: { id: 'approver-1' } },
          approvalDate: expect.any(Date),
          approvalComments: 'Approved for implementation',
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'APPROVED',
        description: 'Change request CR-2026-001 approved',
        performedById: 'approver-1',
      });
    });

    it('should approve an under review change request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'UNDER_REVIEW',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue({ status: 'APPROVED' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.approve('cr-1', { approvedById: 'approver-1' });

      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalled();
    });

    it('should throw error when trying to approve non-submitted/non-reviewed request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'APPROVED',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);

      await expect(
        service.approve('cr-1', { approvedById: 'approver-1' })
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.approve('cr-1', { approvedById: 'approver-1' })
      ).rejects.toThrow('Change request cannot be approved in current status');
    });

    it('should throw error when change request not found', async () => {
      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.approve('non-existent', { approvedById: 'approver-1' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should reject a submitted change request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'SUBMITTED',
      };

      const mockRejectedRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        status: 'REJECTED',
        approvedBy: { id: 'approver-1' },
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue(mockRejectedRequest);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.reject('cr-1', {
        approvedById: 'approver-1',
        approvalComments: 'Not aligned with strategy',
      });

      expect(result).toEqual(mockRejectedRequest);
      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith({
        where: { id: 'cr-1' },
        data: {
          status: 'REJECTED',
          approvedBy: { connect: { id: 'approver-1' } },
          approvalDate: expect.any(Date),
          approvalComments: 'Not aligned with strategy',
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'REJECTED',
        description: 'Change request CR-2026-001 rejected',
        performedById: 'approver-1',
      });
    });

    it('should reject an under review change request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'UNDER_REVIEW',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue({ status: 'REJECTED' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.reject('cr-1', {
        approvedById: 'approver-1',
        approvalComments: 'Insufficient justification',
      });

      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalled();
    });

    it('should throw error when trying to reject non-submitted/non-reviewed request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'IMPLEMENTED',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);

      await expect(
        service.reject('cr-1', { approvedById: 'approver-1', approvalComments: 'Test' })
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.reject('cr-1', { approvedById: 'approver-1', approvalComments: 'Test' })
      ).rejects.toThrow('Change request cannot be rejected in current status');
    });
  });

  describe('startImplementation', () => {
    it('should start implementation of approved change request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'APPROVED',
      };

      const mockUpdatedRequest = {
        id: 'cr-1',
        status: 'IN_PROGRESS',
        implementedBy: { id: 'implementer-1' },
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue(mockUpdatedRequest);
      mockPrismaService.policyDocument.update.mockResolvedValue({ status: 'UNDER_REVISION' });

      const result = await service.startImplementation('cr-1', 'implementer-1');

      expect(result).toEqual(mockUpdatedRequest);
      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith({
        where: { id: 'cr-1' },
        data: {
          status: 'IN_PROGRESS',
          implementedBy: { connect: { id: 'implementer-1' } },
        },
      });
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { status: 'UNDER_REVISION' },
      });
    });

    it('should throw error when trying to start implementation on non-approved request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'SUBMITTED',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);

      await expect(
        service.startImplementation('cr-1', 'implementer-1')
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.startImplementation('cr-1', 'implementer-1')
      ).rejects.toThrow('Change request must be approved before implementation');
    });
  });

  describe('completeImplementation', () => {
    it('should complete implementation of in-progress change request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'IN_PROGRESS',
        implementedBy: { id: 'implementer-1' },
      };

      const mockCompletedRequest = {
        id: 'cr-1',
        status: 'IMPLEMENTED',
        implementedAt: expect.any(Date),
        actualCompletionDate: expect.any(Date),
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue(mockCompletedRequest);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.completeImplementation('cr-1', {});

      expect(result).toEqual(mockCompletedRequest);
      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith({
        where: { id: 'cr-1' },
        data: {
          status: 'IMPLEMENTED',
          implementedAt: expect.any(Date),
          actualCompletionDate: expect.any(Date),
          newVersionId: undefined,
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'UPDATED',
        description: 'Change request CR-2026-001 implemented',
        performedById: 'implementer-1',
      });
    });

    it('should complete implementation with new version ID', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'IN_PROGRESS',
        implementedBy: { id: 'implementer-1' },
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue({ status: 'IMPLEMENTED' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.completeImplementation('cr-1', { newVersionId: 'version-2' });

      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            newVersionId: 'version-2',
          }),
        })
      );
    });

    it('should not create audit log when implementedBy is null', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'IN_PROGRESS',
        implementedBy: null,
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue({ status: 'IMPLEMENTED' });

      await service.completeImplementation('cr-1', {});

      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should throw error when trying to complete non-in-progress request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'APPROVED',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);

      await expect(
        service.completeImplementation('cr-1', {})
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.completeImplementation('cr-1', {})
      ).rejects.toThrow('Change request must be in progress to complete');
    });
  });

  describe('verify', () => {
    it('should verify an implemented change request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'IMPLEMENTED',
      };

      const mockVerifiedRequest = {
        id: 'cr-1',
        status: 'VERIFIED',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue(mockVerifiedRequest);

      const result = await service.verify('cr-1', 'verifier-1');

      expect(result).toEqual(mockVerifiedRequest);
      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith({
        where: { id: 'cr-1' },
        data: { status: 'VERIFIED' },
      });
    });

    it('should throw error when trying to verify non-implemented request', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        changeRequestId: 'CR-2026-001',
        documentId: 'doc-1',
        status: 'IN_PROGRESS',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);

      await expect(
        service.verify('cr-1', 'verifier-1')
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.verify('cr-1', 'verifier-1')
      ).rejects.toThrow('Change request must be implemented before verification');
    });
  });

  describe('getStats', () => {
    it('should return statistics for an organisation', async () => {
      const organisationId = 'org-1';

      const mockByStatus = [
        { status: 'SUBMITTED', _count: 5 },
        { status: 'UNDER_REVIEW', _count: 3 },
        { status: 'APPROVED', _count: 2 },
        { status: 'IN_PROGRESS', _count: 4 },
        { status: 'IMPLEMENTED', _count: 10 },
        { status: 'VERIFIED', _count: 8 },
        { status: 'REJECTED', _count: 2 },
      ];

      const mockByPriority = [
        { priority: 'CRITICAL', _count: 3 },
        { priority: 'HIGH', _count: 5 },
        { priority: 'MEDIUM', _count: 4 },
        { priority: 'LOW', _count: 2 },
      ];

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(34);
      mockPrismaService.documentChangeRequest.groupBy
        .mockResolvedValueOnce(mockByStatus)
        .mockResolvedValueOnce(mockByPriority);

      const result = await service.getStats(organisationId);

      expect(result).toEqual({
        total: 34,
        byStatus: {
          SUBMITTED: 5,
          UNDER_REVIEW: 3,
          APPROVED: 2,
          IN_PROGRESS: 4,
          IMPLEMENTED: 10,
          VERIFIED: 8,
          REJECTED: 2,
        },
        byPriority: {
          CRITICAL: 3,
          HIGH: 5,
          MEDIUM: 4,
          LOW: 2,
        },
        pending: 8,
        inProgress: 4,
      });

      expect(mockPrismaService.documentChangeRequest.count).toHaveBeenCalledWith({
        where: { organisationId },
      });

      expect(mockPrismaService.documentChangeRequest.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { organisationId },
        _count: true,
      });

      expect(mockPrismaService.documentChangeRequest.groupBy).toHaveBeenCalledWith({
        by: ['priority'],
        where: {
          organisationId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'] },
        },
        _count: true,
      });
    });

    it('should handle empty statistics', async () => {
      const organisationId = 'org-empty';

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);
      mockPrismaService.documentChangeRequest.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getStats(organisationId);

      expect(result).toEqual({
        total: 0,
        byStatus: {},
        byPriority: {},
        pending: 0,
        inProgress: 0,
      });
    });

    it('should calculate pending count correctly', async () => {
      const organisationId = 'org-1';

      const mockByStatus = [
        { status: 'SUBMITTED', _count: 7 },
        { status: 'UNDER_REVIEW', _count: 3 },
        { status: 'APPROVED', _count: 5 },
      ];

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(15);
      mockPrismaService.documentChangeRequest.groupBy
        .mockResolvedValueOnce(mockByStatus)
        .mockResolvedValueOnce([]);

      const result = await service.getStats(organisationId);

      expect(result.pending).toBe(10);
    });

    it('should return 0 for inProgress when no in-progress requests exist', async () => {
      const organisationId = 'org-1';

      const mockByStatus = [
        { status: 'SUBMITTED', _count: 5 },
        { status: 'APPROVED', _count: 2 },
      ];

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(7);
      mockPrismaService.documentChangeRequest.groupBy
        .mockResolvedValueOnce(mockByStatus)
        .mockResolvedValueOnce([]);

      const result = await service.getStats(organisationId);

      expect(result.inProgress).toBe(0);
    });
  });

  describe('status transitions', () => {
    it('should follow correct workflow: SUBMITTED -> APPROVED -> IN_PROGRESS -> IMPLEMENTED -> VERIFIED', async () => {
      const changeRequestId = 'cr-1';

      mockPrismaService.documentChangeRequest.findUnique
        .mockResolvedValueOnce({ id: changeRequestId, status: 'SUBMITTED', documentId: 'doc-1', changeRequestId: 'CR-2026-001' })
        .mockResolvedValueOnce({ id: changeRequestId, status: 'APPROVED', documentId: 'doc-1', changeRequestId: 'CR-2026-001' })
        .mockResolvedValueOnce({ id: changeRequestId, status: 'IN_PROGRESS', documentId: 'doc-1', changeRequestId: 'CR-2026-001', implementedBy: { id: 'user-1' } })
        .mockResolvedValueOnce({ id: changeRequestId, status: 'IMPLEMENTED', documentId: 'doc-1', changeRequestId: 'CR-2026-001' });

      mockPrismaService.documentChangeRequest.update.mockResolvedValue({});
      mockPrismaService.policyDocument.update.mockResolvedValue({});
      mockAuditService.log.mockResolvedValue(undefined);

      await service.approve(changeRequestId, { approvedById: 'approver-1' });
      await service.startImplementation(changeRequestId, 'implementer-1');
      await service.completeImplementation(changeRequestId, {});
      await service.verify(changeRequestId, 'verifier-1');

      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledTimes(4);
    });

    it('should allow rejection from UNDER_REVIEW status', async () => {
      const mockChangeRequest = {
        id: 'cr-1',
        status: 'UNDER_REVIEW',
        documentId: 'doc-1',
        changeRequestId: 'CR-2026-001',
      };

      mockPrismaService.documentChangeRequest.findUnique.mockResolvedValue(mockChangeRequest);
      mockPrismaService.documentChangeRequest.update.mockResolvedValue({ status: 'REJECTED' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.reject('cr-1', {
        approvedById: 'approver-1',
        approvalComments: 'Needs more detail',
      });

      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REJECTED',
          }),
        })
      );
    });
  });

  describe('impact assessment', () => {
    it('should store impact assessment in change request', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Major change',
        description: 'Significant update',
        justification: 'Regulatory requirement',
        changeType: 'MAJOR_REVISION' as ChangeType,
        priority: 'CRITICAL' as ChangePriority,
        impactAssessment: 'This change will affect 15 downstream policies and require system updates',
        affectedDocuments: ['doc-2', 'doc-3', 'doc-4'],
        affectedProcesses: ['approval-process', 'review-process'],
        affectedSystems: ['hrms', 'compliance-portal'],
        requestedById: 'user-1',
      };

      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);
      mockPrismaService.documentChangeRequest.create.mockResolvedValue({
        id: 'cr-new',
        ...createData,
      });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.create(createData);

      expect(mockPrismaService.documentChangeRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            impactAssessment: 'This change will affect 15 downstream policies and require system updates',
            affectedDocuments: ['doc-2', 'doc-3', 'doc-4'],
            affectedProcesses: ['approval-process', 'review-process'],
            affectedSystems: ['hrms', 'compliance-portal'],
          }),
        })
      );
    });

    it('should update impact assessment via update method', async () => {
      const updateData = {
        impactAssessment: 'Updated assessment with reduced scope',
        affectedDocuments: ['doc-2'],
      };

      mockPrismaService.documentChangeRequest.update.mockResolvedValue({
        id: 'cr-1',
        ...updateData,
      });

      await service.update('cr-1', updateData);

      expect(mockPrismaService.documentChangeRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: updateData,
        })
      );
    });
  });
});
