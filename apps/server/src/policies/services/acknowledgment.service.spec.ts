import { Test, TestingModule } from '@nestjs/testing';
import { AcknowledgmentService } from './acknowledgment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditService } from './policy-audit.service';
import { NotFoundException } from '@nestjs/common';
import { AcknowledgmentMethod } from '@prisma/client';

describe('AcknowledgmentService', () => {
  let service: AcknowledgmentService;
  let prismaService: PrismaService;
  let auditService: PolicyAuditService;

  const mockPrismaService = {
    documentAcknowledgment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    policyDocument: {
      findUnique: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcknowledgmentService,
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

    service = module.get<AcknowledgmentService>(AcknowledgmentService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<PolicyAuditService>(PolicyAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all acknowledgments with count', async () => {
      const mockAcknowledgments = [
        {
          id: 'ack-1',
          documentId: 'doc-1',
          userId: 'user-1',
          isAcknowledged: true,
          createdAt: new Date(),
          document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy', documentType: 'POLICY' },
          user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
        },
        {
          id: 'ack-2',
          documentId: 'doc-1',
          userId: 'user-2',
          isAcknowledged: false,
          createdAt: new Date(),
          document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy', documentType: 'POLICY' },
          user: { id: 'user-2', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith' },
        },
      ];

      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue(mockAcknowledgments);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(2);

      const result = await service.findAll();

      expect(result.results).toEqual(mockAcknowledgments);
      expect(result.count).toBe(2);
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {},
        orderBy: { createdAt: 'desc' },
        include: {
          document: { select: { id: true, documentId: true, title: true, documentType: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
      expect(mockPrismaService.documentAcknowledgment.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should filter acknowledgments by documentId', async () => {
      const documentId = 'doc-1';
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);

      await service.findAll({ documentId });

      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentId },
        })
      );
    });

    it('should filter acknowledgments by userId', async () => {
      const userId = 'user-1';
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);

      await service.findAll({ userId });

      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        })
      );
    });

    it('should filter acknowledgments by isAcknowledged status', async () => {
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);

      await service.findAll({ isAcknowledged: true });

      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isAcknowledged: true },
        })
      );
    });

    it('should support pagination with skip and take', async () => {
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(100);

      await service.findAll({ skip: 10, take: 20 });

      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });

    it('should combine multiple filters', async () => {
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);

      await service.findAll({
        documentId: 'doc-1',
        userId: 'user-1',
        isAcknowledged: false,
      });

      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            documentId: 'doc-1',
            userId: 'user-1',
            isAcknowledged: false,
          },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a single acknowledgment by id', async () => {
      const mockAcknowledgment = {
        id: 'ack-1',
        documentId: 'doc-1',
        userId: 'user-1',
        isAcknowledged: true,
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy' },
        user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      };

      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(mockAcknowledgment);

      const result = await service.findOne('ack-1');

      expect(result).toEqual(mockAcknowledgment);
      expect(mockPrismaService.documentAcknowledgment.findUnique).toHaveBeenCalledWith({
        where: { id: 'ack-1' },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should throw NotFoundException when acknowledgment does not exist', async () => {
      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Acknowledgment with ID non-existent not found'
      );
    });
  });

  describe('getDocumentAcknowledgments', () => {
    it('should return acknowledged and pending acknowledgments separately', async () => {
      const documentId = 'doc-1';
      const mockAcknowledged = [
        {
          id: 'ack-1',
          documentId,
          userId: 'user-1',
          isAcknowledged: true,
          acknowledgedAt: new Date(),
          user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
        },
      ];

      const mockPending = [
        {
          id: 'ack-2',
          documentId,
          userId: 'user-2',
          isAcknowledged: false,
          dueDate: new Date(),
          user: { id: 'user-2', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith' },
        },
      ];

      mockPrismaService.documentAcknowledgment.findMany
        .mockResolvedValueOnce(mockAcknowledged)
        .mockResolvedValueOnce(mockPending);

      const result = await service.getDocumentAcknowledgments(documentId);

      expect(result.acknowledged).toEqual(mockAcknowledged);
      expect(result.pending).toEqual(mockPending);
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith({
        where: { documentId, isAcknowledged: true },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { acknowledgedAt: 'desc' },
      });
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith({
        where: { documentId, isAcknowledged: false },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { dueDate: 'asc' },
      });
    });
  });

  describe('createAcknowledgmentRequest', () => {
    it('should create acknowledgment requests for multiple users', async () => {
      const documentId = 'doc-1';
      const userIds = ['user-1', 'user-2', 'user-3'];
      const mockDocument = {
        version: 1,
        acknowledgmentDeadline: 14,
      };

      const mockAcknowledgment = {
        id: 'ack-1',
        documentId,
        documentVersion: 1,
        userId: 'user-1',
        dueDate: expect.any(Date),
        isAcknowledged: false,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentAcknowledgment.upsert.mockResolvedValue(mockAcknowledgment);

      const result = await service.createAcknowledgmentRequest({
        documentId,
        userIds,
      });

      expect(result).toHaveLength(3);
      expect(mockPrismaService.policyDocument.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
        select: { version: true, acknowledgmentDeadline: true },
      });
      expect(mockPrismaService.documentAcknowledgment.upsert).toHaveBeenCalledTimes(3);
    });

    it('should use custom due date when provided', async () => {
      const documentId = 'doc-1';
      const userIds = ['user-1'];
      const dueDate = new Date('2026-02-28');
      const mockDocument = {
        version: 1,
        acknowledgmentDeadline: null,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentAcknowledgment.upsert.mockResolvedValue({});

      await service.createAcknowledgmentRequest({
        documentId,
        userIds,
        dueDate,
      });

      expect(mockPrismaService.documentAcknowledgment.upsert).toHaveBeenCalledWith({
        where: {
          documentId_userId_documentVersion: {
            documentId,
            userId: 'user-1',
            documentVersion: 1,
          },
        },
        create: expect.objectContaining({
          dueDate,
        }),
        update: {
          dueDate,
        },
      });
    });

    it('should calculate due date from document acknowledgmentDeadline', async () => {
      const documentId = 'doc-1';
      const userIds = ['user-1'];
      const mockDocument = {
        version: 1,
        acknowledgmentDeadline: 7,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentAcknowledgment.upsert.mockResolvedValue({});

      await service.createAcknowledgmentRequest({
        documentId,
        userIds,
      });

      const callArgs = mockPrismaService.documentAcknowledgment.upsert.mock.calls[0][0];
      const createdDueDate = callArgs.create.dueDate;
      const now = new Date();
      const expectedDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      expect(createdDueDate.getDate()).toBe(expectedDueDate.getDate());
    });

    it('should default to 30 days when no deadline specified', async () => {
      const documentId = 'doc-1';
      const userIds = ['user-1'];
      const mockDocument = {
        version: 1,
        acknowledgmentDeadline: null,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentAcknowledgment.upsert.mockResolvedValue({});

      await service.createAcknowledgmentRequest({
        documentId,
        userIds,
      });

      const callArgs = mockPrismaService.documentAcknowledgment.upsert.mock.calls[0][0];
      const createdDueDate = callArgs.create.dueDate;
      const now = new Date();
      const expectedDueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      expect(createdDueDate.getDate()).toBe(expectedDueDate.getDate());
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);

      await expect(
        service.createAcknowledgmentRequest({
          documentId: 'non-existent',
          userIds: ['user-1'],
        })
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createAcknowledgmentRequest({
          documentId: 'non-existent',
          userIds: ['user-1'],
        })
      ).rejects.toThrow('Document with ID non-existent not found');
    });

    it('should upsert acknowledgments using unique constraint', async () => {
      const documentId = 'doc-1';
      const userId = 'user-1';
      const mockDocument = {
        version: 2,
        acknowledgmentDeadline: null,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentAcknowledgment.upsert.mockResolvedValue({});

      await service.createAcknowledgmentRequest({
        documentId,
        userIds: [userId],
      });

      expect(mockPrismaService.documentAcknowledgment.upsert).toHaveBeenCalledWith({
        where: {
          documentId_userId_documentVersion: {
            documentId,
            userId,
            documentVersion: 2,
          },
        },
        create: expect.objectContaining({
          documentVersion: 2,
          isAcknowledged: false,
        }),
        update: expect.any(Object),
      });
    });
  });

  describe('acknowledge', () => {
    it('should record acknowledgment with method and metadata', async () => {
      const acknowledgmentId = 'ack-1';
      const mockExistingAcknowledgment = {
        id: acknowledgmentId,
        documentId: 'doc-1',
        userId: 'user-1',
        isAcknowledged: false,
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy' },
        user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      };

      const mockUpdatedAcknowledgment = {
        ...mockExistingAcknowledgment,
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        method: AcknowledgmentMethod.WEB_PORTAL,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(
        mockExistingAcknowledgment
      );
      mockPrismaService.documentAcknowledgment.update.mockResolvedValue(mockUpdatedAcknowledgment);

      const result = await service.acknowledge(acknowledgmentId, {
        method: AcknowledgmentMethod.WEB_PORTAL,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockUpdatedAcknowledgment);
      expect(mockPrismaService.documentAcknowledgment.update).toHaveBeenCalledWith({
        where: { id: acknowledgmentId },
        data: {
          isAcknowledged: true,
          acknowledgedAt: expect.any(Date),
          method: AcknowledgmentMethod.WEB_PORTAL,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'ACKNOWLEDGED',
        description: 'Document acknowledged via WEB_PORTAL',
        performedById: 'user-1',
      });
    });

    it('should return existing acknowledgment if already acknowledged', async () => {
      const acknowledgmentId = 'ack-1';
      const mockAcknowledgment = {
        id: acknowledgmentId,
        documentId: 'doc-1',
        userId: 'user-1',
        isAcknowledged: true,
        acknowledgedAt: new Date('2026-01-15'),
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy' },
        user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      };

      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(mockAcknowledgment);

      const result = await service.acknowledge(acknowledgmentId, {
        method: AcknowledgmentMethod.WEB_PORTAL,
      });

      expect(result).toEqual(mockAcknowledgment);
      expect(mockPrismaService.documentAcknowledgment.update).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should handle EMAIL_LINK acknowledgment method', async () => {
      const acknowledgmentId = 'ack-1';
      const mockExistingAcknowledgment = {
        id: acknowledgmentId,
        documentId: 'doc-1',
        userId: 'user-1',
        isAcknowledged: false,
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy' },
        user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      };

      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(
        mockExistingAcknowledgment
      );
      mockPrismaService.documentAcknowledgment.update.mockResolvedValue({
        ...mockExistingAcknowledgment,
        isAcknowledged: true,
        method: AcknowledgmentMethod.EMAIL_LINK,
      });

      await service.acknowledge(acknowledgmentId, {
        method: AcknowledgmentMethod.EMAIL_LINK,
      });

      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'ACKNOWLEDGED',
        description: 'Document acknowledged via EMAIL_LINK',
        performedById: 'user-1',
      });
    });

    it('should handle DIGITAL_SIGNATURE acknowledgment method', async () => {
      const acknowledgmentId = 'ack-1';
      const mockExistingAcknowledgment = {
        id: acknowledgmentId,
        documentId: 'doc-1',
        userId: 'user-1',
        isAcknowledged: false,
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy' },
        user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      };

      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(
        mockExistingAcknowledgment
      );
      mockPrismaService.documentAcknowledgment.update.mockResolvedValue({
        ...mockExistingAcknowledgment,
        isAcknowledged: true,
        method: AcknowledgmentMethod.DIGITAL_SIGNATURE,
      });

      await service.acknowledge(acknowledgmentId, {
        method: AcknowledgmentMethod.DIGITAL_SIGNATURE,
      });

      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'ACKNOWLEDGED',
        description: 'Document acknowledged via DIGITAL_SIGNATURE',
        performedById: 'user-1',
      });
    });
  });

  describe('getUserPendingAcknowledgments', () => {
    it('should return pending acknowledgments for a user ordered by due date', async () => {
      const userId = 'user-1';
      const mockPendingAcknowledgments = [
        {
          id: 'ack-1',
          userId,
          isAcknowledged: false,
          dueDate: new Date('2026-01-30'),
          document: {
            id: 'doc-1',
            documentId: 'DOC-001',
            title: 'Security Policy',
            documentType: 'POLICY',
            summary: 'Security guidelines',
          },
        },
        {
          id: 'ack-2',
          userId,
          isAcknowledged: false,
          dueDate: new Date('2026-02-15'),
          document: {
            id: 'doc-2',
            documentId: 'DOC-002',
            title: 'Privacy Policy',
            documentType: 'POLICY',
            summary: 'Privacy guidelines',
          },
        },
      ];

      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue(
        mockPendingAcknowledgments
      );

      const result = await service.getUserPendingAcknowledgments(userId);

      expect(result).toEqual(mockPendingAcknowledgments);
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isAcknowledged: false,
        },
        include: {
          document: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              summary: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });
    });

    it('should return empty array when user has no pending acknowledgments', async () => {
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);

      const result = await service.getUserPendingAcknowledgments('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getOverdueAcknowledgments', () => {
    it('should update overdue status and return overdue acknowledgments', async () => {
      const organisationId = 'org-1';
      const mockOverdueAcknowledgments = [
        {
          id: 'ack-1',
          isAcknowledged: false,
          isOverdue: true,
          dueDate: new Date('2026-01-15'),
          document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy', organisationId },
          user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
        },
      ];

      mockPrismaService.documentAcknowledgment.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue(
        mockOverdueAcknowledgments
      );

      const result = await service.getOverdueAcknowledgments(organisationId);

      expect(result).toEqual(mockOverdueAcknowledgments);
      expect(mockPrismaService.documentAcknowledgment.updateMany).toHaveBeenCalledWith({
        where: {
          document: { organisationId },
          isAcknowledged: false,
          dueDate: { lt: expect.any(Date) },
          isOverdue: false,
        },
        data: { isOverdue: true },
      });
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith({
        where: {
          document: { organisationId },
          isAcknowledged: false,
          isOverdue: true,
        },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { dueDate: 'asc' },
      });
    });

    it('should return empty array when no overdue acknowledgments exist', async () => {
      mockPrismaService.documentAcknowledgment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);

      const result = await service.getOverdueAcknowledgments('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should calculate acknowledgment statistics correctly', async () => {
      const organisationId = 'org-1';

      mockPrismaService.documentAcknowledgment.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75) // acknowledged
        .mockResolvedValueOnce(25) // pending
        .mockResolvedValueOnce(10); // overdue

      const result = await service.getStats(organisationId);

      expect(result).toEqual({
        total: 100,
        acknowledged: 75,
        pending: 25,
        overdue: 10,
        completionRate: 75,
      });
      expect(mockPrismaService.documentAcknowledgment.count).toHaveBeenCalledTimes(4);
      expect(mockPrismaService.documentAcknowledgment.count).toHaveBeenNthCalledWith(1, {
        where: { document: { organisationId } },
      });
      expect(mockPrismaService.documentAcknowledgment.count).toHaveBeenNthCalledWith(2, {
        where: { document: { organisationId }, isAcknowledged: true },
      });
      expect(mockPrismaService.documentAcknowledgment.count).toHaveBeenNthCalledWith(3, {
        where: { document: { organisationId }, isAcknowledged: false },
      });
      expect(mockPrismaService.documentAcknowledgment.count).toHaveBeenNthCalledWith(4, {
        where: {
          document: { organisationId },
          isAcknowledged: false,
          dueDate: { lt: expect.any(Date) },
        },
      });
    });

    it('should calculate completion rate correctly for partial completion', async () => {
      mockPrismaService.documentAcknowledgment.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(33) // acknowledged
        .mockResolvedValueOnce(17) // pending
        .mockResolvedValueOnce(5); // overdue

      const result = await service.getStats('org-1');

      expect(result.completionRate).toBe(66); // 33/50 * 100 = 66
    });

    it('should return 0 completion rate when total is 0', async () => {
      mockPrismaService.documentAcknowledgment.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // acknowledged
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(0); // overdue

      const result = await service.getStats('org-1');

      expect(result.completionRate).toBe(0);
    });

    it('should round completion rate to nearest integer', async () => {
      mockPrismaService.documentAcknowledgment.count
        .mockResolvedValueOnce(3) // total
        .mockResolvedValueOnce(2) // acknowledged
        .mockResolvedValueOnce(1) // pending
        .mockResolvedValueOnce(0); // overdue

      const result = await service.getStats('org-1');

      expect(result.completionRate).toBe(67); // 2/3 * 100 = 66.666... rounds to 67
    });
  });

  describe('sendReminder', () => {
    it('should send reminder and increment reminder count', async () => {
      const acknowledgmentId = 'ack-1';
      const mockAcknowledgment = {
        id: acknowledgmentId,
        documentId: 'doc-1',
        userId: 'user-1',
        isAcknowledged: false,
        remindersSent: 2,
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy' },
        user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      };

      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(mockAcknowledgment);
      mockPrismaService.documentAcknowledgment.update.mockResolvedValue({
        ...mockAcknowledgment,
        remindersSent: 3,
      });

      const result = await service.sendReminder(acknowledgmentId);

      expect(result).toEqual({
        sent: true,
        reminderCount: 3,
      });
      expect(mockPrismaService.documentAcknowledgment.update).toHaveBeenCalledWith({
        where: { id: acknowledgmentId },
        data: {
          remindersSent: { increment: 1 },
          lastReminderAt: expect.any(Date),
        },
      });
    });

    it('should not send reminder if already acknowledged', async () => {
      const acknowledgmentId = 'ack-1';
      const mockAcknowledgment = {
        id: acknowledgmentId,
        documentId: 'doc-1',
        userId: 'user-1',
        isAcknowledged: true,
        remindersSent: 1,
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Policy' },
        user: { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
      };

      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(mockAcknowledgment);

      const result = await service.sendReminder(acknowledgmentId);

      expect(result).toEqual({
        sent: false,
        reason: 'Already acknowledged',
      });
      expect(mockPrismaService.documentAcknowledgment.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when acknowledgment does not exist', async () => {
      mockPrismaService.documentAcknowledgment.findUnique.mockResolvedValue(null);

      await expect(service.sendReminder('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkSendReminders', () => {
    it('should send reminders to all pending acknowledgments', async () => {
      const organisationId = 'org-1';
      const mockPending = [{ id: 'ack-1' }, { id: 'ack-2' }, { id: 'ack-3' }];

      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue(mockPending);
      mockPrismaService.documentAcknowledgment.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkSendReminders(organisationId);

      expect(result).toEqual({ sent: 3 });
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith({
        where: {
          document: { organisationId },
          isAcknowledged: false,
        },
        select: { id: true },
      });
      expect(mockPrismaService.documentAcknowledgment.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['ack-1', 'ack-2', 'ack-3'] } },
        data: {
          remindersSent: { increment: 1 },
          lastReminderAt: expect.any(Date),
        },
      });
    });

    it('should send reminders only to overdue acknowledgments when overdueOnly is true', async () => {
      const organisationId = 'org-1';
      const mockOverdue = [{ id: 'ack-1' }, { id: 'ack-2' }];

      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue(mockOverdue);
      mockPrismaService.documentAcknowledgment.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkSendReminders(organisationId, true);

      expect(result).toEqual({ sent: 2 });
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalledWith({
        where: {
          document: { organisationId },
          isAcknowledged: false,
          isOverdue: true,
        },
        select: { id: true },
      });
    });

    it('should return 0 when no pending acknowledgments exist', async () => {
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.bulkSendReminders('org-1');

      expect(result).toEqual({ sent: 0 });
    });

    it('should handle large batches of reminders', async () => {
      const organisationId = 'org-1';
      const mockPending = Array.from({ length: 100 }, (_, i) => ({ id: `ack-${i}` }));

      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue(mockPending);
      mockPrismaService.documentAcknowledgment.updateMany.mockResolvedValue({ count: 100 });

      const result = await service.bulkSendReminders(organisationId);

      expect(result).toEqual({ sent: 100 });
      expect(mockPrismaService.documentAcknowledgment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: {
              in: expect.arrayContaining([
                'ack-0',
                'ack-50',
                'ack-99',
              ]),
            },
          },
        })
      );
    });
  });
});
