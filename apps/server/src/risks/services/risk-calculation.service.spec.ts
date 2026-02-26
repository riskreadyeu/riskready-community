import { Test, TestingModule } from '@nestjs/testing';
import { RiskCalculationService } from './risk-calculation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskEventBusService } from './risk-event-bus.service';
import { ToleranceEngineService } from './tolerance-engine.service';

describe('RiskCalculationService', () => {
  let service: RiskCalculationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    riskScenario: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    risk: {
      update: jest.fn(),
    },
    riskCalculationHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    riskScenarioControl: {
      findMany: jest.fn(),
    },
    riskScenarioAsset: {
      findMany: jest.fn(),
    },
    riskScenarioVendor: {
      findMany: jest.fn(),
    },
    riskAlert: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventBusService = {
    emitScenarioCalculated: jest.fn(),
  };

  const mockToleranceEngineService = {
    evaluateRisk: jest.fn(),
  };

  beforeEach(async () => {
    // Reset transaction mock to execute callback
    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      return callback({
        riskScenario: {
          update: jest.fn().mockResolvedValue({}),
        },
        riskCalculationHistory: {
          create: jest.fn().mockResolvedValue({}),
        },
      });
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskCalculationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RiskEventBusService,
          useValue: mockEventBusService,
        },
        {
          provide: ToleranceEngineService,
          useValue: mockToleranceEngineService,
        },
      ],
    }).compile();

    service = module.get<RiskCalculationService>(RiskCalculationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateScenario', () => {
    const mockScenario = {
      id: 'scenario-1',
      riskId: 'risk-1',
      title: 'Test Scenario',
      status: 'DRAFT',
      likelihood: 'POSSIBLE',
      impact: 'MAJOR',
      risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
      assetLinks: [],
      vendorLinks: [],
      applicationLinks: [],
      controlLinks: [],
      residualScore: null,
    };

    it('should calculate inherent score as likelihood x impact', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        ...mockScenario,
        likelihood: 'LIKELY',   // value 4
        impact: 'MAJOR',        // value 4
      });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL', undefined, 'user-1');

      expect(result.likelihood).toBeGreaterThanOrEqual(1);
      expect(result.likelihood).toBeLessThanOrEqual(5);
      expect(result.impact).toBeGreaterThanOrEqual(1);
      expect(result.impact).toBeLessThanOrEqual(5);
      expect(result.inherentScore).toBe(result.likelihood * result.impact);
    });

    it('should calculate residual score with control effectiveness applied', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        ...mockScenario,
        likelihood: 'LIKELY',
        impact: 'MAJOR',
        controlLinks: [
          {
            controlId: 'control-1',
            effectivenessWeight: 100,
            control: {
              id: 'control-1',
              name: 'Test Control',
              effectivenessScore: 80,
              layers: [],
            },
          },
        ],
      });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL', undefined, 'user-1');

      // Residual should be <= inherent due to control effectiveness
      expect(result.residualScore).toBeLessThanOrEqual(result.inherentScore);
      expect(result.residualScore).toBeGreaterThanOrEqual(1);
    });

    it('should throw error for non-existent scenario', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(null);

      await expect(
        service.calculateScenario('non-existent', 'MANUAL')
      ).rejects.toThrow('Scenario not found');
    });

    it('should emit scenario calculated event after successful calculation', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        ...mockScenario,
        likelihood: 'POSSIBLE',
        impact: 'MODERATE',
      });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      await service.calculateScenario('scenario-1', 'MANUAL', undefined, 'user-1');

      expect(mockEventBusService.emitScenarioCalculated).toHaveBeenCalledWith(
        'risk-1',
        'scenario-1',
        expect.objectContaining({
          residualScore: expect.any(Number),
          zone: expect.any(String),
        }),
        'MANUAL',
        'user-1'
      );
    });

    it('should use atomic transaction for updates', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        ...mockScenario,
        likelihood: 'POSSIBLE',
        impact: 'MODERATE',
      });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      await service.calculateScenario('scenario-1', 'MANUAL');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getCalculationHistory', () => {
    it('should return calculation history ordered by date descending', async () => {
      const mockHistory = [
        {
          id: 'calc-3',
          scenarioId: 'scenario-1',
          calculatedAt: new Date('2024-01-03'),
          trigger: 'MANUAL',
          residualScore: 15,
          calculatedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        },
        {
          id: 'calc-2',
          scenarioId: 'scenario-1',
          calculatedAt: new Date('2024-01-02'),
          trigger: 'CONTROL_TESTED',
          residualScore: 12,
          calculatedBy: null,
        },
        {
          id: 'calc-1',
          scenarioId: 'scenario-1',
          calculatedAt: new Date('2024-01-01'),
          trigger: 'MANUAL',
          residualScore: 18,
          calculatedBy: { id: 'user-2', firstName: 'Jane', lastName: 'Smith' },
        },
      ];

      mockPrismaService.riskCalculationHistory.findMany.mockResolvedValue(mockHistory);

      const result = await service.getCalculationHistory('scenario-1', 10);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('calc-3'); // Most recent first
      expect(mockPrismaService.riskCalculationHistory.findMany).toHaveBeenCalledWith({
        where: { scenarioId: 'scenario-1' },
        orderBy: { calculatedAt: 'desc' },
        take: 10,
        include: {
          calculatedBy: expect.any(Object),
        },
      });
    });
  });

  describe('recalculateForControl', () => {
    it('should recalculate all scenarios linked to control', async () => {
      const mockScenarioLinks = [
        { scenarioId: 'scenario-1' },
        { scenarioId: 'scenario-2' },
        { scenarioId: 'scenario-3' },
      ];

      mockPrismaService.riskScenarioControl.findMany.mockResolvedValue(mockScenarioLinks);

      // Mock each scenario calculation
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        riskId: 'risk-1',
        title: 'Test Scenario',
        likelihood: 'POSSIBLE',
        impact: 'MODERATE',
        risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
        assetLinks: [],
        vendorLinks: [],
        applicationLinks: [],
        controlLinks: [],
        residualScore: null,
      });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      await service.recalculateForControl('control-1', 'user-1');

      expect(mockPrismaService.riskScenarioControl.findMany).toHaveBeenCalledWith({
        where: { controlId: 'control-1' },
        select: { scenarioId: true },
      });

      // Should trigger calculation for each linked scenario
      expect(mockPrismaService.riskScenario.findUnique).toHaveBeenCalledTimes(3);
    });
  });

  describe('calculateRisk', () => {
    it('should calculate all scenarios for a risk and update risk with highest score', async () => {
      const mockScenarios = [
        { id: 'scenario-1' },
        { id: 'scenario-2' },
      ];

      mockPrismaService.riskScenario.findMany.mockResolvedValue(mockScenarios);

      // Mock different scores for different scenarios
      mockPrismaService.riskScenario.findUnique
        .mockResolvedValueOnce({
          id: 'scenario-1',
          riskId: 'risk-1',
          title: 'Low Risk Scenario',
          likelihood: 'UNLIKELY',
          impact: 'MINOR',
          risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
          assetLinks: [],
          vendorLinks: [],
          applicationLinks: [],
          controlLinks: [],
          residualScore: 4,
        })
        .mockResolvedValueOnce({
          id: 'scenario-2',
          riskId: 'risk-1',
          title: 'High Risk Scenario',
          likelihood: 'ALMOST_CERTAIN',
          impact: 'CATASTROPHIC',
          risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
          assetLinks: [],
          vendorLinks: [],
          applicationLinks: [],
          controlLinks: [],
          residualScore: 25,
        });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);
      mockPrismaService.risk.update.mockResolvedValue({});
      mockToleranceEngineService.evaluateRisk.mockResolvedValue(undefined);

      const result = await service.calculateRisk('risk-1', 'MANUAL', 'user-1');

      expect(result.riskId).toBe('risk-1');
      expect(result.scenariosCalculated).toBe(2);
      expect(result.highestResidualScore).toBeGreaterThan(0);
      expect(result.results).toHaveLength(2);

      // Risk should be updated with highest score
      expect(mockPrismaService.risk.update).toHaveBeenCalledWith({
        where: { id: 'risk-1' },
        data: {
          residualScore: result.highestResidualScore,
          updatedAt: expect.any(Date),
        },
      });

      // Tolerance should be re-evaluated
      expect(mockToleranceEngineService.evaluateRisk).toHaveBeenCalledWith('risk-1', 'user-1');
    });
  });
});
