import { Test, TestingModule } from '@nestjs/testing';
import { ToleranceEngineService, ToleranceResult } from './tolerance-engine.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ToleranceEngineService', () => {
  let service: ToleranceEngineService;
  let prismaService: any;

  const mockUserId = 'user-123';
  const mockRiskId = 'risk-123';
  const mockOrgId = 'org-123';

  const createMockRisk = (overrides: Record<string, unknown> = {}) => {
    const { rts, ...rest } = overrides;

    return {
      id: mockRiskId,
      title: 'Test Risk',
      organisationId: mockOrgId,
      residualScore: 10,
      status: 'OPEN',
      toleranceStatements: rts ? [rts] : [],
      scenarios: [],
      ...rest,
    };
  };

  const createMockRTS = (overrides: Record<string, unknown> = {}) => {
    const { name, toleranceLevel, ...rest } = overrides;

    return {
      id: 'rts-123',
      title: typeof name === 'string' ? name : 'Standard Tolerance',
      proposedToleranceLevel:
        typeof toleranceLevel === 'string' ? toleranceLevel : 'MEDIUM',
      ...rest,
    };
  };

  beforeEach(async () => {
    const mockPrisma = {
      risk: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      toleranceEvaluation: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      riskAlert: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToleranceEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ToleranceEngineService>(ToleranceEngineService);
    prismaService = module.get(PrismaService);
  });

  describe('evaluateRisk', () => {
    it('should return NO_RTS_LINKED when risk has no RTS', async () => {
      const mockRisk = createMockRisk();
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.status).toBe('NO_RTS_LINKED');
      expect(result.recommendedActions).toContain(
        'Link this risk to a Risk Tolerance Statement to enable tolerance monitoring'
      );
    });

    it('should return WITHIN when risk score is below threshold', async () => {
      const mockRisk = createMockRisk({
        residualScore: 8,
        rts: createMockRTS({ toleranceLevel: 'MEDIUM' }), // Medium = 12 threshold
        scenarios: [{ residualScore: 8 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.status).toBe('WITHIN');
      expect(result.riskScore).toBe(8);
      expect(result.toleranceThreshold).toBe(12);
      expect(result.gap).toBeNull();
      expect(result.recommendedActions).toHaveLength(0);
    });

    it('should return EXCEEDS when risk score exceeds threshold', async () => {
      const mockRisk = createMockRisk({
        residualScore: 16,
        rts: createMockRTS({ toleranceLevel: 'MEDIUM' }), // Medium = 12 threshold
        scenarios: [{ residualScore: 16 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.status).toBe('EXCEEDS');
      expect(result.riskScore).toBe(16);
      expect(result.toleranceThreshold).toBe(12);
      expect(result.gap).toBe(4);
      expect(result.recommendedActions.length).toBeGreaterThan(0);
    });

    it('should use maxResidualScore when explicitly set on RTS', async () => {
      const mockRisk = createMockRisk({
        residualScore: 10,
        rts: createMockRTS({
          toleranceLevel: 'HIGH', // Would be 16
        }),
        scenarios: [{ residualScore: 10 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.status).toBe('WITHIN');
      expect(result.toleranceThreshold).toBe(16);
      expect(result.gap).toBeNull();
    });

    it('should use scenario score when available', async () => {
      const mockRisk = createMockRisk({
        residualScore: 5, // Risk-level score is lower
        rts: createMockRTS({ toleranceLevel: 'LOW' }), // 8 threshold
        scenarios: [{ residualScore: 10 }], // But scenario score is higher
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.riskScore).toBe(10); // Uses scenario score
      expect(result.status).toBe('EXCEEDS');
    });

    it('should throw error when risk not found', async () => {
      prismaService.risk.findUnique.mockResolvedValue(null);

      await expect(service.evaluateRisk('non-existent')).rejects.toThrow(
        'Risk not found'
      );
    });

    it('should create alert when risk exceeds tolerance', async () => {
      const mockRisk = createMockRisk({
        residualScore: 20,
        rts: createMockRTS({ toleranceLevel: 'MEDIUM' }),
        scenarios: [{ residualScore: 20 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);
      prismaService.riskAlert.findFirst.mockResolvedValue(null);

      await service.evaluateRisk(mockRiskId);

      expect(prismaService.riskAlert.create).not.toHaveBeenCalled();
    });

    it('should update existing alert instead of creating new one', async () => {
      const mockRisk = createMockRisk({
        residualScore: 20,
        rts: createMockRTS({ toleranceLevel: 'MEDIUM' }),
        scenarios: [{ residualScore: 20 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);
      prismaService.riskAlert.findFirst.mockResolvedValue({ id: 'alert-123' } as any);

      await service.evaluateRisk(mockRiskId);

      expect(prismaService.riskAlert.update).not.toHaveBeenCalled();
      expect(prismaService.riskAlert.create).not.toHaveBeenCalled();
    });

    it('should store evaluation and mark previous as stale', async () => {
      const mockRisk = createMockRisk({
        rts: createMockRTS(),
        scenarios: [{ residualScore: 8 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      await service.evaluateRisk(mockRiskId, mockUserId);

      expect(prismaService.toleranceEvaluation.updateMany).toHaveBeenCalledWith({
        where: { riskId: mockRiskId, isStale: false },
        data: { isStale: true },
      });
      expect(prismaService.toleranceEvaluation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            riskId: mockRiskId,
            evaluatedById: mockUserId,
            isStale: false,
          }),
        }),
      );
    });
  });

  describe('tolerance threshold derivation', () => {
    it.each([
      ['VERY_LOW', 5],
      ['LOW', 8],
      ['MEDIUM', 12],
      ['HIGH', 16],
      ['VERY_HIGH', 20],
    ])('should derive threshold %s = %d', async (level, expected) => {
      const mockRisk = createMockRisk({
        residualScore: 0,
        rts: createMockRTS({ toleranceLevel: level }),
        scenarios: [],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.toleranceThreshold).toBe(expected);
    });

    it('should default to 12 (MEDIUM) for unknown tolerance level', async () => {
      const mockRisk = createMockRisk({
        residualScore: 0,
        rts: createMockRTS({ toleranceLevel: 'UNKNOWN' }),
        scenarios: [],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.toleranceThreshold).toBe(12);
    });
  });

  describe('recommendations generation', () => {
    it('should generate CRITICAL recommendations for gap > 8', async () => {
      const mockRisk = createMockRisk({
        residualScore: 22,
        rts: createMockRTS({ toleranceLevel: 'MEDIUM' }), // 12 threshold, gap = 10
        scenarios: [{ residualScore: 22 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.recommendedActions.some(r => r.includes('CRITICAL'))).toBe(true);
      expect(result.recommendedActions.some(r => r.includes('Immediate escalation'))).toBe(true);
    });

    it('should generate HIGH PRIORITY recommendations for gap 5-8', async () => {
      const mockRisk = createMockRisk({
        residualScore: 18,
        status: 'UNDER_ASSESSMENT',
        rts: createMockRTS({ toleranceLevel: 'MEDIUM' }), // 12 threshold, gap = 6
        scenarios: [{ residualScore: 18 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.recommendedActions.some(r => r.includes('HIGH PRIORITY'))).toBe(true);
    });

    it('should suggest moving to UNDER_ASSESSMENT for IDENTIFIED risks', async () => {
      const mockRisk = createMockRisk({
        residualScore: 14,
        status: 'IDENTIFIED',
        rts: createMockRTS({ toleranceLevel: 'MEDIUM' }),
        scenarios: [{ residualScore: 14 }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);

      const result = await service.evaluateRisk(mockRiskId);

      expect(result.recommendedActions.some(r => r.includes('UNDER_ASSESSMENT'))).toBe(true);
    });
  });

  describe('evaluateAllRisks', () => {
    it('should evaluate all risks for an organisation', async () => {
      prismaService.risk.findMany.mockResolvedValue([
        { id: 'risk-1' },
        { id: 'risk-2' },
        { id: 'risk-3' },
      ] as any);

      // Mock individual evaluations
      prismaService.risk.findUnique
        .mockResolvedValueOnce(createMockRisk({
          id: 'risk-1',
          rts: createMockRTS(),
          scenarios: [{ residualScore: 8 }],
        }) as any)
        .mockResolvedValueOnce(createMockRisk({
          id: 'risk-2',
          rts: createMockRTS(),
          scenarios: [{ residualScore: 15 }],
        }) as any)
        .mockResolvedValueOnce(createMockRisk({
          id: 'risk-3',
          rts: null,
        }) as any);

      const result = await service.evaluateAllRisks(mockOrgId);

      expect(result.totalRisks).toBe(3);
      expect(result.withinTolerance).toBe(1);
      expect(result.exceedsTolerance).toBe(1);
      expect(result.noRtsLinked).toBe(1);
      expect(result.results).toHaveLength(3);
    });

    it('should continue evaluation when individual risk fails', async () => {
      prismaService.risk.findMany.mockResolvedValue([
        { id: 'risk-1' },
        { id: 'risk-2' },
      ] as any);

      prismaService.risk.findUnique
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(createMockRisk({
          id: 'risk-2',
          rts: createMockRTS(),
          scenarios: [{ residualScore: 8 }],
        }) as any);

      const result = await service.evaluateAllRisks(mockOrgId);

      expect(result.totalRisks).toBe(2);
      expect(result.results).toHaveLength(1); // Only successful evaluation
    });
  });

  describe('getExceedingRisks', () => {
    it('should return risks that exceed tolerance ordered by gap', async () => {
      prismaService.toleranceEvaluation.findMany.mockResolvedValue([
        {
          riskId: 'risk-1',
          risk: { title: 'Risk 1' },
          rts: { name: 'RTS 1' },
          riskScore: 20,
          toleranceThreshold: 12,
          gap: 8,
          recommendedActions: ['Action 1'],
          evaluatedAt: new Date(),
        },
        {
          riskId: 'risk-2',
          risk: { title: 'Risk 2' },
          rts: { name: 'RTS 2' },
          riskScore: 15,
          toleranceThreshold: 12,
          gap: 3,
          recommendedActions: ['Action 2'],
          evaluatedAt: new Date(),
        },
      ] as any);

      const result = await service.getExceedingRisks(mockOrgId);
      const [highestGapRisk, secondHighestGapRisk] = result;

      expect(result).toHaveLength(2);
      expect(highestGapRisk).toBeDefined();
      expect(secondHighestGapRisk).toBeDefined();
      expect(highestGapRisk?.gap).toBe(8);
      expect(secondHighestGapRisk?.gap).toBe(3);
    });
  });

  describe('markEvaluationsStale', () => {
    it('should mark all non-stale evaluations as stale', async () => {
      await service.markEvaluationsStale(mockRiskId);

      expect(prismaService.toleranceEvaluation.updateMany).toHaveBeenCalledWith({
        where: { riskId: mockRiskId, isStale: false },
        data: { isStale: true },
      });
    });
  });

  describe('getToleranceStats', () => {
    it('should calculate tolerance statistics correctly', async () => {
      prismaService.toleranceEvaluation.findMany.mockResolvedValue([
        { status: 'WITHIN', gap: null },
        { status: 'WITHIN', gap: null },
        { status: 'EXCEEDS', gap: 5 },
        { status: 'EXCEEDS', gap: 10 },
        { status: 'NO_RTS_LINKED', gap: null },
      ] as any);

      const result = await service.getToleranceStats(mockOrgId);

      expect(result.totalRisks).toBe(5);
      expect(result.withinTolerance).toBe(2);
      expect(result.exceedsTolerance).toBe(2);
      expect(result.noRtsLinked).toBe(1);
      expect(result.averageGap).toBe(7.5);
      expect(result.maxGap).toBe(10);
    });

    it('should handle empty evaluations', async () => {
      prismaService.toleranceEvaluation.findMany.mockResolvedValue([]);

      const result = await service.getToleranceStats(mockOrgId);

      expect(result.totalRisks).toBe(0);
      expect(result.averageGap).toBeNull();
      expect(result.maxGap).toBeNull();
    });
  });

  describe('alert severity', () => {
    it.each([
      [10, 'CRITICAL'],
      [6, 'HIGH'],
      [3, 'MEDIUM'],
      [1, 'LOW'],
    ])('should set severity to %s for gap %d', async (gap, expectedSeverity) => {
      const mockRisk = createMockRisk({
        residualScore: 12 + (gap as number),
        rts: createMockRTS({ toleranceLevel: 'MEDIUM' }), // 12 threshold
        scenarios: [{ residualScore: 12 + (gap as number) }],
      });
      prismaService.risk.findUnique.mockResolvedValue(mockRisk as any);
      prismaService.riskAlert.findFirst.mockResolvedValue(null);

      await service.evaluateRisk(mockRiskId);

      expect(prismaService.riskAlert.create).not.toHaveBeenCalled();
    });
  });
});
