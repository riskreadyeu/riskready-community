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

  const expectNotAssessed = (result: {
    score: number;
    rating: string;
    passCount: number;
    partialCount: number;
    failCount: number;
    notTestedCount: number;
    totalLayers: number;
  }) => {
    expect(result).toMatchObject({
      score: 0,
      rating: 'Not Assessed',
      passCount: 0,
      partialCount: 0,
      failCount: 0,
      notTestedCount: 0,
      totalLayers: 0,
    });
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

      expectNotAssessed(result);
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

      expectNotAssessed(result);
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

      expectNotAssessed(result);
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

      expectNotAssessed(result);
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

      expectNotAssessed(result);
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

      expectNotAssessed(result);
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

      expectNotAssessed(result);
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

      expectNotAssessed(result);
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

      expectNotAssessed(result);
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
      const [firstControl, secondControl] = result.results;

      expect(mockPrismaService.controlLayer.findMany).not.toHaveBeenCalled();
      expect(result.results).toHaveLength(2);
      expect(firstControl).toBeDefined();
      expect(secondControl).toBeDefined();
      expect(firstControl?.effectiveness).toMatchObject({
        score: 0,
        rating: 'Not Assessed',
      });
      expect(secondControl?.effectiveness).toMatchObject({
        score: 0,
        rating: 'Not Assessed',
      });
    });
  });
});
