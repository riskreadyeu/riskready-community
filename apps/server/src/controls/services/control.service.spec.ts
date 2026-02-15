import { Test, TestingModule } from '@nestjs/testing';
import { ControlService } from './control.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ControlService', () => {
  let service: ControlService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    control: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    controlLayer: {
      findMany: jest.fn(),
    },
    assessmentTest: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ControlService>(ControlService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateControlEffectiveness', () => {
    it('should calculate effectiveness score correctly with all PASS results', async () => {
      const controlId = 'test-control-id';
      const mockLayers = [
        { controlId, tests: [{ id: 't1' }, { id: 't2' }] },
        { controlId, tests: [{ id: 't3' }] },
      ];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        { layerTestId: 't1', result: 'PASS' },
        { layerTestId: 't2', result: 'PASS' },
        { layerTestId: 't3', result: 'PASS' },
      ]);

      const result = await service.calculateControlEffectiveness(controlId);

      expect(result.score).toBe(100);
      expect(result.rating).toBe('Effective');
      expect(result.passCount).toBe(3);
      expect(result.partialCount).toBe(0);
      expect(result.failCount).toBe(0);
      expect(result.notTestedCount).toBe(0);
      expect(result.totalLayers).toBe(2);
    });

    it('should calculate effectiveness score correctly with mixed results', async () => {
      const controlId = 'test-control-id';
      const mockLayers = [
        {
          controlId,
          tests: [{ id: 't1' }, { id: 't2' }, { id: 't3' }, { id: 't4' }],
        },
      ];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        { layerTestId: 't1', result: 'PASS' },
        { layerTestId: 't2', result: 'PARTIAL' },
        { layerTestId: 't3', result: 'FAIL' },
        // t4 has no assessment result (not tested)
      ]);

      const result = await service.calculateControlEffectiveness(controlId);

      // Score = (3 + 2 + 1) / (3 + 3 + 3 + 3) * 100 = 6/12 * 100 = 50
      expect(result.score).toBe(50);
      expect(result.rating).toBe('Not Effective');
      expect(result.passCount).toBe(1);
      expect(result.partialCount).toBe(1);
      expect(result.failCount).toBe(1);
      expect(result.notTestedCount).toBe(1);
      expect(result.totalLayers).toBe(1);
    });

    it('should calculate effectiveness score correctly with PARTIAL results', async () => {
      const controlId = 'test-control-id';
      const mockLayers = [
        {
          controlId,
          tests: [{ id: 't1' }, { id: 't2' }],
        },
      ];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        { layerTestId: 't1', result: 'PARTIAL' },
        { layerTestId: 't2', result: 'PARTIAL' },
      ]);

      const result = await service.calculateControlEffectiveness(controlId);

      // Score = (2 + 2) / (3 + 3) * 100 = 4/6 * 100 = 67 (rounded)
      // 67 < 70 threshold, so "Not Effective"
      expect(result.score).toBe(67);
      expect(result.rating).toBe('Not Effective');
      expect(result.passCount).toBe(0);
      expect(result.partialCount).toBe(2);
      expect(result.failCount).toBe(0);
    });

    it('should calculate effectiveness score correctly with all FAIL results', async () => {
      const controlId = 'test-control-id';
      const mockLayers = [
        {
          controlId,
          tests: [{ id: 't1' }, { id: 't2' }],
        },
      ];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        { layerTestId: 't1', result: 'FAIL' },
        { layerTestId: 't2', result: 'FAIL' },
      ]);

      const result = await service.calculateControlEffectiveness(controlId);

      // Score = (1 + 1) / (3 + 3) * 100 = 2/6 * 100 = 33 (rounded)
      expect(result.score).toBe(33);
      expect(result.rating).toBe('Not Effective');
      expect(result.passCount).toBe(0);
      expect(result.partialCount).toBe(0);
      expect(result.failCount).toBe(2);
    });

    it('should handle NOT_APPLICABLE results by excluding them from calculation', async () => {
      const controlId = 'test-control-id';
      const mockLayers = [
        {
          controlId,
          tests: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
        },
      ];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        { layerTestId: 't1', result: 'PASS' },
        { layerTestId: 't2', result: 'NOT_APPLICABLE' },
        { layerTestId: 't3', result: 'PASS' },
      ]);

      const result = await service.calculateControlEffectiveness(controlId);

      // Score = (3 + 3) / (3 + 3) * 100 = 100 (NOT_APPLICABLE excluded)
      expect(result.score).toBe(100);
      expect(result.rating).toBe('Effective');
      expect(result.passCount).toBe(2);
      expect(result.totalLayers).toBe(1);
    });

    it('should handle empty layers array', async () => {
      const controlId = 'test-control-id';
      mockPrismaService.controlLayer.findMany.mockResolvedValue([]);

      const result = await service.calculateControlEffectiveness(controlId);

      expect(result.score).toBe(0);
      expect(result.rating).toBe('Not Assessed');
      expect(result.totalLayers).toBe(0);
    });

    it('should handle layers with no assessment results', async () => {
      const controlId = 'test-control-id';
      const mockLayers = [
        {
          controlId,
          tests: [{ id: 't1' }, { id: 't2' }],
        },
      ];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([]);

      const result = await service.calculateControlEffectiveness(controlId);

      // Tests exist but none assessed, maxScore > 0 so rated "Not Effective"
      expect(result.score).toBe(0);
      expect(result.rating).toBe('Not Effective');
      expect(result.notTestedCount).toBe(2);
    });

    it('should correctly identify "Effective" rating (score >= 90)', async () => {
      const controlId = 'test-control-id';
      // 10 tests, 9 PASS, 1 PARTIAL = (9*3 + 1*2) / (10*3) * 100 = 29/30 * 100 = 97
      const testIds = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}` }));
      const mockLayers = [{ controlId, tests: testIds }];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        ...Array.from({ length: 9 }, (_, i) => ({ layerTestId: `t${i}`, result: 'PASS' })),
        { layerTestId: 't9', result: 'PARTIAL' },
      ]);

      const result = await service.calculateControlEffectiveness(controlId);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.rating).toBe('Effective');
    });

    it('should correctly identify "Partially Effective" rating (70 <= score < 90)', async () => {
      const controlId = 'test-control-id';
      // 10 tests, 6 PASS, 4 PARTIAL = (6*3 + 4*2) / (10*3) * 100 = 26/30 * 100 = 87
      const testIds = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}` }));
      const mockLayers = [{ controlId, tests: testIds }];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        ...Array.from({ length: 6 }, (_, i) => ({ layerTestId: `t${i}`, result: 'PASS' })),
        ...Array.from({ length: 4 }, (_, i) => ({ layerTestId: `t${i + 6}`, result: 'PARTIAL' })),
      ]);

      const result = await service.calculateControlEffectiveness(controlId);

      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.score).toBeLessThan(90);
      expect(result.rating).toBe('Partially Effective');
    });

    it('should correctly identify "Not Effective" rating (score < 70)', async () => {
      const controlId = 'test-control-id';
      // 10 tests, 3 PASS, 7 FAIL = (3*3 + 7*1) / (10*3) * 100 = 16/30 * 100 = 53
      const testIds = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}` }));
      const mockLayers = [{ controlId, tests: testIds }];

      mockPrismaService.controlLayer.findMany.mockResolvedValue(mockLayers);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        ...Array.from({ length: 3 }, (_, i) => ({ layerTestId: `t${i}`, result: 'PASS' })),
        ...Array.from({ length: 7 }, (_, i) => ({ layerTestId: `t${i + 3}`, result: 'FAIL' })),
      ]);

      const result = await service.calculateControlEffectiveness(controlId);

      expect(result.score).toBeLessThan(70);
      expect(result.rating).toBe('Not Effective');
    });
  });

  describe('findAll', () => {
    it('should batch effectiveness calculations for multiple controls', async () => {
      const controls = [
        { id: 'control-1' },
        { id: 'control-2' },
      ];

      mockPrismaService.control.findMany.mockResolvedValue(controls);
      mockPrismaService.control.count.mockResolvedValue(2);
      mockPrismaService.controlLayer.findMany.mockResolvedValue([
        { controlId: 'control-1', tests: [{ id: 't1' }] },
        { controlId: 'control-2', tests: [{ id: 't2' }] },
      ]);
      mockPrismaService.assessmentTest.findMany.mockResolvedValue([
        { layerTestId: 't1', result: 'PASS' },
        { layerTestId: 't2', result: 'FAIL' },
      ]);

      const result = await service.findAll();

      expect(mockPrismaService.controlLayer.findMany).toHaveBeenCalledTimes(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].effectiveness).toBeDefined();
      expect(result.results[1].effectiveness).toBeDefined();
    });
  });
});
