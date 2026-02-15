import { Test, TestingModule } from '@nestjs/testing';
import { DocumentReviewService } from './document-review.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditService } from './policy-audit.service';
import { NotFoundException } from '@nestjs/common';
import { ReviewType, ReviewOutcome, ReviewFrequency } from '@prisma/client';

describe('DocumentReviewService', () => {
  let service: DocumentReviewService;
  let prismaService: PrismaService;
  let auditService: PolicyAuditService;

  const mockPrismaService = {
    documentReview: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    policyDocument: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentReviewService,
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

    service = module.get<DocumentReviewService>(DocumentReviewService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<PolicyAuditService>(PolicyAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all reviews for a document ordered by review date descending', async () => {
      const documentId = 'doc-1';
      const mockReviews = [
        {
          id: 'review-1',
          documentId,
          reviewType: 'SCHEDULED',
          reviewDate: new Date('2024-02-15'),
          outcome: 'APPROVED',
          reviewedBy: {
            id: 'user-1',
            email: 'reviewer@test.com',
            firstName: 'John',
            lastName: 'Reviewer',
          },
        },
        {
          id: 'review-2',
          documentId,
          reviewType: 'AD_HOC',
          reviewDate: new Date('2024-01-10'),
          outcome: 'MINOR_CHANGES',
          reviewedBy: {
            id: 'user-2',
            email: 'reviewer2@test.com',
            firstName: 'Jane',
            lastName: 'Reviewer',
          },
        },
      ];

      mockPrismaService.documentReview.findMany.mockResolvedValue(mockReviews);

      const result = await service.findAll(documentId);

      expect(result).toEqual(mockReviews);
      expect(mockPrismaService.documentReview.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: { reviewDate: 'desc' },
        include: {
          reviewedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should return empty array when no reviews exist', async () => {
      mockPrismaService.documentReview.findMany.mockResolvedValue([]);

      const result = await service.findAll('doc-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single review with document and reviewer details', async () => {
      const reviewId = 'review-1';
      const mockReview = {
        id: reviewId,
        documentId: 'doc-1',
        reviewType: 'SCHEDULED',
        reviewDate: new Date('2024-02-15'),
        outcome: 'APPROVED',
        findings: 'Policy is up to date and compliant',
        recommendations: 'Continue monitoring',
        document: {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Security Policy',
        },
        reviewedBy: {
          id: 'user-1',
          email: 'reviewer@test.com',
          firstName: 'John',
          lastName: 'Reviewer',
        },
      };

      mockPrismaService.documentReview.findUnique.mockResolvedValue(mockReview);

      const result = await service.findOne(reviewId);

      expect(result).toEqual(mockReview);
      expect(mockPrismaService.documentReview.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
        include: {
          document: {
            select: {
              id: true,
              documentId: true,
              title: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when review does not exist', async () => {
      mockPrismaService.documentReview.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Review with ID non-existent not found'
      );
    });
  });

  describe('createReview', () => {
    it('should create a review with APPROVED outcome', async () => {
      const createData = {
        documentId: 'doc-1',
        reviewType: 'SCHEDULED' as ReviewType,
        outcome: 'APPROVED' as ReviewOutcome,
        findings: 'Policy is compliant',
        recommendations: 'Continue monitoring',
        actionItems: 'None',
        changesRequired: false,
        reviewedById: 'user-1',
      };

      const mockDocument = {
        id: 'doc-1',
        reviewFrequency: 'ANNUAL' as ReviewFrequency,
      };

      const nextReviewDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const mockReview = {
        id: 'review-new',
        ...createData,
        reviewDate: new Date(),
        nextReviewDate,
        reviewedBy: {
          id: 'user-1',
          email: 'reviewer@test.com',
          firstName: 'John',
          lastName: 'Reviewer',
        },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentReview.create.mockResolvedValue(mockReview);
      mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.createReview(createData);

      expect(result).toEqual(mockReview);
      expect(mockPrismaService.policyDocument.findUnique).toHaveBeenCalledWith({
        where: { id: createData.documentId },
        select: { reviewFrequency: true },
      });
      expect(mockPrismaService.documentReview.create).toHaveBeenCalled();
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: createData.documentId,
        action: 'REVIEWED',
        description: `Document reviewed: ${createData.outcome}`,
        performedById: createData.reviewedById,
        newValue: expect.objectContaining({
          reviewType: createData.reviewType,
          outcome: createData.outcome,
        }),
      });
    });

    it('should create a review with MINOR_CHANGES outcome', async () => {
      const createData = {
        documentId: 'doc-1',
        reviewType: 'SCHEDULED' as ReviewType,
        outcome: 'MINOR_CHANGES' as ReviewOutcome,
        findings: 'Few updates needed',
        recommendations: 'Update section 3',
        actionItems: 'Revise compliance requirements',
        changesRequired: true,
        changeDescription: 'Update regulatory references',
        reviewedById: 'user-1',
      };

      const mockDocument = {
        id: 'doc-1',
        reviewFrequency: 'QUARTERLY' as ReviewFrequency,
      };

      const mockReview = {
        id: 'review-new',
        ...createData,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentReview.create.mockResolvedValue(mockReview);
      mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.createReview(createData);

      expect(result).toBeDefined();
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: createData.documentId },
          data: expect.objectContaining({
            lastReviewDate: expect.any(Date),
            nextReviewDate: expect.any(Date),
          }),
        })
      );
    });

    it('should set document status to UNDER_REVISION for MAJOR_CHANGES outcome', async () => {
      const createData = {
        documentId: 'doc-1',
        reviewType: 'SCHEDULED' as ReviewType,
        outcome: 'MAJOR_CHANGES' as ReviewOutcome,
        findings: 'Significant updates required',
        recommendations: 'Complete rewrite of sections 2-4',
        actionItems: 'Schedule revision meeting',
        changesRequired: true,
        changeDescription: 'Major regulatory changes',
        reviewedById: 'user-1',
      };

      const mockDocument = {
        id: 'doc-1',
        reviewFrequency: 'ANNUAL' as ReviewFrequency,
      };

      const mockReview = { id: 'review-new', ...createData };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentReview.create.mockResolvedValue(mockReview);
      mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.createReview(createData);

      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'UNDER_REVISION',
          }),
        })
      );
    });

    it('should set document status to RETIRED for RETIRE outcome', async () => {
      const createData = {
        documentId: 'doc-1',
        reviewType: 'SCHEDULED' as ReviewType,
        outcome: 'RETIRE' as ReviewOutcome,
        findings: 'Policy is obsolete',
        recommendations: 'Retire and replace with new policy',
        reviewedById: 'user-1',
      };

      const mockDocument = {
        id: 'doc-1',
        reviewFrequency: 'ANNUAL' as ReviewFrequency,
      };

      const mockReview = { id: 'review-new', ...createData };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentReview.create.mockResolvedValue(mockReview);
      mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.createReview(createData);

      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'RETIRED',
            retirementDate: expect.any(Date),
          }),
        })
      );
    });

    it('should throw NotFoundException when document does not exist', async () => {
      const createData = {
        documentId: 'non-existent',
        reviewType: 'SCHEDULED' as ReviewType,
        outcome: 'APPROVED' as ReviewOutcome,
        reviewedById: 'user-1',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);

      await expect(service.createReview(createData)).rejects.toThrow(NotFoundException);
      await expect(service.createReview(createData)).rejects.toThrow(
        'Document with ID non-existent not found'
      );
    });

    it('should calculate next review date based on review frequency', async () => {
      const frequencies = [
        { frequency: 'MONTHLY' as ReviewFrequency, days: 30 },
        { frequency: 'QUARTERLY' as ReviewFrequency, days: 90 },
        { frequency: 'SEMI_ANNUAL' as ReviewFrequency, days: 180 },
        { frequency: 'ANNUAL' as ReviewFrequency, days: 365 },
        { frequency: 'BIENNIAL' as ReviewFrequency, days: 730 },
        { frequency: 'TRIENNIAL' as ReviewFrequency, days: 1095 },
      ];

      for (const { frequency, days } of frequencies) {
        const createData = {
          documentId: 'doc-1',
          reviewType: 'SCHEDULED' as ReviewType,
          outcome: 'APPROVED' as ReviewOutcome,
          reviewedById: 'user-1',
        };

        const mockDocument = { id: 'doc-1', reviewFrequency: frequency };
        const mockReview = { id: 'review-new' };

        mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
        mockPrismaService.documentReview.create.mockResolvedValue(mockReview);
        mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
        mockAuditService.log.mockResolvedValue(undefined);

        await service.createReview(createData);

        const createCall = mockPrismaService.documentReview.create.mock.calls[0][0];
        const nextReviewDate = createCall.data.nextReviewDate;
        const expectedDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        const timeDiff = Math.abs(nextReviewDate.getTime() - expectedDate.getTime());

        expect(timeDiff).toBeLessThan(1000); // Within 1 second
        jest.clearAllMocks();
      }
    });
  });

  describe('getUpcomingReviews', () => {
    it('should return documents with reviews due within 30 days', async () => {
      const organisationId = 'org-1';
      const mockDocuments = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Security Policy',
          documentType: 'POLICY',
          nextReviewDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          reviewFrequency: 'ANNUAL',
          lastReviewDate: new Date('2024-01-01'),
          owner: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Owner',
            email: 'owner@test.com',
          },
        },
        {
          id: 'doc-2',
          documentId: 'POL-002',
          title: 'Data Privacy Policy',
          documentType: 'POLICY',
          nextReviewDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          reviewFrequency: 'ANNUAL',
          lastReviewDate: new Date('2024-02-01'),
          owner: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Owner',
            email: 'owner2@test.com',
          },
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getUpcomingReviews(organisationId);

      expect(result).toEqual(mockDocuments);
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: {
            lte: expect.any(Date),
            gte: expect.any(Date),
          },
        },
        select: {
          id: true,
          documentId: true,
          title: true,
          documentType: true,
          nextReviewDate: true,
          reviewFrequency: true,
          lastReviewDate: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { nextReviewDate: 'asc' },
      });
    });

    it('should accept custom days parameter for upcoming reviews', async () => {
      const organisationId = 'org-1';
      const customDays = 60;

      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      await service.getUpcomingReviews(organisationId, customDays);

      const callArgs = mockPrismaService.policyDocument.findMany.mock.calls[0][0];
      const futureDate = callArgs.where.nextReviewDate.lte;
      const expectedDate = new Date(Date.now() + customDays * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(futureDate.getTime() - expectedDate.getTime());

      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should only return PUBLISHED documents', async () => {
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      await service.getUpcomingReviews('org-1');

      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        })
      );
    });

    it('should return empty array when no upcoming reviews', async () => {
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      const result = await service.getUpcomingReviews('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('getOverdueReviews', () => {
    it('should return documents with overdue reviews', async () => {
      const organisationId = 'org-1';
      const mockDocuments = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Security Policy',
          documentType: 'POLICY',
          nextReviewDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          lastReviewDate: new Date('2023-01-01'),
          owner: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Owner',
            email: 'owner@test.com',
          },
        },
        {
          id: 'doc-2',
          documentId: 'POL-002',
          title: 'Data Privacy Policy',
          documentType: 'POLICY',
          nextReviewDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          lastReviewDate: new Date('2023-02-01'),
          owner: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Owner',
            email: 'owner2@test.com',
          },
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getOverdueReviews(organisationId);

      expect(result).toEqual(mockDocuments);
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { lt: expect.any(Date) },
        },
        select: {
          id: true,
          documentId: true,
          title: true,
          documentType: true,
          nextReviewDate: true,
          lastReviewDate: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { nextReviewDate: 'asc' },
      });
    });

    it('should only return PUBLISHED documents', async () => {
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      await service.getOverdueReviews('org-1');

      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        })
      );
    });

    it('should return empty array when no overdue reviews', async () => {
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      const result = await service.getOverdueReviews('org-1');

      expect(result).toEqual([]);
    });

    it('should order overdue reviews by date ascending (oldest first)', async () => {
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      await service.getOverdueReviews('org-1');

      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nextReviewDate: 'asc' },
        })
      );
    });
  });

  describe('getReviewStats', () => {
    it('should return comprehensive review statistics', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.count
        .mockResolvedValueOnce(5) // overdue
        .mockResolvedValueOnce(8) // dueSoon (30 days)
        .mockResolvedValueOnce(12) // upcoming (30-90 days)
        .mockResolvedValueOnce(50); // total

      const result = await service.getReviewStats(organisationId);

      expect(result).toEqual({
        overdue: 5,
        dueSoon: 8,
        upcoming: 12,
        onSchedule: 25, // total - overdue - dueSoon = 50 - 5 - 8
        total: 50,
      });
    });

    it('should call count with correct date ranges', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getReviewStats(organisationId);

      // Overdue: nextReviewDate < now
      expect(mockPrismaService.policyDocument.count).toHaveBeenNthCalledWith(1, {
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { lt: expect.any(Date) },
        },
      });

      // Due soon: now <= nextReviewDate <= 30 days
      expect(mockPrismaService.policyDocument.count).toHaveBeenNthCalledWith(2, {
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { gte: expect.any(Date), lte: expect.any(Date) },
        },
      });

      // Upcoming: 30 days < nextReviewDate <= 90 days
      expect(mockPrismaService.policyDocument.count).toHaveBeenNthCalledWith(3, {
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { gt: expect.any(Date), lte: expect.any(Date) },
        },
      });

      // Total with nextReviewDate
      expect(mockPrismaService.policyDocument.count).toHaveBeenNthCalledWith(4, {
        where: {
          organisationId,
          status: 'PUBLISHED',
          nextReviewDate: { not: null },
        },
      });
    });

    it('should handle zero statistics correctly', async () => {
      mockPrismaService.policyDocument.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getReviewStats('org-1');

      expect(result).toEqual({
        overdue: 0,
        dueSoon: 0,
        upcoming: 0,
        onSchedule: 0,
        total: 0,
      });
    });

    it('should only count PUBLISHED documents', async () => {
      mockPrismaService.policyDocument.count.mockResolvedValue(0);

      await service.getReviewStats('org-1');

      const calls = mockPrismaService.policyDocument.count.mock.calls;
      calls.forEach((call) => {
        expect(call[0].where.status).toBe('PUBLISHED');
      });
    });
  });

  describe('rescheduleReview', () => {
    it('should reschedule review with new date', async () => {
      const documentId = 'doc-1';
      const nextReviewDate = new Date('2025-06-01');

      const mockDocument = {
        id: documentId,
        nextReviewDate,
      };

      mockPrismaService.policyDocument.update.mockResolvedValue(mockDocument);

      const result = await service.rescheduleReview(documentId, nextReviewDate);

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { nextReviewDate },
      });
    });

    it('should log audit event when userId is provided', async () => {
      const documentId = 'doc-1';
      const nextReviewDate = new Date('2025-06-01');
      const userId = 'user-1';

      const mockDocument = {
        id: documentId,
        nextReviewDate,
      };

      mockPrismaService.policyDocument.update.mockResolvedValue(mockDocument);
      mockAuditService.log.mockResolvedValue(undefined);

      await service.rescheduleReview(documentId, nextReviewDate, userId);

      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId,
        action: 'UPDATED',
        description: `Review rescheduled to ${nextReviewDate.toISOString().split('T')[0]}`,
        performedById: userId,
        newValue: { nextReviewDate },
      });
    });

    it('should not log audit event when userId is not provided', async () => {
      const documentId = 'doc-1';
      const nextReviewDate = new Date('2025-06-01');

      const mockDocument = {
        id: documentId,
        nextReviewDate,
      };

      mockPrismaService.policyDocument.update.mockResolvedValue(mockDocument);

      await service.rescheduleReview(documentId, nextReviewDate);

      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should format date correctly in audit log description', async () => {
      const documentId = 'doc-1';
      const nextReviewDate = new Date('2025-12-25');
      const userId = 'user-1';

      mockPrismaService.policyDocument.update.mockResolvedValue({ id: documentId });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.rescheduleReview(documentId, nextReviewDate, userId);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Review rescheduled to 2025-12-25',
        })
      );
    });
  });

  describe('calculateNextReviewDate (private method via createReview)', () => {
    it('should calculate correct next review dates for all frequencies', async () => {
      const testCases = [
        { frequency: 'MONTHLY' as ReviewFrequency, expectedDays: 30 },
        { frequency: 'QUARTERLY' as ReviewFrequency, expectedDays: 90 },
        { frequency: 'SEMI_ANNUAL' as ReviewFrequency, expectedDays: 180 },
        { frequency: 'ANNUAL' as ReviewFrequency, expectedDays: 365 },
        { frequency: 'BIENNIAL' as ReviewFrequency, expectedDays: 730 },
        { frequency: 'TRIENNIAL' as ReviewFrequency, expectedDays: 1095 },
        { frequency: 'ON_CHANGE' as ReviewFrequency, expectedDays: 365 },
        { frequency: 'AS_NEEDED' as ReviewFrequency, expectedDays: 365 },
      ];

      for (const testCase of testCases) {
        const createData = {
          documentId: 'doc-1',
          reviewType: 'SCHEDULED' as ReviewType,
          outcome: 'APPROVED' as ReviewOutcome,
          reviewedById: 'user-1',
        };

        const mockDocument = {
          id: 'doc-1',
          reviewFrequency: testCase.frequency,
        };

        mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
        mockPrismaService.documentReview.create.mockResolvedValue({ id: 'review-1' });
        mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
        mockAuditService.log.mockResolvedValue(undefined);

        await service.createReview(createData);

        const createCall = mockPrismaService.documentReview.create.mock.calls[0][0];
        const nextReviewDate = createCall.data.nextReviewDate;
        const now = new Date();
        const expectedDate = new Date(now.getTime() + testCase.expectedDays * 24 * 60 * 60 * 1000);
        const timeDiff = Math.abs(nextReviewDate.getTime() - expectedDate.getTime());

        expect(timeDiff).toBeLessThan(1000); // Within 1 second

        jest.clearAllMocks();
      }
    });
  });

  describe('review outcome handling', () => {
    it('should not change document status for APPROVED outcome', async () => {
      const createData = {
        documentId: 'doc-1',
        reviewType: 'SCHEDULED' as ReviewType,
        outcome: 'APPROVED' as ReviewOutcome,
        reviewedById: 'user-1',
      };

      const mockDocument = { id: 'doc-1', reviewFrequency: 'ANNUAL' as ReviewFrequency };
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentReview.create.mockResolvedValue({ id: 'review-1' });
      mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.createReview(createData);

      const updateCall = mockPrismaService.policyDocument.update.mock.calls[0][0];
      expect(updateCall.data.status).toBeUndefined();
      expect(updateCall.data.retirementDate).toBeUndefined();
    });

    it('should not change document status for MINOR_CHANGES outcome', async () => {
      const createData = {
        documentId: 'doc-1',
        reviewType: 'SCHEDULED' as ReviewType,
        outcome: 'MINOR_CHANGES' as ReviewOutcome,
        changesRequired: true,
        reviewedById: 'user-1',
      };

      const mockDocument = { id: 'doc-1', reviewFrequency: 'ANNUAL' as ReviewFrequency };
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentReview.create.mockResolvedValue({ id: 'review-1' });
      mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.createReview(createData);

      const updateCall = mockPrismaService.policyDocument.update.mock.calls[0][0];
      expect(updateCall.data.status).toBeUndefined();
      expect(updateCall.data.retirementDate).toBeUndefined();
    });

    it('should include all review details when creating review record', async () => {
      const createData = {
        documentId: 'doc-1',
        reviewType: 'AD_HOC' as ReviewType,
        outcome: 'APPROVED' as ReviewOutcome,
        findings: 'Policy compliant with new regulations',
        recommendations: 'Add clarification on data retention',
        actionItems: 'Update training materials',
        changesRequired: false,
        changeDescription: undefined,
        reviewedById: 'user-1',
      };

      const mockDocument = { id: 'doc-1', reviewFrequency: 'ANNUAL' as ReviewFrequency };
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentReview.create.mockResolvedValue({ id: 'review-1' });
      mockPrismaService.policyDocument.update.mockResolvedValue({ id: 'doc-1' });
      mockAuditService.log.mockResolvedValue(undefined);

      await service.createReview(createData);

      expect(mockPrismaService.documentReview.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: createData.documentId } },
          reviewType: createData.reviewType,
          reviewDate: expect.any(Date),
          outcome: createData.outcome,
          findings: createData.findings,
          recommendations: createData.recommendations,
          actionItems: createData.actionItems,
          changesRequired: false,
          changeDescription: undefined,
          nextReviewDate: expect.any(Date),
          reviewedBy: { connect: { id: createData.reviewedById } },
        },
        include: {
          reviewedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });
  });
});
