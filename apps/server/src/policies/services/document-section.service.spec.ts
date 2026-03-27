import { Test, TestingModule } from '@nestjs/testing';
import { DocumentSectionService } from './document-section.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentSectionType } from '@prisma/client';

describe('DocumentSectionService', () => {
  let service: DocumentSectionService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    documentSection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    documentDefinition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    documentProcessStep: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    policyDocument: {
      findUnique: jest.fn(),
    },
    documentSectionTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentSectionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DocumentSectionService>(DocumentSectionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSections', () => {
    it('should return sections for a document ordered by order field', async () => {
      const documentId = 'doc-1';
      const mockSections = [
        {
          id: 'section-1',
          documentId,
          sectionType: 'POLICY_STATEMENT',
          title: 'Policy Statement',
          order: 0,
          content: 'Test content',
          template: { id: 'template-1', name: 'Statement Template' },
          createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
        {
          id: 'section-2',
          documentId,
          sectionType: 'SCOPE',
          title: 'Scope',
          order: 1,
          content: 'Scope content',
          template: null,
          createdBy: null,
        },
      ];

      mockPrismaService.documentSection.findMany.mockResolvedValue(mockSections);

      const result = await service.getSections(documentId);

      expect(result).toEqual(mockSections);
      expect(mockPrismaService.documentSection.findMany).toHaveBeenCalledWith({
        where: { documentId },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              sectionType: true,
              defaultTitle: true,
            },
          },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { order: 'asc' },
      });
    });

    it('should return empty array when no sections exist', async () => {
      mockPrismaService.documentSection.findMany.mockResolvedValue([]);

      const result = await service.getSections('doc-1');

      expect(result).toEqual([]);
    });
  });

  describe('createSection', () => {
    it('should create a new section with all fields', async () => {
      const documentId = 'doc-1';
      const createData = {
        documentId,
        sectionType: 'POLICY_STATEMENT' as DocumentSectionType,
        title: 'New Section',
        order: 5,
        content: 'Section content',
        structuredData: { field: 'value' },
        templateId: 'template-1',
        isVisible: true,
        isCollapsed: false,
        createdById: 'user-1',
      };

      const mockDocument = { id: documentId, title: 'Test Document' };
      const mockCreatedSection = {
        id: 'section-new',
        ...createData,
        template: { id: 'template-1', name: 'Test Template' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentSection.create.mockResolvedValue(mockCreatedSection);

      const result = await service.createSection(createData);

      expect(result).toEqual(mockCreatedSection);
      expect(mockPrismaService.policyDocument.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(mockPrismaService.documentSection.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: documentId } },
          sectionType: createData.sectionType,
          title: createData.title,
          order: createData.order,
          content: createData.content,
          structuredData: createData.structuredData,
          template: { connect: { id: createData.templateId } },
          isVisible: createData.isVisible,
          isCollapsed: createData.isCollapsed,
          createdBy: { connect: { id: createData.createdById } },
        },
        include: {
          template: true,
        },
      });
    });

    it('should create section with default values when optional fields are omitted', async () => {
      const documentId = 'doc-1';
      const createData = {
        documentId,
        sectionType: 'SCOPE' as DocumentSectionType,
        title: 'Scope Section',
      };

      const mockDocument = { id: documentId, title: 'Test Document' };
      const mockCreatedSection = {
        id: 'section-new',
        ...createData,
        order: 0,
        isVisible: true,
        isCollapsed: false,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentSection.create.mockResolvedValue(mockCreatedSection);

      const result = await service.createSection(createData);

      expect(result).toEqual(mockCreatedSection);
      expect(mockPrismaService.documentSection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 0,
            isVisible: true,
            isCollapsed: false,
          }),
        })
      );
    });

    it('should throw NotFoundException when document does not exist', async () => {
      const createData = {
        documentId: 'non-existent',
        sectionType: 'SCOPE' as DocumentSectionType,
        title: 'Test',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);

      await expect(service.createSection(createData)).rejects.toThrow(NotFoundException);
      await expect(service.createSection(createData)).rejects.toThrow(
        'Document with ID non-existent not found'
      );
    });
  });

  describe('updateSection', () => {
    it('should update section with provided fields', async () => {
      const sectionId = 'section-1';
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        order: 10,
        isVisible: false,
      };

      const mockUpdatedSection = {
        id: sectionId,
        ...updateData,
        template: null,
      };

      mockPrismaService.documentSection.update.mockResolvedValue(mockUpdatedSection);

      const result = await service.updateSection(sectionId, updateData);

      expect(result).toEqual(mockUpdatedSection);
      expect(mockPrismaService.documentSection.update).toHaveBeenCalledWith({
        where: { id: sectionId },
        data: updateData,
        include: {
          template: true,
        },
      });
    });
  });

  describe('deleteSection', () => {
    it('should delete a section and return success', async () => {
      const sectionId = 'section-1';

      mockPrismaService.documentSection.delete.mockResolvedValue({ id: sectionId });

      const result = await service.deleteSection(sectionId);

      expect(result).toEqual({ deleted: true });
      expect(mockPrismaService.documentSection.delete).toHaveBeenCalledWith({
        where: { id: sectionId },
      });
    });
  });

  describe('reorderSections', () => {
    it('should update order for multiple sections in a transaction', async () => {
      const documentId = 'doc-1';
      const sectionOrders = [
        { id: 'section-1', order: 2 },
        { id: 'section-2', order: 0 },
        { id: 'section-3', order: 1 },
      ];

      const mockSections = [
        { id: 'section-1', documentId },
        { id: 'section-2', documentId },
        { id: 'section-3', documentId },
      ];

      mockPrismaService.documentSection.findMany.mockResolvedValue(mockSections);
      mockPrismaService.$transaction.mockImplementation(async (updates) => {
        return Promise.all(updates);
      });

      const result = await service.reorderSections(documentId, sectionOrders);

      expect(result).toEqual({ updated: true, count: 3 });
      expect(mockPrismaService.documentSection.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['section-1', 'section-2', 'section-3'] },
          documentId,
        },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when sections do not belong to document', async () => {
      const documentId = 'doc-1';
      const sectionOrders = [
        { id: 'section-1', order: 0 },
        { id: 'section-2', order: 1 },
        { id: 'section-wrong', order: 2 },
      ];

      const mockSections = [
        { id: 'section-1', documentId },
        { id: 'section-2', documentId },
      ];

      mockPrismaService.documentSection.findMany.mockResolvedValue(mockSections);

      await expect(service.reorderSections(documentId, sectionOrders)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.reorderSections(documentId, sectionOrders)).rejects.toThrow(
        'Some sections do not belong to this document'
      );
    });
  });

  describe('getDefinitions', () => {
    it('should return definitions for a document ordered by order field', async () => {
      const documentId = 'doc-1';
      const mockDefinitions = [
        {
          id: 'def-1',
          documentId,
          term: 'API',
          definition: 'Application Programming Interface',
          source: 'Internal',
          order: 0,
        },
        {
          id: 'def-2',
          documentId,
          term: 'GDPR',
          definition: 'General Data Protection Regulation',
          source: null,
          order: 1,
        },
      ];

      mockPrismaService.documentDefinition.findMany.mockResolvedValue(mockDefinitions);

      const result = await service.getDefinitions(documentId);

      expect(result).toEqual(mockDefinitions);
      expect(mockPrismaService.documentDefinition.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('createDefinition', () => {
    it('should create a new definition', async () => {
      const createData = {
        documentId: 'doc-1',
        term: 'HIPAA',
        definition: 'Health Insurance Portability and Accountability Act',
        source: 'US Federal Law',
        order: 5,
      };

      const mockCreatedDefinition = {
        id: 'def-new',
        ...createData,
      };

      mockPrismaService.documentDefinition.findUnique.mockResolvedValue(null);
      mockPrismaService.documentDefinition.create.mockResolvedValue(mockCreatedDefinition);

      const result = await service.createDefinition(createData);

      expect(result).toEqual(mockCreatedDefinition);
      expect(mockPrismaService.documentDefinition.findUnique).toHaveBeenCalledWith({
        where: { documentId_term: { documentId: createData.documentId, term: createData.term } },
      });
      expect(mockPrismaService.documentDefinition.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: createData.documentId } },
          term: createData.term,
          definition: createData.definition,
          source: createData.source,
          order: createData.order,
        },
      });
    });

    it('should create definition with default order when not specified', async () => {
      const createData = {
        documentId: 'doc-1',
        term: 'API',
        definition: 'Application Programming Interface',
      };

      const mockCreatedDefinition = {
        id: 'def-new',
        ...createData,
        order: 0,
      };

      mockPrismaService.documentDefinition.findUnique.mockResolvedValue(null);
      mockPrismaService.documentDefinition.create.mockResolvedValue(mockCreatedDefinition);

      const result = await service.createDefinition(createData);

      expect(result).toEqual(mockCreatedDefinition);
      expect(mockPrismaService.documentDefinition.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 0,
          }),
        })
      );
    });

    it('should throw BadRequestException when term already exists for document', async () => {
      const createData = {
        documentId: 'doc-1',
        term: 'API',
        definition: 'Application Programming Interface',
      };

      const existingDefinition = {
        id: 'def-existing',
        ...createData,
      };

      mockPrismaService.documentDefinition.findUnique.mockResolvedValue(existingDefinition);

      await expect(service.createDefinition(createData)).rejects.toThrow(BadRequestException);
      await expect(service.createDefinition(createData)).rejects.toThrow(
        'Definition for term "API" already exists'
      );
    });
  });

  describe('getProcessSteps', () => {
    it('should return process steps for a document ordered by order field', async () => {
      const documentId = 'doc-1';
      const mockProcessSteps = [
        {
          id: 'step-1',
          documentId,
          stepNumber: '1.0',
          title: 'Initial Assessment',
          description: 'Conduct initial risk assessment',
          order: 0,
          responsible: 'Risk Manager',
          accountable: 'CRO',
          consulted: ['Security Team', 'Compliance Team'],
          informed: ['Management'],
        },
        {
          id: 'step-2',
          documentId,
          stepNumber: '2.0',
          title: 'Risk Treatment',
          description: 'Implement risk treatment plan',
          order: 1,
          responsible: 'IT Manager',
          accountable: 'CTO',
          consulted: ['Security Team'],
          informed: ['Board'],
        },
      ];

      mockPrismaService.documentProcessStep.findMany.mockResolvedValue(mockProcessSteps);

      const result = await service.getProcessSteps(documentId);

      expect(result).toEqual(mockProcessSteps);
      expect(mockPrismaService.documentProcessStep.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('createProcessStep', () => {
    it('should create a new process step with all RACI fields', async () => {
      const createData = {
        documentId: 'doc-1',
        stepNumber: '1.0',
        title: 'Risk Assessment',
        description: 'Conduct comprehensive risk assessment',
        order: 0,
        responsible: 'Risk Manager',
        accountable: 'CRO',
        consulted: ['Security Team', 'Compliance Team'],
        informed: ['Board', 'Management'],
        estimatedDuration: '2 weeks',
        inputs: ['Asset Inventory', 'Threat Intelligence'],
        outputs: ['Risk Register', 'Risk Report'],
        isDecisionPoint: true,
        decisionOptions: { options: ['Accept', 'Mitigate', 'Transfer'] },
      };

      const mockCreatedStep = {
        id: 'step-new',
        ...createData,
      };

      mockPrismaService.documentProcessStep.create.mockResolvedValue(mockCreatedStep);

      const result = await service.createProcessStep(createData);

      expect(result).toEqual(mockCreatedStep);
      expect(mockPrismaService.documentProcessStep.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: createData.documentId } },
          stepNumber: createData.stepNumber,
          title: createData.title,
          description: createData.description,
          order: createData.order,
          responsible: createData.responsible,
          accountable: createData.accountable,
          consulted: createData.consulted,
          informed: createData.informed,
          estimatedDuration: createData.estimatedDuration,
          inputs: createData.inputs,
          outputs: createData.outputs,
          isDecisionPoint: createData.isDecisionPoint,
          decisionOptions: createData.decisionOptions,
        },
      });
    });

    it('should create process step with default values when optional fields are omitted', async () => {
      const createData = {
        documentId: 'doc-1',
        stepNumber: '1.0',
        title: 'Simple Step',
        description: 'A simple process step',
      };

      const mockCreatedStep = {
        id: 'step-new',
        ...createData,
        order: 0,
        consulted: [],
        informed: [],
        inputs: [],
        outputs: [],
        isDecisionPoint: false,
      };

      mockPrismaService.documentProcessStep.create.mockResolvedValue(mockCreatedStep);

      const result = await service.createProcessStep(createData);

      expect(result).toEqual(mockCreatedStep);
      expect(mockPrismaService.documentProcessStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 0,
            consulted: [],
            informed: [],
            inputs: [],
            outputs: [],
            isDecisionPoint: false,
          }),
        })
      );
    });

    it('should handle RACI matrix with all roles specified', async () => {
      const createData = {
        documentId: 'doc-1',
        stepNumber: '3.0',
        title: 'Review and Approval',
        description: 'Review and approve risk treatment plan',
        responsible: 'Risk Manager',
        accountable: 'CRO',
        consulted: ['Legal', 'Compliance', 'Security'],
        informed: ['Board', 'Executive Team', 'Department Heads'],
      };

      const mockCreatedStep = {
        id: 'step-new',
        ...createData,
        order: 0,
      };

      mockPrismaService.documentProcessStep.create.mockResolvedValue(mockCreatedStep);

      const result = await service.createProcessStep(createData);

      expect(result.responsible).toBe('Risk Manager');
      expect(result.accountable).toBe('CRO');
      expect(result.consulted).toEqual(['Legal', 'Compliance', 'Security']);
      expect(result.informed).toEqual(['Board', 'Executive Team', 'Department Heads']);
    });
  });

  describe('getSection', () => {
    it('should return a single section with template and creator', async () => {
      const sectionId = 'section-1';
      const mockSection = {
        id: sectionId,
        documentId: 'doc-1',
        sectionType: 'POLICY_STATEMENT',
        title: 'Policy Statement',
        template: { id: 'template-1', name: 'Statement Template' },
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentSection.findUnique.mockResolvedValue(mockSection);

      const result = await service.getSection(sectionId);

      expect(result).toEqual(mockSection);
    });

    it('should throw NotFoundException when section does not exist', async () => {
      mockPrismaService.documentSection.findUnique.mockResolvedValue(null);

      await expect(service.getSection('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getSection('non-existent')).rejects.toThrow(
        'Section with ID non-existent not found'
      );
    });
  });

  describe('getDefinition', () => {
    it('should return a single definition', async () => {
      const definitionId = 'def-1';
      const mockDefinition = {
        id: definitionId,
        documentId: 'doc-1',
        term: 'API',
        definition: 'Application Programming Interface',
      };

      mockPrismaService.documentDefinition.findUnique.mockResolvedValue(mockDefinition);

      const result = await service.getDefinition(definitionId);

      expect(result).toEqual(mockDefinition);
    });

    it('should throw NotFoundException when definition does not exist', async () => {
      mockPrismaService.documentDefinition.findUnique.mockResolvedValue(null);

      await expect(service.getDefinition('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getDefinition('non-existent')).rejects.toThrow(
        'Definition with ID non-existent not found'
      );
    });
  });

  describe('getProcessStep', () => {
    it('should return a single process step', async () => {
      const stepId = 'step-1';
      const mockStep = {
        id: stepId,
        documentId: 'doc-1',
        stepNumber: '1.0',
        title: 'Risk Assessment',
        description: 'Conduct risk assessment',
      };

      mockPrismaService.documentProcessStep.findUnique.mockResolvedValue(mockStep);

      const result = await service.getProcessStep(stepId);

      expect(result).toEqual(mockStep);
    });

    it('should throw NotFoundException when process step does not exist', async () => {
      mockPrismaService.documentProcessStep.findUnique.mockResolvedValue(null);

      await expect(service.getProcessStep('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getProcessStep('non-existent')).rejects.toThrow(
        'Process step with ID non-existent not found'
      );
    });
  });

  describe('updateDefinition', () => {
    it('should update definition fields', async () => {
      const definitionId = 'def-1';
      const updateData = {
        term: 'Updated Term',
        definition: 'Updated definition',
        order: 5,
      };

      const mockUpdatedDefinition = {
        id: definitionId,
        documentId: 'doc-1',
        ...updateData,
      };

      mockPrismaService.documentDefinition.update.mockResolvedValue(mockUpdatedDefinition);

      const result = await service.updateDefinition(definitionId, updateData);

      expect(result).toEqual(mockUpdatedDefinition);
      expect(mockPrismaService.documentDefinition.update).toHaveBeenCalledWith({
        where: { id: definitionId },
        data: updateData,
      });
    });
  });

  describe('deleteDefinition', () => {
    it('should delete a definition and return success', async () => {
      const definitionId = 'def-1';

      mockPrismaService.documentDefinition.delete.mockResolvedValue({ id: definitionId });

      const result = await service.deleteDefinition(definitionId);

      expect(result).toEqual({ deleted: true });
      expect(mockPrismaService.documentDefinition.delete).toHaveBeenCalledWith({
        where: { id: definitionId },
      });
    });
  });

  describe('updateProcessStep', () => {
    it('should update process step fields including RACI', async () => {
      const stepId = 'step-1';
      const updateData = {
        title: 'Updated Title',
        responsible: 'New Manager',
        consulted: ['New Team'],
      };

      const mockUpdatedStep = {
        id: stepId,
        documentId: 'doc-1',
        ...updateData,
      };

      mockPrismaService.documentProcessStep.update.mockResolvedValue(mockUpdatedStep);

      const result = await service.updateProcessStep(stepId, updateData);

      expect(result).toEqual(mockUpdatedStep);
      expect(mockPrismaService.documentProcessStep.update).toHaveBeenCalledWith({
        where: { id: stepId },
        data: updateData,
      });
    });
  });

  describe('deleteProcessStep', () => {
    it('should delete a process step and return success', async () => {
      const stepId = 'step-1';

      mockPrismaService.documentProcessStep.delete.mockResolvedValue({ id: stepId });

      const result = await service.deleteProcessStep(stepId);

      expect(result).toEqual({ deleted: true });
      expect(mockPrismaService.documentProcessStep.delete).toHaveBeenCalledWith({
        where: { id: stepId },
      });
    });
  });
});
