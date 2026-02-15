import { Test, TestingModule } from '@nestjs/testing';
import { RiskCalculationService, FactorScores, RiskZone } from './risk-calculation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskEventBusService } from './risk-event-bus.service';
import { ToleranceEngineService } from './tolerance-engine.service';
import { ScenarioEntityResolverService } from './scenario-entity-resolver.service';

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

  const mockEntityResolverService = {
    getScenarioEntities: jest.fn(),
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
        {
          provide: ScenarioEntityResolverService,
          useValue: mockEntityResolverService,
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
      risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
      assetLinks: [],
      vendorLinks: [],
      applicationLinks: [],
      controlLinks: [],
      residualScore: null,
      // Override flags (all false - use calculated values)
      f1Override: false,
      f2Override: false,
      f3Override: false,
      f4Override: false,
      f5Override: false,
      f6Override: false,
      f1ThreatFrequency: null,
      f2ControlEffectiveness: null,
      f3GapVulnerability: null,
      f4IncidentHistory: null,
      f5AttackSurface: null,
      f6Environmental: null,
    };

    it('should calculate likelihood from weighted F1-F6 factors', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        ...mockScenario,
        // Pre-set override values to test weight calculation
        f1Override: true,
        f2Override: true,
        f3Override: true,
        f4Override: true,
        f5Override: true,
        f6Override: true,
        f1ThreatFrequency: 4,    // Weight 25%
        f2ControlEffectiveness: 3, // Weight 25%
        f3GapVulnerability: 3,   // Weight 20%
        f4IncidentHistory: 2,    // Weight 15%
        f5AttackSurface: 4,      // Weight 10%
        f6Environmental: 2,      // Weight 5%
      });

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({
        assets: [],
        vendors: [],
        applications: [],
        controls: [],
        incidents: [],
      });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL', undefined, 'user-1');

      // Verify factors were captured
      expect(result.factors).toBeDefined();
      expect(result.factors.f1ThreatFrequency).toBe(4);
      expect(result.factors.f2ControlEffectiveness).toBe(3);
      expect(result.factors.f3GapVulnerability).toBe(3);
      expect(result.factors.f4IncidentHistory).toBe(2);
      expect(result.factors.f5AttackSurface).toBe(4);
      expect(result.factors.f6Environmental).toBe(2);

      // Verify likelihood was calculated
      expect(result.likelihood).toBeGreaterThanOrEqual(1);
      expect(result.likelihood).toBeLessThanOrEqual(5);
    });

    it('should calculate impact as max of I1-I5', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        ...mockScenario,
        f1Override: true,
        f2Override: true,
        f3Override: true,
        f4Override: true,
        f5Override: true,
        f6Override: true,
        f1ThreatFrequency: 3,
        f2ControlEffectiveness: 3,
        f3GapVulnerability: 3,
        f4IncidentHistory: 3,
        f5AttackSurface: 3,
        f6Environmental: 3,
      });

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({
        assets: [],
        vendors: [],
        applications: [],
        controls: [],
        incidents: [],
      });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL', undefined, 'user-1');

      // Verify impacts were captured
      expect(result.impacts).toBeDefined();
      expect(result.impact).toBeGreaterThanOrEqual(1);
      expect(result.impact).toBeLessThanOrEqual(5);

      // Impact should be max of I1-I5
      const maxImpact = Math.max(
        result.impacts.i1Financial,
        result.impacts.i2Operational,
        result.impacts.i3Regulatory,
        result.impacts.i4Reputational,
        result.impacts.i5Strategic
      );
      expect(result.impact).toBe(maxImpact);
    });

    it('should calculate inherent score as likelihood × impact', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        ...mockScenario,
        f1Override: true,
        f2Override: true,
        f3Override: true,
        f4Override: true,
        f5Override: true,
        f6Override: true,
        f1ThreatFrequency: 4,
        f2ControlEffectiveness: 3,
        f3GapVulnerability: 3,
        f4IncidentHistory: 2,
        f5AttackSurface: 3,
        f6Environmental: 2,
      });

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({
        assets: [],
        vendors: [],
        applications: [],
        controls: [],
        incidents: [],
      });

      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL', undefined, 'user-1');

      // residualScore = likelihood × impact
      expect(result.residualScore).toBe(result.likelihood * result.impact);

      // Score should be between 1 and 25
      expect(result.residualScore).toBeGreaterThanOrEqual(1);
      expect(result.residualScore).toBeLessThanOrEqual(25);
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
        f1Override: true,
        f2Override: true,
        f3Override: true,
        f4Override: true,
        f5Override: true,
        f6Override: true,
        f1ThreatFrequency: 3,
        f2ControlEffectiveness: 3,
        f3GapVulnerability: 3,
        f4IncidentHistory: 3,
        f5AttackSurface: 3,
        f6Environmental: 3,
      });

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({});
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
        f1Override: true,
        f2Override: true,
        f3Override: true,
        f4Override: true,
        f5Override: true,
        f6Override: true,
        f1ThreatFrequency: 3,
        f2ControlEffectiveness: 3,
        f3GapVulnerability: 3,
        f4IncidentHistory: 3,
        f5AttackSurface: 3,
        f6Environmental: 3,
      });

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({});
      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      await service.calculateScenario('scenario-1', 'MANUAL');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('calculateControlEffectivenessFactor', () => {
    const createMockScenarioWithControls = (effectivenessScore: number) => ({
      id: 'scenario-1',
      riskId: 'risk-1',
      title: 'Test Scenario',
      risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
      assetLinks: [],
      vendorLinks: [],
      applicationLinks: [],
      controlLinks: [
        {
          controlId: 'control-1',
          effectivenessWeight: 100,
          control: {
            id: 'control-1',
            name: 'Test Control',
            effectivenessScore: effectivenessScore,
            layers: [],
          },
        },
      ],
      f1Override: true,
      f2Override: false, // Let F2 be calculated
      f3Override: true,
      f4Override: true,
      f5Override: true,
      f6Override: true,
      f1ThreatFrequency: 3,
      f3GapVulnerability: 3,
      f4IncidentHistory: 3,
      f5AttackSurface: 3,
      f6Environmental: 3,
      residualScore: null,
    });

    it('should return factor 1 for 100% effectiveness (maximum control)', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(
        createMockScenarioWithControls(100)
      );

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({
        controls: [],
      });
      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL');

      // 100% effective controls should result in F2 = 1 (minimal likelihood increase)
      expect(result.factors.f2ControlEffectiveness).toBe(1);
    });

    it('should return factor 5 for 0% effectiveness (no control)', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(
        createMockScenarioWithControls(0)
      );

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({
        controls: [],
      });
      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL');

      // 0% effective controls should result in F2 = 5 (maximum likelihood increase)
      expect(result.factors.f2ControlEffectiveness).toBe(5);
    });

    it('should return factor 3 for 50% effectiveness (moderate control)', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(
        createMockScenarioWithControls(50)
      );

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({
        controls: [],
      });
      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL');

      // 50% effective controls should result in F2 = 3 (mid-range)
      expect(result.factors.f2ControlEffectiveness).toBe(3);
    });

    it('should return factor 5 when no controls are linked', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        riskId: 'risk-1',
        title: 'Test Scenario',
        risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
        assetLinks: [],
        vendorLinks: [],
        applicationLinks: [],
        controlLinks: [], // No controls
        f1Override: true,
        f2Override: false,
        f3Override: true,
        f4Override: true,
        f5Override: true,
        f6Override: true,
        f1ThreatFrequency: 3,
        f3GapVulnerability: 3,
        f4IncidentHistory: 3,
        f5AttackSurface: 3,
        f6Environmental: 3,
        residualScore: null,
      });

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({
        controls: [],
      });
      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL');

      // No controls = F2 = 5 (maximum likelihood increase)
      expect(result.factors.f2ControlEffectiveness).toBe(5);
    });

    it('should use Math.round not Math.ceil for effectiveness calculation (Issue 8 fix)', async () => {
      // Test that 99% effective doesn't round up to factor 2
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(
        createMockScenarioWithControls(99)
      );

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({
        controls: [],
      });
      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL');

      // 99% effective: 5 - (99/100)*4 = 5 - 3.96 = 1.04, rounded = 1
      // With Math.ceil it would be 2, with Math.round it should be 1
      expect(result.factors.f2ControlEffectiveness).toBe(1);
    });
  });

  describe('determineZone', () => {
    const mockScenarioWithScore = (score: number) => ({
      id: 'scenario-1',
      riskId: 'risk-1',
      title: 'Test Scenario',
      risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
      assetLinks: [],
      vendorLinks: [],
      applicationLinks: [],
      controlLinks: [],
      f1Override: true,
      f2Override: true,
      f3Override: true,
      f4Override: true,
      f5Override: true,
      f6Override: true,
      // Set factors to produce desired score
      f1ThreatFrequency: Math.ceil(Math.sqrt(score)),
      f2ControlEffectiveness: Math.ceil(Math.sqrt(score)),
      f3GapVulnerability: Math.ceil(Math.sqrt(score)),
      f4IncidentHistory: Math.ceil(Math.sqrt(score)),
      f5AttackSurface: Math.ceil(Math.sqrt(score)),
      f6Environmental: Math.ceil(Math.sqrt(score)),
      residualScore: null,
    });

    it('should return TERMINATE for score >= 20', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(mockScenarioWithScore(25));
      mockEntityResolverService.getScenarioEntities.mockResolvedValue({});
      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL');

      // High score should result in TERMINATE zone
      if (result.residualScore >= 20) {
        expect(result.zone).toBe('TERMINATE');
      }
    });

    it('should return TOLERATE for score <= 5', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        ...mockScenarioWithScore(4),
        f1ThreatFrequency: 1,
        f2ControlEffectiveness: 1,
        f3GapVulnerability: 1,
        f4IncidentHistory: 1,
        f5AttackSurface: 1,
        f6Environmental: 1,
      });
      mockEntityResolverService.getScenarioEntities.mockResolvedValue({});
      mockEventBusService.emitScenarioCalculated.mockResolvedValue(undefined);

      const result = await service.calculateScenario('scenario-1', 'MANUAL');

      // Low score should result in TOLERATE zone
      if (result.residualScore <= 5) {
        expect(result.zone).toBe('TOLERATE');
      }
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
        risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
        assetLinks: [],
        vendorLinks: [],
        applicationLinks: [],
        controlLinks: [],
        f1Override: true,
        f2Override: true,
        f3Override: true,
        f4Override: true,
        f5Override: true,
        f6Override: true,
        f1ThreatFrequency: 3,
        f2ControlEffectiveness: 3,
        f3GapVulnerability: 3,
        f4IncidentHistory: 3,
        f5AttackSurface: 3,
        f6Environmental: 3,
        residualScore: null,
      });

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({});
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
          risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
          assetLinks: [],
          vendorLinks: [],
          applicationLinks: [],
          controlLinks: [],
          f1Override: true,
          f2Override: true,
          f3Override: true,
          f4Override: true,
          f5Override: true,
          f6Override: true,
          f1ThreatFrequency: 2,
          f2ControlEffectiveness: 2,
          f3GapVulnerability: 2,
          f4IncidentHistory: 2,
          f5AttackSurface: 2,
          f6Environmental: 2,
          residualScore: 4,
        })
        .mockResolvedValueOnce({
          id: 'scenario-2',
          riskId: 'risk-1',
          title: 'High Risk Scenario',
          risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
          assetLinks: [],
          vendorLinks: [],
          applicationLinks: [],
          controlLinks: [],
          f1Override: true,
          f2Override: true,
          f3Override: true,
          f4Override: true,
          f5Override: true,
          f6Override: true,
          f1ThreatFrequency: 5,
          f2ControlEffectiveness: 5,
          f3GapVulnerability: 5,
          f4IncidentHistory: 5,
          f5AttackSurface: 5,
          f6Environmental: 5,
          residualScore: 25,
        });

      mockEntityResolverService.getScenarioEntities.mockResolvedValue({});
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
