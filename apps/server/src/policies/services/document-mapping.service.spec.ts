import { Test, TestingModule } from '@nestjs/testing';
import { DocumentMappingService } from './document-mapping.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ControlMappingType, CoverageLevel, RiskRelationshipType, DocumentRelationType } from '@prisma/client';

describe('DocumentMappingService', () => {
  let service: DocumentMappingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    documentControlMapping: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    documentRiskMapping: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    documentRelation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    control: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentMappingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DocumentMappingService>(DocumentMappingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getControlMappings', () => {
    it('should return control mappings for a document', async () => {
      const documentId = 'doc-1';
      const mockMappings = [
        {
          id: 'mapping-1',
          documentId,
          controlId: 'control-1',
          mappingType: 'IMPLEMENTS',
          coverage: 'FULL',
          control: {
            id: 'control-1',
            controlId: 'AC-1',
            name: 'Access Control Policy',
            theme: 'ACCESS_CONTROL',
            framework: 'ISO27001',
            implementationStatus: 'IMPLEMENTED',
          },
          createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
        {
          id: 'mapping-2',
          documentId,
          controlId: 'control-2',
          mappingType: 'SUPPORTS',
          coverage: 'PARTIAL',
          control: {
            id: 'control-2',
            controlId: 'AC-2',
            name: 'Account Management',
            theme: 'ACCESS_CONTROL',
            framework: 'ISO27001',
            implementationStatus: 'PLANNED',
          },
          createdBy: null,
        },
      ];

      mockPrismaService.documentControlMapping.findMany.mockResolvedValue(mockMappings);

      const result = await service.getControlMappings(documentId);

      expect(result).toEqual(mockMappings);
      expect(mockPrismaService.documentControlMapping.findMany).toHaveBeenCalledWith({
        where: { documentId },
        include: {
          control: {
            select: {
              id: true,
              controlId: true,
              name: true,
              theme: true,
              framework: true,
              implementationStatus: true,
            },
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('addControlMapping', () => {
    it('should create a new control mapping with all fields', async () => {
      const createData = {
        documentId: 'doc-1',
        controlId: 'control-1',
        mappingType: 'IMPLEMENTS' as ControlMappingType,
        coverage: 'FULL' as CoverageLevel,
        notes: 'This document fully implements the control',
        evidenceRequired: true,
        evidenceDescription: 'Annual compliance audit report',
        createdById: 'user-1',
      };

      const mockCreatedMapping = {
        id: 'mapping-new',
        ...createData,
        control: { id: 'control-1', controlId: 'AC-1', name: 'Access Control', theme: 'ACCESS_CONTROL' },
      };

      mockPrismaService.documentControlMapping.findUnique.mockResolvedValue(null);
      mockPrismaService.documentControlMapping.create.mockResolvedValue(mockCreatedMapping);

      const result = await service.addControlMapping(createData);

      expect(result).toEqual(mockCreatedMapping);
      expect(mockPrismaService.documentControlMapping.findUnique).toHaveBeenCalledWith({
        where: { documentId_controlId: { documentId: createData.documentId, controlId: createData.controlId } },
      });
      expect(mockPrismaService.documentControlMapping.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: createData.documentId } },
          control: { connect: { id: createData.controlId } },
          mappingType: createData.mappingType,
          coverage: createData.coverage,
          notes: createData.notes,
          evidenceRequired: createData.evidenceRequired,
          evidenceDescription: createData.evidenceDescription,
          createdBy: { connect: { id: createData.createdById } },
        },
        include: {
          control: { select: { id: true, controlId: true, name: true, theme: true } },
        },
      });
    });

    it('should create mapping with default values when optional fields are omitted', async () => {
      const createData = {
        documentId: 'doc-1',
        controlId: 'control-1',
      };

      const mockCreatedMapping = {
        id: 'mapping-new',
        ...createData,
        mappingType: 'IMPLEMENTS',
        coverage: 'FULL',
        control: { id: 'control-1', controlId: 'AC-1', name: 'Access Control', theme: 'ACCESS_CONTROL' },
      };

      mockPrismaService.documentControlMapping.findUnique.mockResolvedValue(null);
      mockPrismaService.documentControlMapping.create.mockResolvedValue(mockCreatedMapping);

      const result = await service.addControlMapping(createData);

      expect(result.mappingType).toBe('IMPLEMENTS');
      expect(result.coverage).toBe('FULL');
    });

    it('should throw BadRequestException when mapping already exists', async () => {
      const createData = {
        documentId: 'doc-1',
        controlId: 'control-1',
      };

      const existingMapping = {
        id: 'mapping-existing',
        documentId: 'doc-1',
        controlId: 'control-1',
      };

      mockPrismaService.documentControlMapping.findUnique.mockResolvedValue(existingMapping);

      await expect(service.addControlMapping(createData)).rejects.toThrow(BadRequestException);
      await expect(service.addControlMapping(createData)).rejects.toThrow(
        'Control mapping already exists'
      );
    });
  });

  describe('updateControlMapping', () => {
    it('should update control mapping fields', async () => {
      const mappingId = 'mapping-1';
      const updateData = {
        mappingType: 'SUPPORTS' as ControlMappingType,
        coverage: 'PARTIAL' as CoverageLevel,
        notes: 'Updated notes',
      };

      const mockUpdatedMapping = {
        id: mappingId,
        ...updateData,
        control: { id: 'control-1', controlId: 'AC-1', name: 'Access Control', theme: 'ACCESS_CONTROL' },
      };

      mockPrismaService.documentControlMapping.update.mockResolvedValue(mockUpdatedMapping);

      const result = await service.updateControlMapping(mappingId, updateData);

      expect(result).toEqual(mockUpdatedMapping);
      expect(mockPrismaService.documentControlMapping.update).toHaveBeenCalledWith({
        where: { id: mappingId },
        data: updateData,
        include: {
          control: { select: { id: true, controlId: true, name: true, theme: true } },
        },
      });
    });
  });

  describe('removeControlMapping', () => {
    it('should delete control mapping and return success', async () => {
      const mappingId = 'mapping-1';

      mockPrismaService.documentControlMapping.delete.mockResolvedValue({ id: mappingId });

      const result = await service.removeControlMapping(mappingId);

      expect(result).toEqual({ deleted: true });
      expect(mockPrismaService.documentControlMapping.delete).toHaveBeenCalledWith({
        where: { id: mappingId },
      });
    });
  });

  describe('getRiskMappings', () => {
    it('should return risk mappings for a document', async () => {
      const documentId = 'doc-1';
      const mockMappings = [
        {
          id: 'risk-mapping-1',
          documentId,
          riskId: 'risk-1',
          relationshipType: 'MITIGATES',
          risk: {
            id: 'risk-1',
            riskId: 'R-001',
            title: 'Data Breach Risk',
            status: 'ACTIVE',
            inherentScore: 16,
            residualScore: 8,
          },
          createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.documentRiskMapping.findMany.mockResolvedValue(mockMappings);

      const result = await service.getRiskMappings(documentId);

      expect(result).toEqual(mockMappings);
      expect(mockPrismaService.documentRiskMapping.findMany).toHaveBeenCalledWith({
        where: { documentId },
        include: {
          risk: {
            select: {
              id: true,
              riskId: true,
              title: true,
              status: true,
              inherentScore: true,
              residualScore: true,
            },
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('addRiskMapping', () => {
    it('should create a new risk mapping', async () => {
      const createData = {
        documentId: 'doc-1',
        riskId: 'risk-1',
        relationshipType: 'MITIGATES' as RiskRelationshipType,
        notes: 'This policy mitigates the risk',
        createdById: 'user-1',
      };

      const mockCreatedMapping = {
        id: 'risk-mapping-new',
        ...createData,
        risk: { id: 'risk-1', riskId: 'R-001', title: 'Data Breach Risk', status: 'ACTIVE' },
      };

      mockPrismaService.documentRiskMapping.findUnique.mockResolvedValue(null);
      mockPrismaService.documentRiskMapping.create.mockResolvedValue(mockCreatedMapping);

      const result = await service.addRiskMapping(createData);

      expect(result).toEqual(mockCreatedMapping);
      expect(mockPrismaService.documentRiskMapping.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: createData.documentId } },
          risk: { connect: { id: createData.riskId } },
          relationshipType: createData.relationshipType,
          notes: createData.notes,
          createdBy: { connect: { id: createData.createdById } },
        },
        include: {
          risk: { select: { id: true, riskId: true, title: true, status: true } },
        },
      });
    });

    it('should create mapping with default relationship type', async () => {
      const createData = {
        documentId: 'doc-1',
        riskId: 'risk-1',
      };

      const mockCreatedMapping = {
        id: 'risk-mapping-new',
        ...createData,
        relationshipType: 'MITIGATES',
        risk: { id: 'risk-1', riskId: 'R-001', title: 'Test Risk', status: 'ACTIVE' },
      };

      mockPrismaService.documentRiskMapping.findUnique.mockResolvedValue(null);
      mockPrismaService.documentRiskMapping.create.mockResolvedValue(mockCreatedMapping);

      const result = await service.addRiskMapping(createData);

      expect(result.relationshipType).toBe('MITIGATES');
    });

    it('should throw BadRequestException when mapping already exists', async () => {
      const createData = {
        documentId: 'doc-1',
        riskId: 'risk-1',
      };

      const existingMapping = {
        id: 'risk-mapping-existing',
        documentId: 'doc-1',
        riskId: 'risk-1',
      };

      mockPrismaService.documentRiskMapping.findUnique.mockResolvedValue(existingMapping);

      await expect(service.addRiskMapping(createData)).rejects.toThrow(BadRequestException);
      await expect(service.addRiskMapping(createData)).rejects.toThrow(
        'Risk mapping already exists'
      );
    });
  });

  describe('updateRiskMapping', () => {
    it('should update risk mapping fields', async () => {
      const mappingId = 'risk-mapping-1';
      const updateData = {
        relationshipType: 'ADDRESSES' as RiskRelationshipType,
        notes: 'Updated relationship notes',
      };

      const mockUpdatedMapping = {
        id: mappingId,
        ...updateData,
        risk: { id: 'risk-1', riskId: 'R-001', title: 'Test Risk', status: 'ACTIVE' },
      };

      mockPrismaService.documentRiskMapping.update.mockResolvedValue(mockUpdatedMapping);

      const result = await service.updateRiskMapping(mappingId, updateData);

      expect(result).toEqual(mockUpdatedMapping);
      expect(mockPrismaService.documentRiskMapping.update).toHaveBeenCalledWith({
        where: { id: mappingId },
        data: updateData,
        include: {
          risk: { select: { id: true, riskId: true, title: true, status: true } },
        },
      });
    });
  });

  describe('removeRiskMapping', () => {
    it('should delete risk mapping and return success', async () => {
      const mappingId = 'risk-mapping-1';

      mockPrismaService.documentRiskMapping.delete.mockResolvedValue({ id: mappingId });

      const result = await service.removeRiskMapping(mappingId);

      expect(result).toEqual({ deleted: true });
      expect(mockPrismaService.documentRiskMapping.delete).toHaveBeenCalledWith({
        where: { id: mappingId },
      });
    });
  });

  describe('getDocumentRelations', () => {
    it('should return both outgoing and incoming document relations', async () => {
      const documentId = 'doc-1';
      const mockOutgoing = [
        {
          id: 'rel-1',
          sourceDocumentId: documentId,
          targetDocumentId: 'doc-2',
          relationType: 'REFERENCES',
          targetDocument: {
            id: 'doc-2',
            documentId: 'POL-002',
            title: 'Related Policy',
            documentType: 'POLICY',
            status: 'APPROVED',
          },
        },
      ];
      const mockIncoming = [
        {
          id: 'rel-2',
          sourceDocumentId: 'doc-3',
          targetDocumentId: documentId,
          relationType: 'SUPERSEDES',
          sourceDocument: {
            id: 'doc-3',
            documentId: 'POL-003',
            title: 'Newer Policy',
            documentType: 'POLICY',
            status: 'DRAFT',
          },
        },
      ];

      mockPrismaService.documentRelation.findMany
        .mockResolvedValueOnce(mockOutgoing)
        .mockResolvedValueOnce(mockIncoming);

      const result = await service.getDocumentRelations(documentId);

      expect(result.outgoing).toEqual(mockOutgoing);
      expect(result.incoming).toEqual(mockIncoming);
      expect(mockPrismaService.documentRelation.findMany).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.documentRelation.findMany).toHaveBeenNthCalledWith(1, {
        where: { sourceDocumentId: documentId },
        include: {
          targetDocument: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              status: true,
            },
          },
        },
      });
      expect(mockPrismaService.documentRelation.findMany).toHaveBeenNthCalledWith(2, {
        where: { targetDocumentId: documentId },
        include: {
          sourceDocument: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              status: true,
            },
          },
        },
      });
    });
  });

  describe('addDocumentRelation', () => {
    it('should create a document relation', async () => {
      const createData = {
        sourceDocumentId: 'doc-1',
        targetDocumentId: 'doc-2',
        relationType: 'REFERENCES' as DocumentRelationType,
        description: 'This document references the other',
        createdById: 'user-1',
      };

      const mockCreatedRelation = {
        id: 'rel-new',
        ...createData,
        sourceDocument: { id: 'doc-1', documentId: 'POL-001', title: 'Source Policy' },
        targetDocument: { id: 'doc-2', documentId: 'POL-002', title: 'Target Policy' },
      };

      mockPrismaService.documentRelation.findUnique.mockResolvedValue(null);
      mockPrismaService.documentRelation.create.mockResolvedValue(mockCreatedRelation);

      const result = await service.addDocumentRelation(createData);

      expect(result).toEqual(mockCreatedRelation);
      expect(mockPrismaService.documentRelation.create).toHaveBeenCalledWith({
        data: {
          sourceDocument: { connect: { id: createData.sourceDocumentId } },
          targetDocument: { connect: { id: createData.targetDocumentId } },
          relationType: createData.relationType,
          description: createData.description,
          createdBy: { connect: { id: createData.createdById } },
        },
        include: {
          sourceDocument: { select: { id: true, documentId: true, title: true } },
          targetDocument: { select: { id: true, documentId: true, title: true } },
        },
      });
    });

    it('should throw BadRequestException when creating self-referencing relation', async () => {
      const createData = {
        sourceDocumentId: 'doc-1',
        targetDocumentId: 'doc-1',
        relationType: 'REFERENCES' as DocumentRelationType,
      };

      await expect(service.addDocumentRelation(createData)).rejects.toThrow(BadRequestException);
      await expect(service.addDocumentRelation(createData)).rejects.toThrow(
        'Cannot create relation to self'
      );
    });

    it('should throw BadRequestException when relation already exists', async () => {
      const createData = {
        sourceDocumentId: 'doc-1',
        targetDocumentId: 'doc-2',
        relationType: 'REFERENCES' as DocumentRelationType,
      };

      const existingRelation = {
        id: 'rel-existing',
        sourceDocumentId: 'doc-1',
        targetDocumentId: 'doc-2',
        relationType: 'REFERENCES',
      };

      mockPrismaService.documentRelation.findUnique.mockResolvedValue(existingRelation);

      await expect(service.addDocumentRelation(createData)).rejects.toThrow(BadRequestException);
      await expect(service.addDocumentRelation(createData)).rejects.toThrow(
        'Relation already exists'
      );
    });
  });

  describe('removeDocumentRelation', () => {
    it('should delete document relation and return success', async () => {
      const relationId = 'rel-1';

      mockPrismaService.documentRelation.delete.mockResolvedValue({ id: relationId });

      const result = await service.removeDocumentRelation(relationId);

      expect(result).toEqual({ deleted: true });
      expect(mockPrismaService.documentRelation.delete).toHaveBeenCalledWith({
        where: { id: relationId },
      });
    });
  });

  describe('getControlCoverageReport', () => {
    it('should return coverage report with summary statistics', async () => {
      const organisationId = 'org-1';
      const mockControls = [
        {
          id: 'control-1',
          controlId: 'AC-1',
          name: 'Access Control Policy',
          theme: 'ACCESS_CONTROL',
          documentMappings: [
            {
              mappingType: 'IMPLEMENTS',
              coverage: 'FULL',
              document: {
                id: 'doc-1',
                documentId: 'POL-001',
                title: 'Security Policy',
                documentType: 'POLICY',
                status: 'APPROVED',
              },
            },
          ],
        },
        {
          id: 'control-2',
          controlId: 'AC-2',
          name: 'Account Management',
          theme: 'ACCESS_CONTROL',
          documentMappings: [
            {
              mappingType: 'SUPPORTS',
              coverage: 'PARTIAL',
              document: {
                id: 'doc-2',
                documentId: 'POL-002',
                title: 'User Management',
                documentType: 'PROCEDURE',
                status: 'DRAFT',
              },
            },
          ],
        },
        {
          id: 'control-3',
          controlId: 'AC-3',
          name: 'Access Enforcement',
          theme: 'ACCESS_CONTROL',
          documentMappings: [],
        },
      ];

      mockPrismaService.control.findMany.mockResolvedValue(mockControls);

      const result = await service.getControlCoverageReport(organisationId);
      const [firstControl, , thirdControl] = result.controls;

      expect(result.controls).toHaveLength(3);
      expect(firstControl).toBeDefined();
      expect(thirdControl).toBeDefined();
      expect(firstControl?.controlId).toBe('AC-1');
      expect(firstControl?.documentCount).toBe(1);
      expect(firstControl?.hasCoverage).toBe(true);
      expect(firstControl?.hasFullCoverage).toBe(true);
      expect(thirdControl?.hasCoverage).toBe(false);

      expect(result.summary.totalControls).toBe(3);
      expect(result.summary.covered).toBe(2);
      expect(result.summary.fullyCovered).toBe(1);
      expect(result.summary.uncovered).toBe(1);
      expect(result.summary.coveragePercentage).toBe(67);
    });

    it('should handle controls with multiple document mappings', async () => {
      const organisationId = 'org-1';
      const mockControls = [
        {
          id: 'control-1',
          controlId: 'AC-1',
          name: 'Access Control Policy',
          theme: 'ACCESS_CONTROL',
          documentMappings: [
            {
              mappingType: 'IMPLEMENTS',
              coverage: 'PARTIAL',
              document: {
                id: 'doc-1',
                documentId: 'POL-001',
                title: 'Security Policy',
                documentType: 'POLICY',
                status: 'APPROVED',
              },
            },
            {
              mappingType: 'IMPLEMENTS',
              coverage: 'FULL',
              document: {
                id: 'doc-2',
                documentId: 'POL-002',
                title: 'Access Control Procedure',
                documentType: 'PROCEDURE',
                status: 'APPROVED',
              },
            },
          ],
        },
      ];

      mockPrismaService.control.findMany.mockResolvedValue(mockControls);

      const result = await service.getControlCoverageReport(organisationId);
      const [firstControl] = result.controls;

      expect(firstControl).toBeDefined();
      expect(firstControl?.documentCount).toBe(2);
      expect(firstControl?.documents).toHaveLength(2);
      expect(firstControl?.hasFullCoverage).toBe(true);
    });
  });

  describe('getGapAnalysis', () => {
    it('should return controls without documentation or with partial coverage', async () => {
      const organisationId = 'org-1';
      const mockGaps = [
        {
          id: 'control-1',
          controlId: 'AC-1',
          name: 'Access Control Policy',
          theme: 'ACCESS_CONTROL',
          documentMappings: [],
        },
        {
          id: 'control-2',
          controlId: 'AC-2',
          name: 'Account Management',
          theme: 'ACCESS_CONTROL',
          documentMappings: [
            {
              mappingType: 'SUPPORTS',
              coverage: 'PARTIAL',
              document: {
                documentId: 'POL-001',
                title: 'User Policy',
                status: 'DRAFT',
              },
            },
          ],
        },
      ];

      mockPrismaService.control.findMany.mockResolvedValue(mockGaps);

      const result = await service.getGapAnalysis(organisationId);
      const [firstGap, secondGap] = result;

      expect(result).toHaveLength(2);
      expect(firstGap).toBeDefined();
      expect(secondGap).toBeDefined();
      expect(firstGap?.gapType).toBe('NO_DOCUMENTATION');
      expect(firstGap?.recommendation).toContain('Create a new policy');
      expect(secondGap?.gapType).toBe('PARTIAL_COVERAGE');
      expect(secondGap?.recommendation).toContain('Review and enhance existing documentation');
    });

    it('should provide appropriate recommendations for each gap type', async () => {
      const organisationId = 'org-1';
      const mockGaps = [
        {
          id: 'control-1',
          controlId: 'AC-1',
          name: 'Control Without Docs',
          theme: 'ACCESS_CONTROL',
          documentMappings: [],
        },
        {
          id: 'control-2',
          controlId: 'AC-2',
          name: 'Control With Partial Docs',
          theme: 'ACCESS_CONTROL',
          documentMappings: [
            {
              mappingType: 'SUPPORTS',
              coverage: 'PARTIAL',
              document: { documentId: 'POL-001', title: 'Partial Policy', status: 'APPROVED' },
            },
          ],
        },
      ];

      mockPrismaService.control.findMany.mockResolvedValue(mockGaps);

      const result = await service.getGapAnalysis(organisationId);
      const [firstGap, secondGap] = result;

      expect(firstGap).toBeDefined();
      expect(secondGap).toBeDefined();
      expect(firstGap?.gapType).toBe('NO_DOCUMENTATION');
      expect(firstGap?.recommendation).toBe('Create a new policy or procedure to address this control');
      expect(secondGap?.gapType).toBe('PARTIAL_COVERAGE');
      expect(secondGap?.recommendation).toBe('Review and enhance existing documentation to achieve full coverage');
    });
  });

  describe('getDocumentsByControl', () => {
    it('should return documents mapped to a control', async () => {
      const controlId = 'control-1';
      const mockMappings = [
        {
          id: 'mapping-1',
          controlId,
          document: {
            id: 'doc-1',
            documentId: 'POL-001',
            title: 'Security Policy',
            documentType: 'POLICY',
            status: 'APPROVED',
            version: '1.0',
          },
        },
        {
          id: 'mapping-2',
          controlId,
          document: {
            id: 'doc-2',
            documentId: 'PROC-001',
            title: 'Access Control Procedure',
            documentType: 'PROCEDURE',
            status: 'DRAFT',
            version: '0.1',
          },
        },
      ];

      mockPrismaService.documentControlMapping.findMany.mockResolvedValue(mockMappings);

      const result = await service.getDocumentsByControl(controlId);

      expect(result).toEqual(mockMappings);
      expect(mockPrismaService.documentControlMapping.findMany).toHaveBeenCalledWith({
        where: { controlId },
        include: {
          document: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              status: true,
              version: true,
            },
          },
        },
      });
    });
  });

  describe('getDocumentsByRisk', () => {
    it('should return documents mapped to a risk', async () => {
      const riskId = 'risk-1';
      const mockMappings = [
        {
          id: 'mapping-1',
          riskId,
          document: {
            id: 'doc-1',
            documentId: 'POL-001',
            title: 'Data Protection Policy',
            documentType: 'POLICY',
            status: 'APPROVED',
          },
        },
      ];

      mockPrismaService.documentRiskMapping.findMany.mockResolvedValue(mockMappings);

      const result = await service.getDocumentsByRisk(riskId);

      expect(result).toEqual(mockMappings);
      expect(mockPrismaService.documentRiskMapping.findMany).toHaveBeenCalledWith({
        where: { riskId },
        include: {
          document: {
            select: {
              id: true,
              documentId: true,
              title: true,
              documentType: true,
              status: true,
            },
          },
        },
      });
    });
  });
});
