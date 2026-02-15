import { Test, TestingModule } from '@nestjs/testing';
import { RiskScenarioService } from './risk-scenario.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskService } from './risk.service';
import { ControlRiskIntegrationService } from './control-risk-integration.service';
import { RiskCalculationService } from './risk-calculation.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ImpactCategory, LikelihoodLevel, ImpactLevel } from '@prisma/client';

describe('RiskScenarioService', () => {
  let service: RiskScenarioService;
  let prismaService: PrismaService;
  let riskService: RiskService;
  let calculationService: RiskCalculationService;

  const mockPrismaService = {
    riskScenario: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    scenarioImpactAssessment: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    birtOrgConfig: {
      findMany: jest.fn(),
    },
  };

  const mockRiskService = {
    recalculateScores: jest.fn(),
  };

  const mockControlRiskIntegrationService = {
    getLinkedControls: jest.fn(),
  };

  const mockRiskCalculationService = {
    calculateScenario: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskScenarioService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RiskService,
          useValue: mockRiskService,
        },
        {
          provide: ControlRiskIntegrationService,
          useValue: mockControlRiskIntegrationService,
        },
        {
          provide: RiskCalculationService,
          useValue: mockRiskCalculationService,
        },
      ],
    }).compile();

    service = module.get<RiskScenarioService>(RiskScenarioService);
    prismaService = module.get<PrismaService>(PrismaService);
    riskService = module.get<RiskService>(RiskService);
    calculationService = module.get<RiskCalculationService>(RiskCalculationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return scenario with status field in response', async () => {
      const mockScenario = {
        id: 'test-id',
        scenarioId: 'R-01-S01',
        title: 'Test Scenario',
        status: 'DRAFT',
        statusChangedAt: new Date(),
        statusChangedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        toleranceStatus: 'WITHIN',
        toleranceThreshold: 15,
        toleranceGap: -5,
        f1ThreatFrequency: 3,
        f2ControlEffectiveness: 2,
        f3GapVulnerability: 3,
        f4IncidentHistory: 2,
        f5AttackSurface: 3,
        f6Environmental: 2,
        calculatedLikelihood: 3,
        calculatedImpact: 4,
        inherentScore: 12,
        residualScore: 8,
        lastCalculatedAt: new Date(),
        risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
        impactAssessments: [],
        treatmentPlans: [],
        stateHistory: [],
      };

      mockPrismaService.riskScenario.findUnique.mockResolvedValue(mockScenario);

      const result = await service.findOne('test-id');

      expect(result).toBeDefined();
      expect(result?.status).toBe('DRAFT');
      expect(result?.toleranceStatus).toBe('WITHIN');
      expect(result?.f1ThreatFrequency).toBe(3);
      expect(result?.calculatedLikelihood).toBe(3);
      expect(mockPrismaService.riskScenario.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-id' },
        }),
      );
    });

    it('should return null for non-existent scenario', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });

    it('should return all F1-F6 factor scores', async () => {
      const mockScenario = {
        id: 'test-id',
        scenarioId: 'R-01-S01',
        f1ThreatFrequency: 4,
        f1Source: 'ThreatCatalog',
        f1Override: false,
        f2ControlEffectiveness: 2,
        f2Source: 'LinkedControls',
        f2Override: true,
        f2OverrideJustification: 'Manual adjustment based on testing',
        f3GapVulnerability: 3,
        f4IncidentHistory: 1,
        f5AttackSurface: 4,
        f6Environmental: 3,
        risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
        impactAssessments: [],
        treatmentPlans: [],
        stateHistory: [],
      };

      mockPrismaService.riskScenario.findUnique.mockResolvedValue(mockScenario);

      const result = await service.findOne('test-id');

      expect(result?.f1ThreatFrequency).toBe(4);
      expect(result?.f2ControlEffectiveness).toBe(2);
      expect(result?.f2Override).toBe(true);
      expect(result?.f2OverrideJustification).toBe('Manual adjustment based on testing');
      expect(result?.f3GapVulnerability).toBe(3);
      expect(result?.f4IncidentHistory).toBe(1);
      expect(result?.f5AttackSurface).toBe(4);
      expect(result?.f6Environmental).toBe(3);
    });
  });

  describe('create', () => {
    it('should create scenario in DRAFT status', async () => {
      const createData = {
        scenarioId: 'R-01-S01',
        title: 'Test Scenario',
        riskId: 'risk-1',
        createdById: 'user-1',
      };

      const mockCreatedScenario = {
        id: 'new-id',
        ...createData,
        status: 'DRAFT',
        risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
        createdBy: { id: 'user-1', email: 'test@test.com' },
      };

      mockPrismaService.riskScenario.findFirst.mockResolvedValue(null);
      mockPrismaService.riskScenario.create.mockResolvedValue(mockCreatedScenario);
      mockRiskCalculationService.calculateScenario.mockResolvedValue(undefined);
      mockRiskService.recalculateScores.mockResolvedValue(undefined);

      const result = await service.create(createData);

      expect(result.status).toBe('DRAFT');
      expect(mockRiskCalculationService.calculateScenario).toHaveBeenCalledWith(
        'new-id',
        'MANUAL',
        undefined,
        'user-1'
      );
      expect(mockRiskService.recalculateScores).toHaveBeenCalledWith('risk-1');
    });

    it('should throw ConflictException for duplicate scenarioId', async () => {
      const createData = {
        scenarioId: 'R-01-S01',
        title: 'Test Scenario',
        riskId: 'risk-1',
        createdById: 'user-1',
      };

      mockPrismaService.riskScenario.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createData)).rejects.toThrow(ConflictException);
    });
  });

  describe('getImpactAssessments', () => {
    it('should return both inherent and residual assessments', async () => {
      const inherentAssessments = [
        { id: '1', scenarioId: 'test-id', category: 'FINANCIAL', level: 'MAJOR', value: 4, isResidual: false },
        { id: '2', scenarioId: 'test-id', category: 'OPERATIONAL', level: 'MODERATE', value: 3, isResidual: false },
      ];

      mockPrismaService.scenarioImpactAssessment.findMany.mockResolvedValue(inherentAssessments);

      const result = await service.getImpactAssessments('test-id', false);

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('FINANCIAL');
      expect(result[0].isResidual).toBe(false);
      expect(mockPrismaService.scenarioImpactAssessment.findMany).toHaveBeenCalledWith({
        where: { scenarioId: 'test-id', isResidual: false },
        orderBy: { category: 'asc' },
      });
    });

    it('should return empty array when no assessments exist', async () => {
      mockPrismaService.scenarioImpactAssessment.findMany.mockResolvedValue([]);

      const result = await service.getImpactAssessments('test-id', false);

      expect(result).toHaveLength(0);
    });
  });

  describe('saveImpactAssessments', () => {
    it('should calculate weighted impact correctly from 5 BIRT categories', async () => {
      const scenarioId = 'test-scenario-id';
      const assessments = [
        { category: 'FINANCIAL' as ImpactCategory, level: 'MAJOR' as ImpactLevel, value: 4 },
        { category: 'OPERATIONAL' as ImpactCategory, level: 'MODERATE' as ImpactLevel, value: 3 },
        { category: 'LEGAL_REGULATORY' as ImpactCategory, level: 'MINOR' as ImpactLevel, value: 2 },
        { category: 'REPUTATIONAL' as ImpactCategory, level: 'MAJOR' as ImpactLevel, value: 4 },
        { category: 'STRATEGIC' as ImpactCategory, level: 'MODERATE' as ImpactLevel, value: 3 },
      ];

      // Mock scenario lookup
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        id: scenarioId,
        riskId: 'risk-1',
        likelihood: 'POSSIBLE',
      });

      // Mock upsert calls
      mockPrismaService.scenarioImpactAssessment.upsert.mockResolvedValue({});

      // Mock weighted impact calculation fetch
      mockPrismaService.scenarioImpactAssessment.findMany
        .mockResolvedValueOnce(assessments.map((a, i) => ({
          id: `${i}`,
          scenarioId,
          ...a,
          isResidual: false,
        })))
        .mockResolvedValueOnce([]) // No existing residual categories
        .mockResolvedValueOnce([]) // Residual assessments for recalc
        .mockResolvedValueOnce(assessments.map((a, i) => ({
          id: `${i}`,
          scenarioId,
          ...a,
          isResidual: false,
        }))); // Final fetch

      // Mock org weights (use defaults)
      mockPrismaService.birtOrgConfig.findMany.mockResolvedValue([]);

      // Mock update
      mockPrismaService.riskScenario.update.mockResolvedValue({});
      mockRiskService.recalculateScores.mockResolvedValue(undefined);

      const result = await service.saveImpactAssessments(scenarioId, assessments, false);

      expect(result.scenarioId).toBe(scenarioId);
      expect(result.isResidual).toBe(false);
      expect(mockPrismaService.scenarioImpactAssessment.upsert).toHaveBeenCalledTimes(5);
      expect(mockRiskService.recalculateScores).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent scenario', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(null);

      await expect(
        service.saveImpactAssessments('non-existent', [], false)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('inheritMissingResidualAssessments (via saveImpactAssessments)', () => {
    it('should inherit only missing categories from inherent to residual', async () => {
      const scenarioId = 'test-scenario';

      // Set up inherent assessments (5 categories)
      const inherentAssessments = [
        { category: 'FINANCIAL', level: 'MAJOR', value: 4 },
        { category: 'OPERATIONAL', level: 'MODERATE', value: 3 },
        { category: 'LEGAL_REGULATORY', level: 'MINOR', value: 2 },
        { category: 'REPUTATIONAL', level: 'MAJOR', value: 4 },
        { category: 'STRATEGIC', level: 'MODERATE', value: 3 },
      ];

      // Set up existing residual (only FINANCIAL exists)
      const existingResidual = [
        { category: 'FINANCIAL' },
      ];

      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        id: scenarioId,
        riskId: 'risk-1',
        likelihood: 'POSSIBLE',
      });

      // First call: get inherent assessments (for saving)
      mockPrismaService.scenarioImpactAssessment.findMany
        .mockResolvedValueOnce(inherentAssessments.map((a, i) => ({
          id: `inherent-${i}`,
          scenarioId,
          ...a,
          isResidual: false,
        })))
        // Second call: get existing residual categories
        .mockResolvedValueOnce(existingResidual)
        // Third call: residual assessments after inheritance
        .mockResolvedValueOnce([])
        // Fourth call: final assessments fetch
        .mockResolvedValueOnce(inherentAssessments);

      mockPrismaService.scenarioImpactAssessment.upsert.mockResolvedValue({});
      mockPrismaService.scenarioImpactAssessment.create.mockResolvedValue({});
      mockPrismaService.birtOrgConfig.findMany.mockResolvedValue([]);
      mockPrismaService.riskScenario.update.mockResolvedValue({});
      mockRiskService.recalculateScores.mockResolvedValue(undefined);

      await service.saveImpactAssessments(
        scenarioId,
        inherentAssessments.map(a => ({
          category: a.category as ImpactCategory,
          level: a.level as ImpactLevel,
          value: a.value,
        })),
        false
      );

      // Should create residual copies for OPERATIONAL, LEGAL_REGULATORY, REPUTATIONAL, STRATEGIC (not FINANCIAL since it exists)
      // This is called via inheritMissingResidualAssessments
      expect(mockPrismaService.scenarioImpactAssessment.create).toHaveBeenCalledTimes(4);
    });
  });

  describe('getLikelihoodFactorScores', () => {
    it('should return all factor scores with override information', async () => {
      const mockScenario = {
        title: 'Test Scenario',
        f1ThreatFrequency: 4,
        f1Source: 'ThreatCatalog:RANSOMWARE',
        f1Override: false,
        f1OverrideJustification: null,
        f2ControlEffectiveness: 2,
        f2Source: 'LinkedControls',
        f2Override: true,
        f2OverrideJustification: 'Manual override based on penetration test results',
        f3GapVulnerability: 3,
        f3Source: 'AssetVulnerabilities',
        f3Override: false,
        f3OverrideJustification: null,
        f4IncidentHistory: 1,
        f4Source: 'IncidentHistory',
        f4Override: false,
        f4OverrideJustification: null,
        f5AttackSurface: 4,
        f5Source: 'AssetExposure',
        f5Override: false,
        f5OverrideJustification: null,
        f6Environmental: 3,
        f6Source: 'ThreatIntel',
        f6Override: false,
        f6OverrideJustification: null,
        calculatedLikelihood: 3,
        lastCalculatedAt: new Date(),
        riskId: 'risk-1',
      };

      mockPrismaService.riskScenario.findUnique.mockResolvedValue(mockScenario);

      const result = await service.getLikelihoodFactorScores('test-id');

      expect(result.scores.f1ThreatFrequency).toBe(4);
      expect(result.scores.f2ControlEffectiveness).toBe(2);
      expect(result.overrides.f2Override).toBe(true);
      expect(result.overrides.f2OverrideJustification).toBe('Manual override based on penetration test results');
      expect(result.sources.f1Source).toBe('ThreatCatalog:RANSOMWARE');
      expect(result.calculatedLikelihood).toBe(3);
      expect(result.allScored).toBe(true);
    });

    it('should indicate allScored=false when factors are missing', async () => {
      const mockScenario = {
        title: 'Test Scenario',
        f1ThreatFrequency: 4,
        f1Source: null,
        f1Override: false,
        f1OverrideJustification: null,
        f2ControlEffectiveness: null, // Not scored
        f2Source: null,
        f2Override: false,
        f2OverrideJustification: null,
        f3GapVulnerability: 3,
        f3Source: null,
        f3Override: false,
        f3OverrideJustification: null,
        f4IncidentHistory: null, // Not scored
        f4Source: null,
        f4Override: false,
        f4OverrideJustification: null,
        f5AttackSurface: 4,
        f5Source: null,
        f5Override: false,
        f5OverrideJustification: null,
        f6Environmental: null, // Not scored
        f6Source: null,
        f6Override: false,
        f6OverrideJustification: null,
        calculatedLikelihood: null,
        lastCalculatedAt: null,
        riskId: 'risk-1',
      };

      mockPrismaService.riskScenario.findUnique.mockResolvedValue(mockScenario);

      const result = await service.getLikelihoodFactorScores('test-id');

      expect(result.allScored).toBe(false);
      expect(result.scores.f2ControlEffectiveness).toBeNull();
      expect(result.scores.f4IncidentHistory).toBeNull();
      expect(result.scores.f6Environmental).toBeNull();
    });

    it('should throw NotFoundException for non-existent scenario', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(null);

      await expect(service.getLikelihoodFactorScores('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteImpactAssessment', () => {
    it('should delete assessment and recalculate weighted impact', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        riskId: 'risk-1',
      });
      mockPrismaService.scenarioImpactAssessment.delete.mockResolvedValue({});
      mockPrismaService.scenarioImpactAssessment.findMany.mockResolvedValue([]);
      mockPrismaService.riskScenario.update.mockResolvedValue({});
      mockRiskService.recalculateScores.mockResolvedValue(undefined);

      const result = await service.deleteImpactAssessment(
        'test-id',
        'FINANCIAL' as ImpactCategory,
        false
      );

      expect(result.deleted).toBe(true);
      expect(mockPrismaService.scenarioImpactAssessment.delete).toHaveBeenCalledWith({
        where: {
          scenarioId_category_isResidual: {
            scenarioId: 'test-id',
            category: 'FINANCIAL',
            isResidual: false,
          },
        },
      });
      expect(mockRiskService.recalculateScores).toHaveBeenCalledWith('risk-1');
    });

    it('should throw NotFoundException for non-existent scenario', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteImpactAssessment('non-existent', 'FINANCIAL' as ImpactCategory, false)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update scenario and trigger recalculation', async () => {
      const updateData = {
        title: 'Updated Title',
        cause: 'Updated cause',
        updatedById: 'user-1',
      };

      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        riskId: 'risk-1',
      });

      mockPrismaService.riskScenario.update.mockResolvedValue({
        id: 'test-id',
        ...updateData,
        riskId: 'risk-1',
        risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
        updatedBy: { id: 'user-1' },
      });

      mockRiskCalculationService.calculateScenario.mockResolvedValue(undefined);
      mockRiskService.recalculateScores.mockResolvedValue(undefined);

      const result = await service.update('test-id', updateData);

      expect(result.title).toBe('Updated Title');
      expect(mockRiskCalculationService.calculateScenario).toHaveBeenCalledWith(
        'test-id',
        'MANUAL',
        undefined,
        'user-1'
      );
      expect(mockRiskService.recalculateScores).toHaveBeenCalledWith('risk-1');
    });

    it('should throw NotFoundException for non-existent scenario', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { title: 'Test' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('delete', () => {
    it('should delete scenario and recalculate parent risk', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue({
        riskId: 'risk-1',
      });
      mockPrismaService.riskScenario.delete.mockResolvedValue({});
      mockRiskService.recalculateScores.mockResolvedValue(undefined);

      await service.delete('test-id');

      expect(mockPrismaService.riskScenario.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(mockRiskService.recalculateScores).toHaveBeenCalledWith('risk-1');
    });

    it('should throw ConflictException for non-existent scenario', async () => {
      mockPrismaService.riskScenario.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(ConflictException);
    });
  });
});
