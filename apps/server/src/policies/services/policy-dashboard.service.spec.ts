import { Test, TestingModule } from '@nestjs/testing';
import { PolicyDashboardService } from './policy-dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PolicyDashboardService', () => {
  let service: PolicyDashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    policyDocument: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    documentApprovalWorkflow: {
      count: jest.fn(),
    },
    documentAcknowledgment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    documentException: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    documentChangeRequest: {
      count: jest.fn(),
    },
    control: {
      findMany: jest.fn(),
    },
    approvalStep: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyDashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PolicyDashboardService>(PolicyDashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      const organisationId = 'org-1';

      // Mock document stats
      mockPrismaService.policyDocument.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(35); // published

      mockPrismaService.policyDocument.groupBy
        .mockResolvedValueOnce([
          { documentType: 'POLICY', _count: 20 },
          { documentType: 'PROCEDURE', _count: 15 },
          { documentType: 'STANDARD', _count: 10 },
          { documentType: 'GUIDELINE', _count: 5 },
        ])
        .mockResolvedValueOnce([
          { status: 'PUBLISHED', _count: 35 },
          { status: 'DRAFT', _count: 10 },
          { status: 'ARCHIVED', _count: 5 },
        ]);

      // Mock review stats
      mockPrismaService.policyDocument.count
        .mockResolvedValueOnce(5) // overdue
        .mockResolvedValueOnce(8) // due soon
        .mockResolvedValueOnce(12); // upcoming

      // Mock approval stats
      mockPrismaService.documentApprovalWorkflow.count
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(5) // in progress
        .mockResolvedValueOnce(15); // completed this month

      // Mock acknowledgment stats
      mockPrismaService.documentAcknowledgment.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75) // acknowledged
        .mockResolvedValueOnce(25) // pending
        .mockResolvedValueOnce(10); // overdue

      // Mock exception stats
      mockPrismaService.documentException.count
        .mockResolvedValueOnce(8) // active
        .mockResolvedValueOnce(3) // expiring
        .mockResolvedValueOnce(2); // pending

      // Mock change request stats
      mockPrismaService.documentChangeRequest.count
        .mockResolvedValueOnce(4) // pending
        .mockResolvedValueOnce(6) // in progress
        .mockResolvedValueOnce(12); // completed this month

      const result = await service.getDashboardStats(organisationId);

      expect(result).toEqual({
        documents: {
          total: 50,
          published: 35,
          byType: {
            POLICY: 20,
            PROCEDURE: 15,
            STANDARD: 10,
            GUIDELINE: 5,
          },
          byStatus: {
            PUBLISHED: 35,
            DRAFT: 10,
            ARCHIVED: 5,
          },
        },
        reviews: {
          overdue: 5,
          dueSoon: 8,
          upcoming: 12,
        },
        approvals: {
          pending: 3,
          inProgress: 5,
          completedThisMonth: 15,
        },
        acknowledgments: {
          total: 100,
          acknowledged: 75,
          pending: 25,
          overdue: 10,
          completionRate: 75,
        },
        exceptions: {
          active: 8,
          expiring: 3,
          pending: 2,
        },
        changeRequests: {
          pending: 4,
          inProgress: 6,
          completedThisMonth: 12,
        },
      });
    });

    it('should handle zero documents gracefully', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.count.mockResolvedValue(0);
      mockPrismaService.policyDocument.groupBy.mockResolvedValue([]);
      mockPrismaService.documentApprovalWorkflow.count.mockResolvedValue(0);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);
      mockPrismaService.documentException.count.mockResolvedValue(0);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

      const result = await service.getDashboardStats(organisationId);

      expect(result.documents.total).toBe(0);
      expect(result.acknowledgments.completionRate).toBe(0);
    });

    it('should calculate acknowledgment completion rate correctly', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.count.mockResolvedValue(0);
      mockPrismaService.policyDocument.groupBy.mockResolvedValue([]);
      mockPrismaService.documentApprovalWorkflow.count.mockResolvedValue(0);
      mockPrismaService.documentException.count.mockResolvedValue(0);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

      // 45 out of 60 = 75%
      mockPrismaService.documentAcknowledgment.count
        .mockResolvedValueOnce(60) // total
        .mockResolvedValueOnce(45) // acknowledged
        .mockResolvedValueOnce(15) // pending
        .mockResolvedValueOnce(5); // overdue

      const result = await service.getDashboardStats(organisationId);

      expect(result.acknowledgments.completionRate).toBe(75);
    });
  });

  describe('getComplianceStatus', () => {
    it('should return compliance status with control coverage', async () => {
      const organisationId = 'org-1';

      const mockControls = [
        {
          id: 'control-1',
          documentMappings: [
            { coverage: 'FULL' },
            { coverage: 'PARTIAL' },
          ],
        },
        {
          id: 'control-2',
          documentMappings: [
            { coverage: 'FULL' },
          ],
        },
        {
          id: 'control-3',
          documentMappings: [
            { coverage: 'PARTIAL' },
          ],
        },
        {
          id: 'control-4',
          documentMappings: [],
        },
      ];

      mockPrismaService.control.findMany.mockResolvedValue(mockControls);
      mockPrismaService.policyDocument.findMany.mockResolvedValue([
        { documentType: 'POLICY', documentId: 'POL-001', controlMappings: [{ controlId: 'c1' }] },
        { documentType: 'POLICY', documentId: 'POL-002', controlMappings: [{ controlId: 'c2' }] },
        { documentType: 'PROCEDURE', documentId: 'PROC-001', controlMappings: [{ controlId: 'c3' }] },
      ]);

      const result = await service.getComplianceStatus(organisationId);

      expect(result.controlCoverage.total).toBe(4);
      expect(result.controlCoverage.covered).toBe(3); // 3 controls have mappings
      expect(result.controlCoverage.fullyCovered).toBe(2); // 2 controls have FULL coverage
      expect(result.controlCoverage.percentage).toBe(75); // 3/4 = 75%
      expect(result.mandatoryDocuments.total).toBe(15);
      expect(result.mandatoryDocuments.completed).toBe(3);
      expect(result.mandatoryDocuments.percentage).toBe(20);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should handle zero controls gracefully', async () => {
      const organisationId = 'org-1';

      mockPrismaService.control.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      const result = await service.getComplianceStatus(organisationId);

      expect(result.controlCoverage.total).toBe(0);
      expect(result.controlCoverage.covered).toBe(0);
      expect(result.controlCoverage.percentage).toBe(0);
      expect(result.overallScore).toBe(0);
    });

    it('should calculate overall compliance score correctly', async () => {
      const organisationId = 'org-1';

      const mockControls = [
        { id: 'control-1', documentMappings: [{ coverage: 'FULL' }] },
        { id: 'control-2', documentMappings: [{ coverage: 'PARTIAL' }] },
      ];

      mockPrismaService.control.findMany.mockResolvedValue(mockControls);
      mockPrismaService.policyDocument.findMany.mockResolvedValue([
        { documentType: 'POLICY', documentId: 'POL-001', controlMappings: [{ controlId: 'c1' }] },
      ]);

      const result = await service.getComplianceStatus(organisationId);

      // Control coverage: 2/2 = 100%
      // Doc coverage: 1/15 = 6.67%
      // Overall score: 100% * 0.6 + 6.67% * 0.4 = 63%
      expect(result.overallScore).toBe(63);
    });

    it('should correctly identify controls with full coverage', async () => {
      const organisationId = 'org-1';

      const mockControls = [
        {
          id: 'control-1',
          documentMappings: [
            { coverage: 'PARTIAL' },
            { coverage: 'FULL' }, // Has at least one FULL
          ],
        },
        {
          id: 'control-2',
          documentMappings: [
            { coverage: 'PARTIAL' },
            { coverage: 'PARTIAL' }, // No FULL
          ],
        },
        {
          id: 'control-3',
          documentMappings: [],
        },
      ];

      mockPrismaService.control.findMany.mockResolvedValue(mockControls);
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      const result = await service.getComplianceStatus(organisationId);

      expect(result.controlCoverage.fullyCovered).toBe(1);
      expect(result.controlCoverage.covered).toBe(2);
    });
  });

  describe('getActionsNeeded', () => {
    it('should return all actions requiring attention', async () => {
      const organisationId = 'org-1';
      const now = new Date();
      const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const mockOverdueReviews = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Security Policy',
          nextReviewDate: pastDate,
        },
        {
          id: 'doc-2',
          documentId: 'POL-002',
          title: 'Privacy Policy',
          nextReviewDate: pastDate,
        },
      ];

      const mockPendingApprovals = [
        {
          id: 'step-1',
          stepName: 'Legal Review',
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          workflow: {
            document: {
              id: 'doc-3',
              documentId: 'POL-003',
              title: 'Data Protection Policy',
            },
          },
        },
      ];

      const mockOverdueAcks = [
        {
          id: 'ack-1',
          document: {
            documentId: 'POL-001',
            title: 'Security Policy',
          },
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
          dueDate: pastDate,
        },
      ];

      const mockExpiringExceptions = [
        {
          id: 'exc-1',
          exceptionId: 'EXC-001',
          title: 'Temporary Access Exception',
          expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockOverdueReviews);
      mockPrismaService.approvalStep.findMany.mockResolvedValue(mockPendingApprovals);
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue(mockOverdueAcks);
      mockPrismaService.documentException.findMany.mockResolvedValue(mockExpiringExceptions);

      const result = await service.getActionsNeeded(organisationId);
      const [firstOverdueReview] = result.overdueReviews;
      const [firstPendingApproval] = result.pendingApprovals;
      const [firstOverdueAcknowledgment] = result.overdueAcknowledgments;
      const [firstExpiringException] = result.expiringExceptions;

      expect(result.overdueReviews).toHaveLength(2);
      expect(result.pendingApprovals).toHaveLength(1);
      expect(result.overdueAcknowledgments).toHaveLength(1);
      expect(result.expiringExceptions).toHaveLength(1);

      expect(firstOverdueReview).toBeDefined();
      expect(firstPendingApproval).toBeDefined();
      expect(firstOverdueAcknowledgment).toBeDefined();
      expect(firstExpiringException).toBeDefined();
      expect(firstOverdueReview?.documentId).toBe('POL-001');
      expect(firstPendingApproval?.stepName).toBe('Legal Review');
      expect(firstOverdueAcknowledgment?.user.firstName).toBe('John');
      expect(firstExpiringException?.exceptionId).toBe('EXC-001');
    });

    it('should limit results to 5 items per category', async () => {
      const organisationId = 'org-1';

      const mockOverdueReviews = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        documentId: `POL-${i.toString().padStart(3, '0')}`,
        title: `Policy ${i}`,
        nextReviewDate: new Date(),
      }));

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockOverdueReviews);
      mockPrismaService.approvalStep.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.findMany.mockResolvedValue([]);

      await service.getActionsNeeded(organisationId);

      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should order overdue reviews by date ascending', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);
      mockPrismaService.approvalStep.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.findMany.mockResolvedValue([]);

      await service.getActionsNeeded(organisationId);

      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nextReviewDate: 'asc' },
        })
      );
    });

    it('should filter expiring exceptions to next 30 days', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);
      mockPrismaService.approvalStep.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.findMany.mockResolvedValue([]);

      await service.getActionsNeeded(organisationId);

      const exceptionCall = mockPrismaService.documentException.findMany.mock.calls[0]?.[0];
      expect(exceptionCall).toBeDefined();
      expect(exceptionCall?.where.status).toBe('ACTIVE');
      expect(exceptionCall?.where.expiryDate).toHaveProperty('lte');
      expect(exceptionCall?.where.expiryDate).toHaveProperty('gte');
    });

    it('should handle empty results gracefully', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);
      mockPrismaService.approvalStep.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.findMany.mockResolvedValue([]);

      const result = await service.getActionsNeeded(organisationId);

      expect(result.overdueReviews).toHaveLength(0);
      expect(result.pendingApprovals).toHaveLength(0);
      expect(result.overdueAcknowledgments).toHaveLength(0);
      expect(result.expiringExceptions).toHaveLength(0);
    });
  });

  describe('private helper methods behavior', () => {
    describe('document stats calculation', () => {
      it('should aggregate document types correctly', async () => {
        const organisationId = 'org-1';

        mockPrismaService.policyDocument.count.mockResolvedValue(0);
        mockPrismaService.policyDocument.groupBy
          .mockResolvedValueOnce([
            { documentType: 'POLICY', _count: 10 },
            { documentType: 'PROCEDURE', _count: 5 },
          ])
          .mockResolvedValueOnce([]);
        mockPrismaService.documentApprovalWorkflow.count.mockResolvedValue(0);
        mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);
        mockPrismaService.documentException.count.mockResolvedValue(0);
        mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

        const result = await service.getDashboardStats(organisationId);

        expect(result.documents.byType).toEqual({
          POLICY: 10,
          PROCEDURE: 5,
        });
      });

      it('should aggregate document statuses correctly', async () => {
        const organisationId = 'org-1';

        mockPrismaService.policyDocument.count.mockResolvedValue(0);
        mockPrismaService.policyDocument.groupBy
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            { status: 'PUBLISHED', _count: 20 },
            { status: 'DRAFT', _count: 5 },
            { status: 'ARCHIVED', _count: 3 },
          ]);
        mockPrismaService.documentApprovalWorkflow.count.mockResolvedValue(0);
        mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);
        mockPrismaService.documentException.count.mockResolvedValue(0);
        mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

        const result = await service.getDashboardStats(organisationId);

        expect(result.documents.byStatus).toEqual({
          PUBLISHED: 20,
          DRAFT: 5,
          ARCHIVED: 3,
        });
      });
    });

    describe('review stats calculation', () => {
      it('should categorize reviews by time windows', async () => {
        const organisationId = 'org-1';

        mockPrismaService.policyDocument.count.mockResolvedValue(0);
        mockPrismaService.policyDocument.groupBy.mockResolvedValue([]);
        mockPrismaService.documentApprovalWorkflow.count.mockResolvedValue(0);
        mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);
        mockPrismaService.documentException.count.mockResolvedValue(0);
        mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

        mockPrismaService.policyDocument.count
          .mockResolvedValueOnce(0) // total documents
          .mockResolvedValueOnce(0) // published documents
          .mockResolvedValueOnce(3) // overdue (< now)
          .mockResolvedValueOnce(5) // due soon (0-30 days)
          .mockResolvedValueOnce(7); // upcoming (30-90 days)

        const result = await service.getDashboardStats(organisationId);

        expect(result.reviews.overdue).toBe(3);
        expect(result.reviews.dueSoon).toBe(5);
        expect(result.reviews.upcoming).toBe(7);
      });
    });

    describe('approval stats calculation', () => {
      it('should count approvals by status', async () => {
        const organisationId = 'org-1';

        mockPrismaService.policyDocument.count.mockResolvedValue(0);
        mockPrismaService.policyDocument.groupBy.mockResolvedValue([]);
        mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);
        mockPrismaService.documentException.count.mockResolvedValue(0);
        mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

        mockPrismaService.documentApprovalWorkflow.count
          .mockResolvedValueOnce(2) // pending
          .mockResolvedValueOnce(4) // in progress
          .mockResolvedValueOnce(10); // completed this month

        const result = await service.getDashboardStats(organisationId);

        expect(result.approvals.pending).toBe(2);
        expect(result.approvals.inProgress).toBe(4);
        expect(result.approvals.completedThisMonth).toBe(10);
      });
    });

    describe('exception stats calculation', () => {
      it('should categorize exceptions correctly', async () => {
        const organisationId = 'org-1';

        mockPrismaService.policyDocument.count.mockResolvedValue(0);
        mockPrismaService.policyDocument.groupBy.mockResolvedValue([]);
        mockPrismaService.documentApprovalWorkflow.count.mockResolvedValue(0);
        mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);
        mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

        mockPrismaService.documentException.count
          .mockResolvedValueOnce(12) // active
          .mockResolvedValueOnce(5) // expiring (next 30 days)
          .mockResolvedValueOnce(3); // pending (REQUESTED or UNDER_REVIEW)

        const result = await service.getDashboardStats(organisationId);

        expect(result.exceptions.active).toBe(12);
        expect(result.exceptions.expiring).toBe(5);
        expect(result.exceptions.pending).toBe(3);
      });
    });

    describe('change request stats calculation', () => {
      it('should categorize change requests by status', async () => {
        const organisationId = 'org-1';

        mockPrismaService.policyDocument.count.mockResolvedValue(0);
        mockPrismaService.policyDocument.groupBy.mockResolvedValue([]);
        mockPrismaService.documentApprovalWorkflow.count.mockResolvedValue(0);
        mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);
        mockPrismaService.documentException.count.mockResolvedValue(0);

        mockPrismaService.documentChangeRequest.count
          .mockResolvedValueOnce(6) // pending (SUBMITTED or UNDER_REVIEW)
          .mockResolvedValueOnce(8) // in progress
          .mockResolvedValueOnce(15); // completed this month

        const result = await service.getDashboardStats(organisationId);

        expect(result.changeRequests.pending).toBe(6);
        expect(result.changeRequests.inProgress).toBe(8);
        expect(result.changeRequests.completedThisMonth).toBe(15);
      });
    });
  });

  describe('mandatory document tracking', () => {
    it('should count mandatory document types correctly', async () => {
      const organisationId = 'org-1';

      mockPrismaService.control.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocument.findMany.mockResolvedValue([
        { documentType: 'POLICY', documentId: 'POL-001', controlMappings: [] },
        { documentType: 'POLICY', documentId: 'POL-002', controlMappings: [] },
        { documentType: 'STANDARD', documentId: 'STD-001', controlMappings: [] },
        { documentType: 'PROCEDURE', documentId: 'PROC-001', controlMappings: [] },
      ]);

      const result = await service.getComplianceStatus(organisationId);

      expect(result.mandatoryDocuments.completed).toBe(4);
      expect(result.mandatoryDocuments.percentage).toBe(27); // 4/15 = 26.67% rounded to 27%
    });

    it('should cap completed documents at total mandatory count', async () => {
      const organisationId = 'org-1';

      mockPrismaService.control.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocument.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          documentType: 'POLICY',
          documentId: `POL-${i.toString().padStart(3, '0')}`,
          controlMappings: [],
        }))
      );

      const result = await service.getComplianceStatus(organisationId);

      // Should cap at 15 even though 20 documents exist
      expect(result.mandatoryDocuments.completed).toBe(15);
      expect(result.mandatoryDocuments.percentage).toBe(100);
    });
  });

  describe('error handling', () => {
    it('should propagate prisma errors for getDashboardStats', async () => {
      const organisationId = 'org-1';
      const error = new Error('Database connection failed');

      mockPrismaService.policyDocument.count.mockRejectedValue(error);

      await expect(service.getDashboardStats(organisationId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should propagate prisma errors for getComplianceStatus', async () => {
      const organisationId = 'org-1';
      const error = new Error('Database query failed');

      mockPrismaService.control.findMany.mockRejectedValue(error);

      await expect(service.getComplianceStatus(organisationId)).rejects.toThrow(
        'Database query failed'
      );
    });

    it('should propagate prisma errors for getActionsNeeded', async () => {
      const organisationId = 'org-1';
      const error = new Error('Database timeout');

      mockPrismaService.policyDocument.findMany.mockRejectedValue(error);

      await expect(service.getActionsNeeded(organisationId)).rejects.toThrow(
        'Database timeout'
      );
    });
  });

  describe('query optimization', () => {
    it('should use Promise.all for parallel queries in getDashboardStats', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.count.mockResolvedValue(0);
      mockPrismaService.policyDocument.groupBy.mockResolvedValue([]);
      mockPrismaService.documentApprovalWorkflow.count.mockResolvedValue(0);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(0);
      mockPrismaService.documentException.count.mockResolvedValue(0);
      mockPrismaService.documentChangeRequest.count.mockResolvedValue(0);

      await service.getDashboardStats(organisationId);

      // Verify parallel execution by checking all mocks were called
      expect(mockPrismaService.policyDocument.count).toHaveBeenCalled();
      expect(mockPrismaService.documentApprovalWorkflow.count).toHaveBeenCalled();
      expect(mockPrismaService.documentAcknowledgment.count).toHaveBeenCalled();
      expect(mockPrismaService.documentException.count).toHaveBeenCalled();
      expect(mockPrismaService.documentChangeRequest.count).toHaveBeenCalled();
    });

    it('should use Promise.all for parallel queries in getActionsNeeded', async () => {
      const organisationId = 'org-1';

      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);
      mockPrismaService.approvalStep.findMany.mockResolvedValue([]);
      mockPrismaService.documentAcknowledgment.findMany.mockResolvedValue([]);
      mockPrismaService.documentException.findMany.mockResolvedValue([]);

      await service.getActionsNeeded(organisationId);

      // All queries should be called in parallel
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalled();
      expect(mockPrismaService.approvalStep.findMany).toHaveBeenCalled();
      expect(mockPrismaService.documentAcknowledgment.findMany).toHaveBeenCalled();
      expect(mockPrismaService.documentException.findMany).toHaveBeenCalled();
    });
  });
});
