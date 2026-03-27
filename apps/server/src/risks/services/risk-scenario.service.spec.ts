import { Test, TestingModule } from '@nestjs/testing';
import { RiskScenarioService } from './risk-scenario.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RiskService } from './risk.service';
import { ControlRiskIntegrationService } from './control-risk-integration.service';
import { RiskCalculationService } from './risk-calculation.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

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
    $transaction: jest.fn(),
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
    mockPrismaService.$transaction.mockImplementation(async (callback: (tx: typeof mockPrismaService) => unknown) =>
      callback(mockPrismaService),
    );

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
        likelihood: 'POSSIBLE',
        impact: 'MAJOR',
        inherentScore: 12,
        residualScore: 8,
        risk: { id: 'risk-1', riskId: 'R-01', title: 'Test Risk' },
        treatmentPlans: [],
        stateHistory: [],
      };

      mockPrismaService.riskScenario.findUnique.mockResolvedValue(mockScenario);

      const result = await service.findOne('test-id');

      expect(result).toBeDefined();
      expect(result?.status).toBe('DRAFT');
      expect(result?.toleranceStatus).toBe('WITHIN');
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
