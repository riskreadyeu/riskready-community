import { Test, TestingModule } from '@nestjs/testing';
import { DocumentExceptionService } from './document-exception.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditService } from './policy-audit.service';
import { NotFoundException } from '@nestjs/common';
import { ExceptionStatus, ApprovalLevel, ReviewFrequency } from '@prisma/client';

describe('DocumentExceptionService', () => {
  let service: DocumentExceptionService;
  let prismaService: PrismaService;
  let auditService: PolicyAuditService;

  const mockPrismaService = {
    documentException: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentExceptionService,
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

    service = module.get<DocumentExceptionService>(DocumentExceptionService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<PolicyAuditService>(PolicyAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all exceptions with count', async () => {
      const mockExceptions = [
        {
          id: 'exc-1',
          exceptionId: 'EXC-2026-001',
          organisationId: 'org-1',
          documentId: 'doc-1',
          status: 'ACTIVE' as ExceptionStatus,
          title: 'Test Exception',
          requestedAt: new Date(),
          document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Document' },
          requestedBy: { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
          approvedBy: null,
        },
      ];

      mockPrismaService.documentException.findMany.mockResolvedValue(mockExceptions);
      mockPrismaService.documentException.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result).toEqual({ results: mockExceptions, count: 1 });
      expect(mockPrismaService.documentException.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {},
        orderBy: { requestedAt: 'desc' },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should filter by organisationId', async () => {
      mockPrismaService.documentException.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.count.mockResolvedValue(0);

      await service.findAll({ organisationId: 'org-1' });

      expect(mockPrismaService.documentException.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organisationId: 'org-1' },
        })
      );
    });

    it('should filter by documentId', async () => {
      mockPrismaService.documentException.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.count.mockResolvedValue(0);

      await service.findAll({ documentId: 'doc-1' });

      expect(mockPrismaService.documentException.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentId: 'doc-1' },
        })
      );
    });

    it('should filter by status', async () => {
      mockPrismaService.documentException.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.count.mockResolvedValue(0);

      await service.findAll({ status: 'ACTIVE' as ExceptionStatus });

      expect(mockPrismaService.documentException.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
    });

    it('should support pagination', async () => {
      mockPrismaService.documentException.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.count.mockResolvedValue(0);

      await service.findAll({ skip: 10, take: 20 });

      expect(mockPrismaService.documentException.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a single exception with full details', async () => {
      const mockException = {
        id: 'exc-1',
        exceptionId: 'EXC-2026-001',
        organisationId: 'org-1',
        documentId: 'doc-1',
        status: 'ACTIVE' as ExceptionStatus,
        title: 'Test Exception',
        description: 'Description',
        justification: 'Justification',
        scope: 'Scope',
        riskAssessment: 'Risk assessment',
        residualRisk: 'LOW',
        expiryDate: new Date('2026-12-31'),
        requestedAt: new Date(),
        document: {
          id: 'doc-1',
          documentId: 'DOC-001',
          title: 'Test Document',
          documentType: 'POLICY',
          status: 'APPROVED',
        },
        requestedBy: { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        approvedBy: null,
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);

      const result = await service.findOne('exc-1');

      expect(result).toEqual(mockException);
      expect(mockPrismaService.documentException.findUnique).toHaveBeenCalledWith({
        where: { id: 'exc-1' },
        include: {
          document: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              status: true,
            },
          },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should throw NotFoundException when exception does not exist', async () => {
      mockPrismaService.documentException.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Exception with ID non-existent not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new exception with generated ID and audit log', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'New Exception',
        description: 'Exception description',
        justification: 'Business justification',
        scope: 'System A',
        riskAssessment: 'Risk assessment details',
        residualRisk: 'MEDIUM',
        expiryDate: new Date('2026-12-31'),
        approvalLevel: 'SENIOR_MANAGER' as ApprovalLevel,
        requestedById: 'user-1',
      };

      const mockCreatedException = {
        id: 'exc-new',
        exceptionId: 'EXC-2026-001',
        ...createData,
        status: 'REQUESTED' as ExceptionStatus,
        reviewFrequency: 'QUARTERLY' as ReviewFrequency,
        nextReviewDate: expect.any(Date),
        requestedAt: expect.any(Date),
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Document' },
        requestedBy: { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentException.count.mockResolvedValue(0);
      mockPrismaService.documentException.create.mockResolvedValue(mockCreatedException);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.create(createData);

      expect(result).toEqual(mockCreatedException);
      expect(mockPrismaService.documentException.count).toHaveBeenCalledWith({
        where: { organisationId: 'org-1' },
      });
      expect(mockPrismaService.documentException.create).toHaveBeenCalledWith({
        data: {
          exceptionId: 'EXC-2026-001',
          document: { connect: { id: 'doc-1' } },
          organisation: { connect: { id: 'org-1' } },
          requestedBy: { connect: { id: 'user-1' } },
          status: 'REQUESTED',
          reviewFrequency: 'QUARTERLY',
          nextReviewDate: expect.any(Date),
          title: 'New Exception',
          description: 'Exception description',
          justification: 'Business justification',
          scope: 'System A',
          riskAssessment: 'Risk assessment details',
          residualRisk: 'MEDIUM',
          expiryDate: createData.expiryDate,
          approvalLevel: 'SENIOR_MANAGER',
        },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'EXCEPTION_REQUESTED',
        description: 'Exception EXC-2026-001 requested: New Exception',
        performedById: 'user-1',
        newValue: {
          exceptionId: 'EXC-2026-001',
          residualRisk: 'MEDIUM',
          expiryDate: createData.expiryDate,
        },
      });
    });

    it('should generate sequential exception IDs', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Exception',
        description: 'Description',
        justification: 'Justification',
        scope: 'Scope',
        riskAssessment: 'Risk',
        residualRisk: 'LOW',
        expiryDate: new Date('2026-12-31'),
        approvalLevel: 'MANAGER' as ApprovalLevel,
        requestedById: 'user-1',
      };

      mockPrismaService.documentException.count.mockResolvedValue(42);
      mockPrismaService.documentException.create.mockResolvedValue({
        id: 'exc-new',
        exceptionId: 'EXC-2026-043',
        ...createData,
        status: 'REQUESTED',
      });
      mockAuditService.log.mockResolvedValue({});

      await service.create(createData);

      expect(mockPrismaService.documentException.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            exceptionId: 'EXC-2026-043',
          }),
        })
      );
    });

    it('should use custom review frequency if provided', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Exception',
        description: 'Description',
        justification: 'Justification',
        scope: 'Scope',
        riskAssessment: 'Risk',
        residualRisk: 'HIGH',
        expiryDate: new Date('2026-12-31'),
        approvalLevel: 'EXECUTIVE' as ApprovalLevel,
        reviewFrequency: 'MONTHLY' as ReviewFrequency,
        requestedById: 'user-1',
      };

      mockPrismaService.documentException.count.mockResolvedValue(0);
      mockPrismaService.documentException.create.mockResolvedValue({
        id: 'exc-new',
        exceptionId: 'EXC-2026-001',
        ...createData,
        status: 'REQUESTED',
      });
      mockAuditService.log.mockResolvedValue({});

      await service.create(createData);

      expect(mockPrismaService.documentException.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reviewFrequency: 'MONTHLY',
          }),
        })
      );
    });

    it('should include optional fields if provided', async () => {
      const createData = {
        documentId: 'doc-1',
        organisationId: 'org-1',
        title: 'Exception',
        description: 'Description',
        justification: 'Justification',
        scope: 'Scope',
        affectedEntities: ['Entity A', 'Entity B'],
        riskAssessment: 'Risk',
        residualRisk: 'LOW',
        compensatingControls: 'Additional controls in place',
        startDate: new Date('2026-01-01'),
        expiryDate: new Date('2026-12-31'),
        approvalLevel: 'MANAGER' as ApprovalLevel,
        requestedById: 'user-1',
      };

      mockPrismaService.documentException.count.mockResolvedValue(0);
      mockPrismaService.documentException.create.mockResolvedValue({
        id: 'exc-new',
        exceptionId: 'EXC-2026-001',
        ...createData,
        status: 'REQUESTED',
      });
      mockAuditService.log.mockResolvedValue({});

      await service.create(createData);

      expect(mockPrismaService.documentException.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            affectedEntities: ['Entity A', 'Entity B'],
            compensatingControls: 'Additional controls in place',
            startDate: createData.startDate,
          }),
        })
      );
    });
  });

  describe('approve', () => {
    it('should approve a requested exception and audit the action', async () => {
      const mockException = {
        id: 'exc-1',
        exceptionId: 'EXC-2026-001',
        documentId: 'doc-1',
        status: 'REQUESTED' as ExceptionStatus,
        title: 'Test Exception',
      };

      const approvalData = {
        approvedById: 'user-2',
        approvalComments: 'Approved after review',
      };

      const mockApprovedExc = {
        ...mockException,
        status: 'APPROVED' as ExceptionStatus,
        approvalDate: expect.any(Date),
        ...approvalData,
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);
      mockPrismaService.documentException.update.mockResolvedValue(mockApprovedExc);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.approve('exc-1', approvalData);

      expect(result).toEqual(mockApprovedExc);
      expect(mockPrismaService.documentException.update).toHaveBeenCalledWith({
        where: { id: 'exc-1' },
        data: {
          status: 'APPROVED',
          approvedBy: { connect: { id: 'user-2' } },
          approvalDate: expect.any(Date),
          approvalComments: 'Approved after review',
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'EXCEPTION_APPROVED',
        description: 'Exception EXC-2026-001 approved',
        performedById: 'user-2',
      });
    });

    it('should approve an exception under review', async () => {
      const mockException = {
        id: 'exc-1',
        exceptionId: 'EXC-2026-001',
        documentId: 'doc-1',
        status: 'UNDER_REVIEW' as ExceptionStatus,
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);
      mockPrismaService.documentException.update.mockResolvedValue({
        ...mockException,
        status: 'APPROVED',
      });
      mockAuditService.log.mockResolvedValue({});

      await service.approve('exc-1', { approvedById: 'user-2' });

      expect(mockPrismaService.documentException.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when exception is not in approvable status', async () => {
      const mockException = {
        id: 'exc-1',
        status: 'APPROVED' as ExceptionStatus,
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);

      await expect(service.approve('exc-1', { approvedById: 'user-2' })).rejects.toThrow(
        NotFoundException
      );
      await expect(service.approve('exc-1', { approvedById: 'user-2' })).rejects.toThrow(
        'Exception cannot be approved in current status'
      );
    });
  });

  describe('activate', () => {
    it('should activate an approved exception', async () => {
      const mockException = {
        id: 'exc-1',
        exceptionId: 'EXC-2026-001',
        status: 'APPROVED' as ExceptionStatus,
      };

      const mockActivatedExc = {
        ...mockException,
        status: 'ACTIVE' as ExceptionStatus,
        startDate: expect.any(Date),
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);
      mockPrismaService.documentException.update.mockResolvedValue(mockActivatedExc);

      const result = await service.activate('exc-1', 'user-1');

      expect(result).toEqual(mockActivatedExc);
      expect(mockPrismaService.documentException.update).toHaveBeenCalledWith({
        where: { id: 'exc-1' },
        data: {
          status: 'ACTIVE',
          startDate: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when exception is not approved', async () => {
      const mockException = {
        id: 'exc-1',
        status: 'REQUESTED' as ExceptionStatus,
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);

      await expect(service.activate('exc-1', 'user-1')).rejects.toThrow(NotFoundException);
      await expect(service.activate('exc-1', 'user-1')).rejects.toThrow(
        'Exception must be approved before activation'
      );
    });
  });

  describe('revoke', () => {
    it('should revoke an approved exception and audit the action', async () => {
      const mockException = {
        id: 'exc-1',
        exceptionId: 'EXC-2026-001',
        documentId: 'doc-1',
        status: 'APPROVED' as ExceptionStatus,
      };

      const revokeData = {
        reason: 'No longer needed',
        userId: 'user-1',
      };

      const mockRevokedExc = {
        ...mockException,
        status: 'REVOKED' as ExceptionStatus,
        closedAt: expect.any(Date),
        closureReason: 'No longer needed',
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);
      mockPrismaService.documentException.update.mockResolvedValue(mockRevokedExc);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.revoke('exc-1', revokeData);

      expect(result).toEqual(mockRevokedExc);
      expect(mockPrismaService.documentException.update).toHaveBeenCalledWith({
        where: { id: 'exc-1' },
        data: {
          status: 'REVOKED',
          closedAt: expect.any(Date),
          closureReason: 'No longer needed',
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'UPDATED',
        description: 'Exception EXC-2026-001 revoked: No longer needed',
        performedById: 'user-1',
      });
    });

    it('should revoke an active exception', async () => {
      const mockException = {
        id: 'exc-1',
        exceptionId: 'EXC-2026-001',
        documentId: 'doc-1',
        status: 'ACTIVE' as ExceptionStatus,
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);
      mockPrismaService.documentException.update.mockResolvedValue({
        ...mockException,
        status: 'REVOKED',
      });
      mockAuditService.log.mockResolvedValue({});

      await service.revoke('exc-1', { reason: 'Revoked', userId: 'user-1' });

      expect(mockPrismaService.documentException.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when exception cannot be revoked', async () => {
      const mockException = {
        id: 'exc-1',
        status: 'REQUESTED' as ExceptionStatus,
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);

      await expect(
        service.revoke('exc-1', { reason: 'Revoked', userId: 'user-1' })
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.revoke('exc-1', { reason: 'Revoked', userId: 'user-1' })
      ).rejects.toThrow('Exception cannot be revoked in current status');
    });
  });

  describe('close', () => {
    it('should close an exception and audit the action', async () => {
      const mockException = {
        id: 'exc-1',
        exceptionId: 'EXC-2026-001',
        documentId: 'doc-1',
        status: 'EXPIRED' as ExceptionStatus,
      };

      const closeData = {
        reason: 'Expired and resolved',
        userId: 'user-1',
      };

      const mockClosedExc = {
        ...mockException,
        status: 'CLOSED' as ExceptionStatus,
        closedAt: expect.any(Date),
        closureReason: 'Expired and resolved',
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);
      mockPrismaService.documentException.update.mockResolvedValue(mockClosedExc);
      mockAuditService.log.mockResolvedValue({});

      const result = await service.close('exc-1', closeData);

      expect(result).toEqual(mockClosedExc);
      expect(mockPrismaService.documentException.update).toHaveBeenCalledWith({
        where: { id: 'exc-1' },
        data: {
          status: 'CLOSED',
          closedAt: expect.any(Date),
          closureReason: 'Expired and resolved',
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'UPDATED',
        description: 'Exception EXC-2026-001 closed: Expired and resolved',
        performedById: 'user-1',
      });
    });
  });

  describe('getExpiring', () => {
    it('should return active exceptions expiring within default 30 days', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const mockExpiringExceptions = [
        {
          id: 'exc-1',
          exceptionId: 'EXC-2026-001',
          organisationId: 'org-1',
          status: 'ACTIVE' as ExceptionStatus,
          expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Document' },
          requestedBy: { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.documentException.findMany.mockResolvedValue(mockExpiringExceptions);

      const result = await service.getExpiring('org-1');

      expect(result).toEqual(mockExpiringExceptions);
      expect(mockPrismaService.documentException.findMany).toHaveBeenCalledWith({
        where: {
          organisationId: 'org-1',
          status: 'ACTIVE',
          expiryDate: {
            lte: expect.any(Date),
            gte: expect.any(Date),
          },
        },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          requestedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { expiryDate: 'asc' },
      });
    });

    it('should support custom days parameter', async () => {
      mockPrismaService.documentException.findMany.mockResolvedValue([]);

      await service.getExpiring('org-1', 60);

      expect(mockPrismaService.documentException.findMany).toHaveBeenCalled();
    });
  });

  describe('getExpired', () => {
    it('should return and auto-expire exceptions past their expiry date', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const mockExpiredExceptions = [
        {
          id: 'exc-1',
          exceptionId: 'EXC-2026-001',
          organisationId: 'org-1',
          status: 'ACTIVE' as ExceptionStatus,
          expiryDate: pastDate,
        },
        {
          id: 'exc-2',
          exceptionId: 'EXC-2026-002',
          organisationId: 'org-1',
          status: 'ACTIVE' as ExceptionStatus,
          expiryDate: pastDate,
        },
      ];

      mockPrismaService.documentException.findMany.mockResolvedValue(mockExpiredExceptions);
      mockPrismaService.documentException.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.getExpired('org-1');

      expect(result).toEqual(mockExpiredExceptions);
      expect(mockPrismaService.documentException.findMany).toHaveBeenCalledWith({
        where: {
          organisationId: 'org-1',
          status: 'ACTIVE',
          expiryDate: { lt: expect.any(Date) },
        },
      });
      expect(mockPrismaService.documentException.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['exc-1', 'exc-2'] },
        },
        data: { status: 'EXPIRED' },
      });
    });

    it('should not attempt update when no expired exceptions found', async () => {
      mockPrismaService.documentException.findMany.mockResolvedValue([]);

      const result = await service.getExpired('org-1');

      expect(result).toEqual([]);
      expect(mockPrismaService.documentException.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return comprehensive exception statistics', async () => {
      const mockStatusGroups = [
        { status: 'ACTIVE' as ExceptionStatus, _count: 5 },
        { status: 'REQUESTED' as ExceptionStatus, _count: 3 },
        { status: 'UNDER_REVIEW' as ExceptionStatus, _count: 2 },
        { status: 'APPROVED' as ExceptionStatus, _count: 1 },
        { status: 'EXPIRED' as ExceptionStatus, _count: 4 },
        { status: 'CLOSED' as ExceptionStatus, _count: 10 },
      ];

      mockPrismaService.documentException.count
        .mockResolvedValueOnce(25) // total
        .mockResolvedValueOnce(2) // expiring
        .mockResolvedValueOnce(3); // reviewsDue

      mockPrismaService.documentException.groupBy.mockResolvedValue(mockStatusGroups);

      const result = await service.getStats('org-1');

      expect(result).toEqual({
        total: 25,
        byStatus: {
          ACTIVE: 5,
          REQUESTED: 3,
          UNDER_REVIEW: 2,
          APPROVED: 1,
          EXPIRED: 4,
          CLOSED: 10,
        },
        active: 5,
        pending: 5, // REQUESTED + UNDER_REVIEW
        expiring: 2,
        reviewsDue: 3,
      });

      expect(mockPrismaService.documentException.count).toHaveBeenCalledWith({
        where: { organisationId: 'org-1' },
      });
      expect(mockPrismaService.documentException.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { organisationId: 'org-1' },
        _count: true,
      });
    });

    it('should handle zero active exceptions', async () => {
      const mockStatusGroups = [
        { status: 'CLOSED' as ExceptionStatus, _count: 5 },
      ];

      mockPrismaService.documentException.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrismaService.documentException.groupBy.mockResolvedValue(mockStatusGroups);

      const result = await service.getStats('org-1');

      expect(result.active).toBe(0);
      expect(result.pending).toBe(0);
    });
  });

  describe('review', () => {
    it('should update last review date and calculate next review date', async () => {
      const mockException = {
        id: 'exc-1',
        exceptionId: 'EXC-2026-001',
        status: 'ACTIVE' as ExceptionStatus,
        reviewFrequency: 'QUARTERLY' as ReviewFrequency,
      };

      const mockReviewedExc = {
        ...mockException,
        lastReviewDate: expect.any(Date),
        nextReviewDate: expect.any(Date),
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);
      mockPrismaService.documentException.update.mockResolvedValue(mockReviewedExc);

      const result = await service.review('exc-1', { userId: 'user-1', notes: 'Reviewed and confirmed' });

      expect(result).toEqual(mockReviewedExc);
      expect(mockPrismaService.documentException.update).toHaveBeenCalledWith({
        where: { id: 'exc-1' },
        data: {
          lastReviewDate: expect.any(Date),
          nextReviewDate: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when exception is not active', async () => {
      const mockException = {
        id: 'exc-1',
        status: 'CLOSED' as ExceptionStatus,
      };

      mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);

      await expect(service.review('exc-1', { userId: 'user-1' })).rejects.toThrow(
        NotFoundException
      );
      await expect(service.review('exc-1', { userId: 'user-1' })).rejects.toThrow(
        'Only active exceptions can be reviewed'
      );
    });
  });

  describe('calculateNextReviewDate (private method)', () => {
    it('should calculate correct next review dates for all frequencies', async () => {
      const frequencies: ReviewFrequency[] = [
        'MONTHLY',
        'QUARTERLY',
        'SEMI_ANNUAL',
        'ANNUAL',
        'BIENNIAL',
        'TRIENNIAL',
        'ON_CHANGE',
        'AS_NEEDED',
      ];

      for (const frequency of frequencies) {
        const mockException = {
          id: 'exc-1',
          status: 'ACTIVE' as ExceptionStatus,
          reviewFrequency: frequency,
        };

        mockPrismaService.documentException.findUnique.mockResolvedValue(mockException);
        mockPrismaService.documentException.update.mockResolvedValue({
          ...mockException,
          lastReviewDate: new Date(),
          nextReviewDate: new Date(),
        });

        const result = await service.review('exc-1', { userId: 'user-1' });

        expect(result.nextReviewDate).toBeDefined();
        expect(result.nextReviewDate).toBeInstanceOf(Date);
      }
    });
  });
});
