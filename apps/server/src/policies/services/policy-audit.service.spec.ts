import { Test, TestingModule } from '@nestjs/testing';
import { PolicyAuditService } from './policy-audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditAction } from '@prisma/client';

describe('PolicyAuditService', () => {
  let service: PolicyAuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    policyDocumentAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyAuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PolicyAuditService>(PolicyAuditService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create audit log entry with all required fields', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'CREATED' as PolicyAuditAction,
        description: 'Document created',
        performedById: 'user-1',
        previousValue: null,
        newValue: { title: 'New Policy' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-123',
      };

      const mockCreatedLog = {
        id: 'log-1',
        documentId: logData.documentId,
        action: logData.action,
        description: logData.description,
        performedById: logData.performedById,
        previousValue: logData.previousValue,
        newValue: logData.newValue,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        sessionId: logData.sessionId,
        performedAt: new Date(),
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue(mockCreatedLog);

      const result = await service.log(logData);

      expect(result).toEqual(mockCreatedLog);
      expect(mockPrismaService.policyDocumentAuditLog.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: logData.documentId } },
          action: logData.action,
          description: logData.description,
          performedBy: { connect: { id: logData.performedById } },
          previousValue: undefined,
          newValue: logData.newValue,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
          sessionId: logData.sessionId,
        },
      });
    });

    it('should create audit log entry with only required fields', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'UPDATED' as PolicyAuditAction,
        description: 'Document updated',
        performedById: 'user-1',
      };

      const mockCreatedLog = {
        id: 'log-1',
        ...logData,
        previousValue: null,
        newValue: null,
        ipAddress: null,
        userAgent: null,
        sessionId: null,
        performedAt: new Date(),
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue(mockCreatedLog);

      const result = await service.log(logData);

      expect(result).toEqual(mockCreatedLog);
      expect(mockPrismaService.policyDocumentAuditLog.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: logData.documentId } },
          action: logData.action,
          description: logData.description,
          performedBy: { connect: { id: logData.performedById } },
          previousValue: undefined,
          newValue: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          sessionId: undefined,
        },
      });
    });

    it('should log CREATED action', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'CREATED' as PolicyAuditAction,
        description: 'Policy document created',
        performedById: 'user-1',
        newValue: { title: 'Information Security Policy', status: 'DRAFT' },
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({
        id: 'log-1',
        ...logData,
        performedAt: new Date(),
      });

      const result = await service.log(logData);

      expect(result.action).toBe('CREATED');
      expect(result.newValue).toEqual(logData.newValue);
    });

    it('should log UPDATED action with previous and new values', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'UPDATED' as PolicyAuditAction,
        description: 'Policy title updated',
        performedById: 'user-1',
        previousValue: { title: 'Old Title' },
        newValue: { title: 'New Title' },
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({
        id: 'log-1',
        ...logData,
        performedAt: new Date(),
      });

      const result = await service.log(logData);

      expect(result.action).toBe('UPDATED');
      expect(result.previousValue).toEqual({ title: 'Old Title' });
      expect(result.newValue).toEqual({ title: 'New Title' });
    });

    it('should log DELETED action', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'DELETED' as PolicyAuditAction,
        description: 'Policy document deleted',
        performedById: 'user-1',
        previousValue: { title: 'Deleted Policy', status: 'DRAFT' },
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({
        id: 'log-1',
        ...logData,
        performedAt: new Date(),
      });

      const result = await service.log(logData);

      expect(result.action).toBe('DELETED');
      expect(result.previousValue).toEqual(logData.previousValue);
    });

    it('should log APPROVED action', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'APPROVED' as PolicyAuditAction,
        description: 'Policy document approved',
        performedById: 'user-1',
        previousValue: { status: 'PENDING_APPROVAL' },
        newValue: { status: 'APPROVED', approvedAt: new Date() },
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({
        id: 'log-1',
        ...logData,
        performedAt: new Date(),
      });

      const result = await service.log(logData);

      expect(result.action).toBe('APPROVED');
    });

    it('should log PUBLISHED action', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'PUBLISHED' as PolicyAuditAction,
        description: 'Policy document published',
        performedById: 'user-1',
        previousValue: { status: 'APPROVED' },
        newValue: { status: 'PUBLISHED', publishedAt: new Date() },
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({
        id: 'log-1',
        ...logData,
        performedAt: new Date(),
      });

      const result = await service.log(logData);

      expect(result.action).toBe('PUBLISHED');
    });

    it('should capture IP address and user agent', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'VIEWED' as PolicyAuditAction,
        description: 'Policy document viewed',
        performedById: 'user-1',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({
        id: 'log-1',
        ...logData,
        performedAt: new Date(),
      });

      const result = await service.log(logData);

      expect(result.ipAddress).toBe('10.0.0.1');
      expect(result.userAgent).toContain('Windows NT 10.0');
    });

    it('should capture session ID for tracking user sessions', async () => {
      const logData = {
        documentId: 'doc-1',
        action: 'VIEWED' as PolicyAuditAction,
        description: 'Policy document viewed',
        performedById: 'user-1',
        sessionId: 'sess_abc123xyz',
      };

      mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({
        id: 'log-1',
        ...logData,
        performedAt: new Date(),
      });

      const result = await service.log(logData);

      expect(result.sessionId).toBe('sess_abc123xyz');
    });
  });

  describe('getDocumentAuditLog', () => {
    it('should return audit logs for a document with user details', async () => {
      const documentId = 'doc-1';
      const mockLogs = [
        {
          id: 'log-1',
          documentId,
          action: 'UPDATED',
          description: 'Updated title',
          performedById: 'user-1',
          performedAt: new Date('2024-01-15T10:00:00Z'),
          performedBy: {
            id: 'user-1',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 'log-2',
          documentId,
          action: 'CREATED',
          description: 'Created document',
          performedById: 'user-2',
          performedAt: new Date('2024-01-10T10:00:00Z'),
          performedBy: {
            id: 'user-2',
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(2);

      const result = await service.getDocumentAuditLog(documentId);

      expect(result.results).toEqual(mockLogs);
      expect(result.count).toBe(2);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith({
        where: { documentId },
        skip: undefined,
        take: undefined,
        orderBy: { performedAt: 'desc' },
        include: {
          performedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });
    });

    it('should return empty results when no audit logs exist', async () => {
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(0);

      const result = await service.getDocumentAuditLog('doc-1');

      expect(result.results).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should support pagination with skip and take', async () => {
      const documentId = 'doc-1';
      const mockLogs = [
        {
          id: 'log-3',
          documentId,
          action: 'UPDATED',
          description: 'Page 2 log',
          performedAt: new Date(),
          performedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(25);

      const result = await service.getDocumentAuditLog(documentId, {
        skip: 10,
        take: 10,
      });

      expect(result.results).toHaveLength(1);
      expect(result.count).toBe(25);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should filter by action type', async () => {
      const documentId = 'doc-1';
      const mockLogs = [
        {
          id: 'log-1',
          documentId,
          action: 'APPROVED',
          description: 'Document approved',
          performedAt: new Date(),
          performedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(1);

      const result = await service.getDocumentAuditLog(documentId, {
        action: 'APPROVED' as PolicyAuditAction,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].action).toBe('APPROVED');
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'APPROVED',
          }),
        })
      );
    });

    it('should filter by start date', async () => {
      const documentId = 'doc-1';
      const startDate = new Date('2024-01-01');
      const mockLogs = [
        {
          id: 'log-1',
          documentId,
          action: 'UPDATED',
          description: 'Recent update',
          performedAt: new Date('2024-01-15'),
          performedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(1);

      const result = await service.getDocumentAuditLog(documentId, {
        startDate,
      });

      expect(result.results).toHaveLength(1);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            performedAt: expect.objectContaining({
              gte: startDate,
            }),
          }),
        })
      );
    });

    it('should filter by end date', async () => {
      const documentId = 'doc-1';
      const endDate = new Date('2024-12-31');
      const mockLogs = [
        {
          id: 'log-1',
          documentId,
          action: 'UPDATED',
          description: 'Old update',
          performedAt: new Date('2024-06-15'),
          performedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(1);

      const result = await service.getDocumentAuditLog(documentId, {
        endDate,
      });

      expect(result.results).toHaveLength(1);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            performedAt: expect.objectContaining({
              lte: endDate,
            }),
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const documentId = 'doc-1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockLogs = [
        {
          id: 'log-1',
          documentId,
          action: 'UPDATED',
          description: 'Update in range',
          performedAt: new Date('2024-06-15'),
          performedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(1);

      const result = await service.getDocumentAuditLog(documentId, {
        startDate,
        endDate,
      });

      expect(result.results).toHaveLength(1);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            performedAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should combine multiple filters', async () => {
      const documentId = 'doc-1';
      const mockLogs = [];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(0);

      await service.getDocumentAuditLog(documentId, {
        action: 'APPROVED' as PolicyAuditAction,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        skip: 0,
        take: 20,
      });

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            documentId: 'doc-1',
            action: 'APPROVED',
            performedAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
          skip: 0,
          take: 20,
        })
      );
    });

    it('should order results by performedAt descending', async () => {
      const documentId = 'doc-1';
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(0);

      await service.getDocumentAuditLog(documentId);

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { performedAt: 'desc' },
        })
      );
    });
  });

  describe('getOrganisationAuditLog', () => {
    it('should return audit logs for all documents in organisation', async () => {
      const organisationId = 'org-1';
      const mockLogs = [
        {
          id: 'log-1',
          documentId: 'doc-1',
          action: 'UPDATED',
          description: 'Updated policy',
          performedById: 'user-1',
          performedAt: new Date(),
          document: {
            id: 'doc-1',
            documentId: 'POL-001',
            title: 'Security Policy',
          },
          performedBy: {
            id: 'user-1',
            email: 'test@test.com',
            firstName: 'Test',
            lastName: 'User',
          },
        },
        {
          id: 'log-2',
          documentId: 'doc-2',
          action: 'CREATED',
          description: 'Created policy',
          performedById: 'user-2',
          performedAt: new Date(),
          document: {
            id: 'doc-2',
            documentId: 'POL-002',
            title: 'Privacy Policy',
          },
          performedBy: {
            id: 'user-2',
            email: 'user2@test.com',
            firstName: 'User',
            lastName: 'Two',
          },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(2);

      const result = await service.getOrganisationAuditLog(organisationId);

      expect(result.results).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          document: { organisationId },
        },
        skip: undefined,
        take: undefined,
        orderBy: { performedAt: 'desc' },
        include: {
          document: {
            select: { id: true, documentId: true, title: true },
          },
          performedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });
    });

    it('should filter by action type', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(0);

      await service.getOrganisationAuditLog(organisationId, {
        action: 'APPROVED' as PolicyAuditAction,
      });

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'APPROVED',
          }),
        })
      );
    });

    it('should filter by user ID', async () => {
      const organisationId = 'org-1';
      const userId = 'user-1';
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(0);

      await service.getOrganisationAuditLog(organisationId, {
        userId,
      });

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            performedById: userId,
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const organisationId = 'org-1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(0);

      await service.getOrganisationAuditLog(organisationId, {
        startDate,
        endDate,
      });

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            performedAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should support pagination', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(100);

      const result = await service.getOrganisationAuditLog(organisationId, {
        skip: 20,
        take: 10,
      });

      expect(result.count).toBe(100);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });

    it('should combine multiple filters including userId', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocumentAuditLog.count.mockResolvedValue(0);

      await service.getOrganisationAuditLog(organisationId, {
        action: 'UPDATED' as PolicyAuditAction,
        userId: 'user-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            document: { organisationId },
            action: 'UPDATED',
            performedById: 'user-1',
            performedAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        })
      );
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent audit logs with default limit of 10', async () => {
      const organisationId = 'org-1';
      const mockLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i + 1}`,
        documentId: `doc-${i + 1}`,
        action: 'UPDATED',
        description: `Update ${i + 1}`,
        performedAt: new Date(Date.now() - i * 3600000),
        document: {
          id: `doc-${i + 1}`,
          documentId: `POL-00${i + 1}`,
          title: `Policy ${i + 1}`,
          documentType: 'POLICY',
        },
        performedBy: {
          id: `user-${i + 1}`,
          email: `user${i + 1}@test.com`,
          firstName: 'User',
          lastName: `${i + 1}`,
        },
      }));

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRecentActivity(organisationId);

      expect(result).toHaveLength(10);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          document: { organisationId },
        },
        take: 10,
        orderBy: { performedAt: 'desc' },
        include: {
          document: {
            select: { id: true, documentId: true, title: true, documentType: true },
          },
          performedBy: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });
    });

    it('should support custom limit', async () => {
      const organisationId = 'org-1';
      const customLimit = 25;
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);

      await service.getRecentActivity(organisationId, customLimit);

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: customLimit,
        })
      );
    });

    it('should include document type in results', async () => {
      const organisationId = 'org-1';
      const mockLogs = [
        {
          id: 'log-1',
          documentId: 'doc-1',
          action: 'CREATED',
          description: 'Created policy',
          performedAt: new Date(),
          document: {
            id: 'doc-1',
            documentId: 'POL-001',
            title: 'Security Policy',
            documentType: 'POLICY',
          },
          performedBy: {
            id: 'user-1',
            email: 'test@test.com',
            firstName: 'Test',
            lastName: 'User',
          },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRecentActivity(organisationId);

      expect(result[0].document.documentType).toBe('POLICY');
    });

    it('should return empty array when no recent activity', async () => {
      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);

      const result = await service.getRecentActivity('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('getActivityStats', () => {
    it('should return activity statistics grouped by action, user, and document', async () => {
      const organisationId = 'org-1';
      const byAction = [
        { action: 'CREATED', _count: 5 },
        { action: 'UPDATED', _count: 15 },
        { action: 'APPROVED', _count: 3 },
      ];
      const byUser = [
        { performedById: 'user-1', _count: 10 },
        { performedById: 'user-2', _count: 8 },
      ];
      const byDocument = [
        { documentId: 'doc-1', _count: 12 },
        { documentId: 'doc-2', _count: 6 },
      ];
      const timeline = [
        { date: new Date('2024-01-15'), count: 5 },
        { date: new Date('2024-01-16'), count: 8 },
      ];

      mockPrismaService.policyDocumentAuditLog.groupBy
        .mockResolvedValueOnce(byAction)
        .mockResolvedValueOnce(byUser)
        .mockResolvedValueOnce(byDocument);
      mockPrismaService.$queryRaw.mockResolvedValue(timeline);

      const result = await service.getActivityStats(organisationId);

      expect(result.byAction).toEqual({
        CREATED: 5,
        UPDATED: 15,
        APPROVED: 3,
      });
      expect(result.topUsers).toEqual(byUser);
      expect(result.topDocuments).toEqual(byDocument);
      expect(result.timeline).toEqual(timeline);
    });

    it('should use default 30 days period', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getActivityStats(organisationId);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      expect(mockPrismaService.policyDocumentAuditLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            performedAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should support custom days period', async () => {
      const organisationId = 'org-1';
      const days = 90;
      mockPrismaService.policyDocumentAuditLog.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getActivityStats(organisationId, days);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
        expect.anything(),
        organisationId,
        expect.any(Date)
      );
    });

    it('should limit top users to 10', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getActivityStats(organisationId);

      expect(mockPrismaService.policyDocumentAuditLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['performedById'],
          take: 10,
        })
      );
    });

    it('should limit top documents to 10', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getActivityStats(organisationId);

      expect(mockPrismaService.policyDocumentAuditLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['documentId'],
          take: 10,
        })
      );
    });

    it('should return empty statistics when no activity in period', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getActivityStats(organisationId);

      expect(result.byAction).toEqual({});
      expect(result.topUsers).toEqual([]);
      expect(result.topDocuments).toEqual([]);
      expect(result.timeline).toEqual([]);
    });

    it('should order top users by count descending', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getActivityStats(organisationId);

      expect(mockPrismaService.policyDocumentAuditLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['performedById'],
          orderBy: { _count: { performedById: 'desc' } },
        })
      );
    });

    it('should order top documents by count descending', async () => {
      const organisationId = 'org-1';
      mockPrismaService.policyDocumentAuditLog.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      await service.getActivityStats(organisationId);

      expect(mockPrismaService.policyDocumentAuditLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['documentId'],
          orderBy: { _count: { documentId: 'desc' } },
        })
      );
    });
  });

  describe('exportAuditLog', () => {
    it('should export audit logs for date range with full details', async () => {
      const params = {
        organisationId: 'org-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const mockLogs = [
        {
          id: 'log-1',
          documentId: 'doc-1',
          action: 'CREATED',
          description: 'Created policy',
          performedAt: new Date('2024-01-15'),
          document: {
            documentId: 'POL-001',
            title: 'Security Policy',
          },
          performedBy: {
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 'log-2',
          documentId: 'doc-2',
          action: 'APPROVED',
          description: 'Approved policy',
          performedAt: new Date('2024-02-20'),
          document: {
            documentId: 'POL-002',
            title: 'Privacy Policy',
          },
          performedBy: {
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      ];

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportAuditLog(params);

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith({
        where: {
          document: { organisationId: 'org-1' },
          performedAt: {
            gte: params.startDate,
            lte: params.endDate,
          },
        },
        orderBy: { performedAt: 'asc' },
        include: {
          document: {
            select: { documentId: true, title: true },
          },
          performedBy: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      });
    });

    it('should filter by specific document when documentId provided', async () => {
      const params = {
        organisationId: 'org-1',
        documentId: 'doc-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);

      await service.exportAuditLog(params);

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            documentId: 'doc-1',
          }),
        })
      );
    });

    it('should order export by performedAt ascending for chronological review', async () => {
      const params = {
        organisationId: 'org-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);

      await service.exportAuditLog(params);

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { performedAt: 'asc' },
        })
      );
    });

    it('should include document and user details for export', async () => {
      const params = {
        organisationId: 'org-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);

      await service.exportAuditLog(params);

      expect(mockPrismaService.policyDocumentAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            document: {
              select: { documentId: true, title: true },
            },
            performedBy: {
              select: { email: true, firstName: true, lastName: true },
            },
          },
        })
      );
    });

    it('should return empty array when no logs in date range', async () => {
      const params = {
        organisationId: 'org-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      mockPrismaService.policyDocumentAuditLog.findMany.mockResolvedValue([]);

      const result = await service.exportAuditLog(params);

      expect(result).toEqual([]);
    });
  });

  describe('audit action types', () => {
    it('should support all PolicyAuditAction types', async () => {
      const actions: PolicyAuditAction[] = [
        'CREATED',
        'UPDATED',
        'DELETED',
        'APPROVED',
        'REJECTED',
        'PUBLISHED',
        'ARCHIVED',
        'RESTORED',
        'REVIEWED',
        'VIEWED',
      ];

      for (const action of actions) {
        mockPrismaService.policyDocumentAuditLog.create.mockResolvedValue({
          id: 'log-1',
          action,
          documentId: 'doc-1',
          description: `Test ${action}`,
          performedById: 'user-1',
          performedAt: new Date(),
        });

        const result = await service.log({
          documentId: 'doc-1',
          action,
          description: `Test ${action}`,
          performedById: 'user-1',
        });

        expect(result.action).toBe(action);
      }
    });
  });
});
