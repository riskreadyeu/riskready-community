import { Test, TestingModule } from '@nestjs/testing';
import { PolicyDocumentService } from './policy-document.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditService } from './policy-audit.service';
import { NotFoundException } from '@nestjs/common';
import { DocumentStatus, DocumentType } from '@prisma/client';

describe('PolicyDocumentService', () => {
  let service: PolicyDocumentService;
  let prismaService: PrismaService;
  let auditService: PolicyAuditService;

  const mockPrismaService = {
    policyDocument: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    documentAcknowledgment: {
      count: jest.fn(),
    },
    documentException: {
      count: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
    getDocumentAuditLog: jest.fn(),
    getOrganisationAuditLog: jest.fn(),
    getRecentActivity: jest.fn(),
    getActivityStats: jest.fn(),
    exportAuditLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyDocumentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PolicyAuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<PolicyDocumentService>(PolicyDocumentService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<PolicyAuditService>(PolicyAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all documents with pagination', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Security Policy',
          status: 'PUBLISHED',
          documentType: 'POLICY',
          owner: { id: 'user-1', email: 'owner@test.com', firstName: 'Owner', lastName: 'User' },
          authorUser: null,
          approver: null,
          parentDocument: null,
          _count: {
            childDocuments: 2,
            versionHistory: 5,
            reviewHistory: 3,
            acknowledgments: 10,
            controlMappings: 4,
            riskMappings: 2,
            exceptions: 0,
            changeRequests: 1,
          },
        },
        {
          id: 'doc-2',
          documentId: 'POL-002',
          title: 'Data Protection Policy',
          status: 'DRAFT',
          documentType: 'POLICY',
          owner: { id: 'user-2', email: 'user2@test.com', firstName: 'User', lastName: 'Two' },
          authorUser: { id: 'user-3', email: 'author@test.com', firstName: 'Author', lastName: 'Name' },
          approver: null,
          parentDocument: null,
          _count: {
            childDocuments: 0,
            versionHistory: 1,
            reviewHistory: 0,
            acknowledgments: 0,
            controlMappings: 1,
            riskMappings: 1,
            exceptions: 0,
            changeRequests: 0,
          },
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockDocuments);
      mockPrismaService.policyDocument.count.mockResolvedValue(2);

      const result = await service.findAll({
        skip: 0,
        take: 10,
        organisationId: 'org-1',
      });

      expect(result.results).toEqual(mockDocuments);
      expect(result.count).toBe(2);
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { organisationId: 'org-1' },
        orderBy: { documentId: 'asc' },
        include: expect.objectContaining({
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          authorUser: { select: { id: true, email: true, firstName: true, lastName: true } },
          approver: { select: { id: true, email: true, firstName: true, lastName: true } },
          parentDocument: { select: { id: true, documentId: true, title: true } },
          _count: expect.any(Object),
        }),
      });
    });

    it('should filter by where clause and custom orderBy', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Security Policy',
          status: 'PUBLISHED',
          owner: null,
          authorUser: null,
          approver: null,
          parentDocument: null,
          _count: {
            childDocuments: 0,
            versionHistory: 0,
            reviewHistory: 0,
            acknowledgments: 0,
            controlMappings: 0,
            riskMappings: 0,
            exceptions: 0,
            changeRequests: 0,
          },
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockDocuments);
      mockPrismaService.policyDocument.count.mockResolvedValue(1);

      const result = await service.findAll({
        where: { status: 'PUBLISHED' },
        orderBy: { title: 'asc' },
        organisationId: 'org-1',
      });

      expect(result.results).toEqual(mockDocuments);
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: { status: 'PUBLISHED', organisationId: 'org-1' },
        orderBy: { title: 'asc' },
        include: expect.any(Object),
      });
    });

    it('should return empty results when no documents exist', async () => {
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);
      mockPrismaService.policyDocument.count.mockResolvedValue(0);

      const result = await service.findAll();

      expect(result.results).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a document with all related data', async () => {
      const mockDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Security Policy',
        status: 'PUBLISHED',
        documentType: 'POLICY',
        version: '1.0',
        owner: { id: 'user-1', email: 'owner@test.com', firstName: 'Owner', lastName: 'User' },
        authorUser: { id: 'user-2', email: 'author@test.com', firstName: 'Author', lastName: 'Name' },
        approver: { id: 'user-3', email: 'approver@test.com', firstName: 'Approver', lastName: 'Name' },
        createdBy: { id: 'user-4', email: 'creator@test.com', firstName: 'Creator', lastName: 'Name' },
        updatedBy: { id: 'user-5', email: 'updater@test.com', firstName: 'Updater', lastName: 'Name' },
        parentDocument: null,
        childDocuments: [
          {
            id: 'child-1',
            documentId: 'PRO-001',
            title: 'Child Procedure',
            documentType: 'PROCEDURE',
            status: 'APPROVED',
          },
        ],
        versionHistory: [
          {
            id: 'version-1',
            version: '1.0',
            createdAt: new Date('2024-01-01'),
            createdBy: { id: 'user-1', email: 'user@test.com', firstName: 'User', lastName: 'Name' },
          },
        ],
        reviewHistory: [
          {
            id: 'review-1',
            reviewDate: new Date('2024-01-15'),
            reviewedBy: { id: 'user-2', email: 'reviewer@test.com', firstName: 'Reviewer', lastName: 'Name' },
          },
        ],
        approvalWorkflows: [
          {
            id: 'workflow-1',
            initiatedAt: new Date('2024-01-01'),
            steps: [
              {
                id: 'step-1',
                stepOrder: 1,
                approver: { id: 'user-3', email: 'approver@test.com', firstName: 'Approver', lastName: 'Name' },
              },
            ],
          },
        ],
        controlMappings: [
          {
            id: 'mapping-1',
            control: { id: 'control-1', controlId: 'AC-1', name: 'Access Control', theme: 'ACCESS_CONTROL' },
          },
        ],
        riskMappings: [
          {
            id: 'risk-mapping-1',
            risk: { id: 'risk-1', riskId: 'R-001', title: 'Data Breach', status: 'ACTIVE' },
          },
        ],
        relatedDocuments: [
          {
            id: 'rel-1',
            targetDocument: { id: 'doc-2', documentId: 'POL-002', title: 'Related Policy', documentType: 'POLICY' },
          },
        ],
        referencedBy: [
          {
            id: 'ref-1',
            sourceDocument: { id: 'doc-3', documentId: 'POL-003', title: 'Referencing Policy', documentType: 'POLICY' },
          },
        ],
        attachments: [
          {
            id: 'attach-1',
            uploadedBy: { id: 'user-1', email: 'user@test.com', firstName: 'User', lastName: 'Name' },
          },
        ],
        organisation: { id: 'org-1', name: 'Test Organisation' },
        _count: {
          acknowledgments: 5,
          exceptions: 1,
          changeRequests: 2,
        },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);

      const result = await service.findOne('doc-1');

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.policyDocument.findUnique).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        include: expect.objectContaining({
          owner: expect.any(Object),
          authorUser: expect.any(Object),
          approver: expect.any(Object),
          createdBy: expect.any(Object),
          updatedBy: expect.any(Object),
          parentDocument: expect.any(Object),
          childDocuments: expect.any(Object),
          versionHistory: expect.any(Object),
          reviewHistory: expect.any(Object),
          approvalWorkflows: expect.any(Object),
          controlMappings: expect.any(Object),
          riskMappings: expect.any(Object),
          relatedDocuments: expect.any(Object),
          referencedBy: expect.any(Object),
          attachments: expect.any(Object),
          organisation: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Document with ID non-existent not found'
      );
    });
  });

  describe('findByDocumentId', () => {
    it('should return a document by documentId and organisationId', async () => {
      const mockDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Security Policy',
        childDocuments: [
          {
            id: 'child-1',
            documentId: 'PRO-001',
            title: 'Child Procedure',
            documentType: 'PROCEDURE',
          },
        ],
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);

      const result = await service.findByDocumentId('POL-001', 'org-1');

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.policyDocument.findUnique).toHaveBeenCalledWith({
        where: {
          documentId_organisationId: { documentId: 'POL-001', organisationId: 'org-1' },
        },
        include: {
          childDocuments: {
            select: { id: true, documentId: true, title: true, documentType: true },
          },
        },
      });
    });

    it('should return null when document is not found', async () => {
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);

      const result = await service.findByDocumentId('POL-999', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new document and log audit event', async () => {
      const createData = {
        documentId: 'POL-001',
        title: 'New Security Policy',
        documentType: 'POLICY' as DocumentType,
        status: 'DRAFT' as DocumentStatus,
        version: '0.1',
        purpose: 'Protect organisational information assets.',
        scope: 'Applies to all staff and contractors.',
        content: 'Policy content',
        documentOwner: 'Security Team',
        author: 'RiskReady',
        approvalLevel: 'MANAGEMENT' as const,
        organisation: { connect: { id: 'org-1' } },
        owner: { connect: { id: 'user-1' } },
      };

      const mockCreatedDocument = {
        id: 'doc-new',
        documentId: 'POL-001',
        title: 'New Security Policy',
        documentType: 'POLICY',
        status: 'DRAFT',
        version: '0.1',
        owner: { id: 'user-1', email: 'owner@test.com', firstName: 'Owner', lastName: 'User' },
        organisation: { id: 'org-1', name: 'Test Organisation' },
      };

      mockPrismaService.policyDocument.create.mockResolvedValue(mockCreatedDocument);
      mockAuditService.log.mockResolvedValue({ id: 'audit-1' });

      const result = await service.create(createData, 'user-1');

      expect(result).toEqual(mockCreatedDocument);
      expect(mockPrismaService.policyDocument.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          createdBy: { connect: { id: 'user-1' } },
        },
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          organisation: { select: { id: true, name: true } },
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-new',
        action: 'CREATED',
        description: 'Document "New Security Policy" (POL-001) created',
        performedById: 'user-1',
      });
    });

    it('should create document without audit log when userId is not provided', async () => {
      const createData = {
        documentId: 'POL-001',
        title: 'New Policy',
        documentType: 'POLICY' as DocumentType,
        purpose: 'Protect customer data.',
        scope: 'Applies to the product team.',
        content: 'Policy content',
        documentOwner: 'Product Team',
        author: 'RiskReady',
        approvalLevel: 'MANAGEMENT' as const,
        organisation: { connect: { id: 'org-1' } },
      };

      const mockCreatedDocument = {
        id: 'doc-new',
        documentId: 'POL-001',
        title: 'New Policy',
        owner: null,
        organisation: { id: 'org-1', name: 'Test Organisation' },
      };

      mockPrismaService.policyDocument.create.mockResolvedValue(mockCreatedDocument);

      const result = await service.create(createData);

      expect(result).toEqual(mockCreatedDocument);
      expect(mockPrismaService.policyDocument.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          createdBy: undefined,
        },
        include: expect.any(Object),
      });
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a document and log audit event', async () => {
      const existingDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Original Title',
        status: 'DRAFT',
      };

      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        version: '1.1',
      };

      const mockUpdatedDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Updated Title',
        content: 'Updated content',
        version: '1.1',
        status: 'DRAFT',
        owner: { id: 'user-1', email: 'owner@test.com', firstName: 'Owner', lastName: 'User' },
        organisation: { id: 'org-1', name: 'Test Organisation' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(existingDocument);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockUpdatedDocument);
      mockAuditService.log.mockResolvedValue({ id: 'audit-1' });

      const result = await service.update('doc-1', updateData, 'user-1');

      expect(result).toEqual(mockUpdatedDocument);
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          ...updateData,
          updatedBy: { connect: { id: 'user-1' } },
        },
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
          organisation: { select: { id: true, name: true } },
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'UPDATED',
        description: 'Document "Updated Title" (POL-001) updated',
        performedById: 'user-1',
        previousValue: { title: 'Original Title', status: 'DRAFT' },
        newValue: { title: 'Updated Title', status: 'DRAFT' },
      });
    });

    it('should update document without audit log when userId is not provided', async () => {
      const existingDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Original Title',
        status: 'DRAFT',
      };

      const updateData = {
        title: 'Updated Title',
      };

      const mockUpdatedDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Updated Title',
        status: 'DRAFT',
        owner: null,
        organisation: { id: 'org-1', name: 'Test Organisation' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(existingDocument);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockUpdatedDocument);

      const result = await service.update('doc-1', updateData);

      expect(result).toEqual(mockUpdatedDocument);
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when document does not exist', async () => {
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', { title: 'New Title' }, 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status to PUBLISHED and set effectiveDate', async () => {
      const existingDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Security Policy',
        status: 'APPROVED',
      };

      const mockUpdatedDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Security Policy',
        status: 'PUBLISHED',
        effectiveDate: expect.any(Date),
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(existingDocument);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockUpdatedDocument);
      mockAuditService.log.mockResolvedValue({ id: 'audit-1' });

      const result = await service.updateStatus('doc-1', 'PUBLISHED', 'user-1');

      expect(result).toEqual(mockUpdatedDocument);
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          status: 'PUBLISHED',
          effectiveDate: expect.any(Date),
          updatedBy: { connect: { id: 'user-1' } },
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'PUBLISHED',
        description: 'Document status changed from APPROVED to PUBLISHED',
        performedById: 'user-1',
        previousValue: { status: 'APPROVED' },
        newValue: { status: 'PUBLISHED' },
      });
    });

    it('should update status to RETIRED and set retirementDate', async () => {
      const existingDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Old Policy',
        status: 'PUBLISHED',
      };

      const mockUpdatedDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Old Policy',
        status: 'RETIRED',
        retirementDate: expect.any(Date),
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(existingDocument);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockUpdatedDocument);
      mockAuditService.log.mockResolvedValue({ id: 'audit-1' });

      const result = await service.updateStatus('doc-1', 'RETIRED', 'user-1');

      expect(result.status).toBe('RETIRED');
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          status: 'RETIRED',
          retirementDate: expect.any(Date),
          updatedBy: { connect: { id: 'user-1' } },
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RETIRED',
        })
      );
    });

    it('should map status to correct audit action', async () => {
      const existingDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Policy',
        status: 'DRAFT',
      };

      const mockUpdatedDocument = {
        id: 'doc-1',
        status: 'PENDING_REVIEW',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(existingDocument);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockUpdatedDocument);
      mockAuditService.log.mockResolvedValue({ id: 'audit-1' });

      await service.updateStatus('doc-1', 'PENDING_REVIEW', 'user-1');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUBMITTED_FOR_REVIEW',
        })
      );
    });
  });

  describe('delete', () => {
    it('should soft delete by archiving when softDelete is true', async () => {
      const existingDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Policy to Archive',
        status: 'DRAFT',
      };

      const mockArchivedDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Policy to Archive',
        status: 'ARCHIVED',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(existingDocument);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockArchivedDocument);
      mockAuditService.log.mockResolvedValue({ id: 'audit-1' });

      const result = await service.delete('doc-1', 'user-1', true);

      expect('status' in result).toBe(true);
      if ('status' in result) {
        expect(result.status).toBe('ARCHIVED');
      }
      expect(mockPrismaService.policyDocument.delete).not.toHaveBeenCalled();
    });

    it('should hard delete when softDelete is false', async () => {
      const existingDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Policy to Delete',
        status: 'DRAFT',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(existingDocument);
      mockPrismaService.policyDocument.delete.mockResolvedValue({ id: 'doc-1' });

      const result = await service.delete('doc-1', 'user-1', false);

      expect(result).toEqual({ deleted: true, documentId: 'POL-001' });
      expect(mockPrismaService.policyDocument.delete).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
    });

    it('should default to soft delete', async () => {
      const existingDocument = {
        id: 'doc-1',
        documentId: 'POL-001',
        title: 'Policy',
        status: 'DRAFT',
      };

      const mockArchivedDocument = {
        id: 'doc-1',
        status: 'ARCHIVED',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(existingDocument);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockArchivedDocument);
      mockAuditService.log.mockResolvedValue({ id: 'audit-1' });

      await service.delete('doc-1', 'user-1');

      expect(mockPrismaService.policyDocument.delete).not.toHaveBeenCalled();
    });
  });

  describe('getHierarchy', () => {
    it('should build document hierarchy tree', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Parent Policy',
          documentType: 'POLICY',
          status: 'PUBLISHED',
          parentDocumentId: null,
          version: '1.0',
          nextReviewDate: new Date('2024-12-31'),
        },
        {
          id: 'doc-2',
          documentId: 'PRO-001',
          title: 'Child Procedure',
          documentType: 'PROCEDURE',
          status: 'APPROVED',
          parentDocumentId: 'doc-1',
          version: '1.0',
          nextReviewDate: new Date('2024-12-31'),
        },
        {
          id: 'doc-3',
          documentId: 'WI-001',
          title: 'Grandchild Work Instruction',
          documentType: 'WORK_INSTRUCTION',
          status: 'DRAFT',
          parentDocumentId: 'doc-2',
          version: '0.1',
          nextReviewDate: null,
        },
        {
          id: 'doc-4',
          documentId: 'POL-002',
          title: 'Another Parent',
          documentType: 'POLICY',
          status: 'PUBLISHED',
          parentDocumentId: null,
          version: '2.0',
          nextReviewDate: new Date('2025-06-30'),
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getHierarchy('org-1');
      const [firstRoot, secondRoot] = result;
      const [firstChild] = firstRoot?.children ?? [];
      const [firstGrandchild] = firstChild?.children ?? [];

      expect(result).toHaveLength(2); // Two root documents
      expect(firstRoot).toBeDefined();
      expect(secondRoot).toBeDefined();
      expect(firstChild).toBeDefined();
      expect(firstGrandchild).toBeDefined();
      expect(firstRoot?.['documentId']).toBe('POL-001');
      expect(firstRoot?.children).toHaveLength(1);
      expect(firstChild?.['documentId']).toBe('PRO-001');
      expect(firstChild?.children).toHaveLength(1);
      expect(firstGrandchild?.['documentId']).toBe('WI-001');
      expect(secondRoot?.['documentId']).toBe('POL-002');
      expect(secondRoot?.children).toHaveLength(0);
    });

    it('should return empty array when no documents exist', async () => {
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      const result = await service.getHierarchy('org-1');

      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive statistics', async () => {
      const mockStats = {
        total: 50,
        byType: [
          { documentType: 'POLICY', _count: 20 },
          { documentType: 'PROCEDURE', _count: 15 },
          { documentType: 'WORK_INSTRUCTION', _count: 10 },
          { documentType: 'GUIDELINE', _count: 5 },
        ],
        byStatus: [
          { status: 'PUBLISHED', _count: 30 },
          { status: 'APPROVED', _count: 10 },
          { status: 'DRAFT', _count: 8 },
          { status: 'RETIRED', _count: 2 },
        ],
        reviewsDue: 5,
        reviewsOverdue: 3,
        pendingAcknowledgments: 25,
        activeExceptions: 4,
      };

      mockPrismaService.policyDocument.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(5)  // reviewsDue
        .mockResolvedValueOnce(3); // reviewsOverdue
      mockPrismaService.policyDocument.groupBy
        .mockResolvedValueOnce(mockStats.byType)
        .mockResolvedValueOnce(mockStats.byStatus);
      mockPrismaService.documentAcknowledgment.count.mockResolvedValue(25);
      mockPrismaService.documentException.count.mockResolvedValue(4);

      const result = await service.getStats('org-1');

      expect(result.total).toBe(50);
      expect(result.byType).toEqual({
        POLICY: 20,
        PROCEDURE: 15,
        WORK_INSTRUCTION: 10,
        GUIDELINE: 5,
      });
      expect(result.byStatus).toEqual({
        PUBLISHED: 30,
        APPROVED: 10,
        DRAFT: 8,
        RETIRED: 2,
      });
      expect(result.reviewsDue).toBe(5);
      expect(result.reviewsOverdue).toBe(3);
      expect(result.pendingAcknowledgments).toBe(25);
      expect(result.activeExceptions).toBe(4);
    });
  });

  describe('search', () => {
    it('should search documents by query string', async () => {
      const mockSearchResults = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Security Policy',
          documentType: 'POLICY',
          status: 'PUBLISHED',
          version: '1.0',
          nextReviewDate: new Date('2024-12-31'),
          owner: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        },
        {
          id: 'doc-2',
          documentId: 'POL-002',
          title: 'Data Security Procedure',
          documentType: 'PROCEDURE',
          status: 'APPROVED',
          version: '2.1',
          nextReviewDate: new Date('2025-06-30'),
          owner: { id: 'user-2', firstName: 'Jane', lastName: 'Smith' },
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockSearchResults);
      mockPrismaService.policyDocument.count.mockResolvedValue(2);

      const result = await service.search({
        organisationId: 'org-1',
        query: 'security',
        skip: 0,
        take: 10,
      });

      expect(result.results).toEqual(mockSearchResults);
      expect(result.count).toBe(2);
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organisationId: 'org-1',
          OR: expect.arrayContaining([
            { documentId: { contains: 'security', mode: 'insensitive' } },
            { title: { contains: 'security', mode: 'insensitive' } },
            { content: { contains: 'security', mode: 'insensitive' } },
            { keywords: { hasSome: ['security'] } },
          ]),
        }),
        skip: 0,
        take: 10,
        orderBy: { documentId: 'asc' },
        select: expect.any(Object),
      });
    });

    it('should filter by document type and status', async () => {
      const mockSearchResults = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Published Policy',
          documentType: 'POLICY',
          status: 'PUBLISHED',
          version: '1.0',
          nextReviewDate: null,
          owner: null,
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockSearchResults);
      mockPrismaService.policyDocument.count.mockResolvedValue(1);

      const result = await service.search({
        organisationId: 'org-1',
        documentType: 'POLICY',
        status: 'PUBLISHED',
      });

      expect(result.results).toEqual(mockSearchResults);
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organisationId: 'org-1',
          documentType: 'POLICY',
          status: 'PUBLISHED',
        }),
        skip: undefined,
        take: undefined,
        orderBy: { documentId: 'asc' },
        select: expect.any(Object),
      });
    });

    it('should filter by tags', async () => {
      const mockSearchResults = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Tagged Policy',
          documentType: 'POLICY',
          status: 'PUBLISHED',
          version: '1.0',
          nextReviewDate: null,
          owner: null,
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockSearchResults);
      mockPrismaService.policyDocument.count.mockResolvedValue(1);

      await service.search({
        organisationId: 'org-1',
        tags: ['security', 'compliance'],
      });

      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tags: { hasSome: ['security', 'compliance'] },
        }),
        skip: undefined,
        take: undefined,
        orderBy: { documentId: 'asc' },
        select: expect.any(Object),
      });
    });

    it('should filter by control and risk mappings', async () => {
      const mockSearchResults: Array<Record<string, unknown>> = [];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockSearchResults);
      mockPrismaService.policyDocument.count.mockResolvedValue(0);

      await service.search({
        organisationId: 'org-1',
        controlId: 'control-1',
        riskId: 'risk-1',
      });

      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          controlMappings: { some: { controlId: 'control-1' } },
          riskMappings: { some: { riskId: 'risk-1' } },
        }),
        skip: undefined,
        take: undefined,
        orderBy: { documentId: 'asc' },
        select: expect.any(Object),
      });
    });
  });

  describe('getUpcomingReviews', () => {
    it('should return documents with reviews due within specified days', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Policy Due Soon',
          documentType: 'POLICY',
          nextReviewDate: new Date('2024-02-15'),
          reviewFrequency: 'ANNUAL',
          owner: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        },
        {
          id: 'doc-2',
          documentId: 'POL-002',
          title: 'Another Policy',
          documentType: 'PROCEDURE',
          nextReviewDate: new Date('2024-02-20'),
          reviewFrequency: 'QUARTERLY',
          owner: { id: 'user-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getUpcomingReviews('org-1', 30);

      expect(result).toEqual(mockDocuments);
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        where: {
          organisationId: 'org-1',
          status: 'PUBLISHED',
          nextReviewDate: {
            lte: expect.any(Date),
            gte: expect.any(Date),
          },
        },
        select: {
          id: true,
          documentId: true,
          title: true,
          documentType: true,
          nextReviewDate: true,
          reviewFrequency: true,
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { nextReviewDate: 'asc' },
      });
    });

    it('should use default 30 days if not specified', async () => {
      mockPrismaService.policyDocument.findMany.mockResolvedValue([]);

      await service.getUpcomingReviews('org-1');

      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nextReviewDate: expect.objectContaining({
              lte: expect.any(Date),
              gte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('getOverdueReviews', () => {
    it('should return documents with overdue reviews', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Overdue Policy',
          documentType: 'POLICY',
          nextReviewDate: new Date('2023-12-01'),
          lastReviewDate: new Date('2022-12-01'),
          owner: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        },
      ];

      mockPrismaService.policyDocument.findMany.mockResolvedValue(mockDocuments);

      const result = await service.getOverdueReviews('org-1');

      expect(result).toEqual(mockDocuments);
      expect(mockPrismaService.policyDocument.findMany).toHaveBeenCalledWith({
        where: {
          organisationId: 'org-1',
          status: 'PUBLISHED',
          nextReviewDate: { lt: expect.any(Date) },
        },
        select: {
          id: true,
          documentId: true,
          title: true,
          documentType: true,
          nextReviewDate: true,
          lastReviewDate: true,
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { nextReviewDate: 'asc' },
      });
    });
  });

  describe('generateDocumentId', () => {
    it('should generate document ID for POLICY type', async () => {
      mockPrismaService.policyDocument.count.mockResolvedValue(5);

      const result = await service.generateDocumentId('POLICY', 'org-1');

      expect(result).toBe('POL-006');
      expect(mockPrismaService.policyDocument.count).toHaveBeenCalledWith({
        where: { organisationId: 'org-1', documentType: 'POLICY' },
      });
    });

    it('should generate document ID for STANDARD type', async () => {
      mockPrismaService.policyDocument.count.mockResolvedValue(0);

      const result = await service.generateDocumentId('STANDARD', 'org-1');

      expect(result).toBe('STD-001');
    });

    it('should generate document ID for PROCEDURE type', async () => {
      mockPrismaService.policyDocument.count.mockResolvedValue(99);

      const result = await service.generateDocumentId('PROCEDURE', 'org-1');

      expect(result).toBe('PRO-100');
    });

    it('should generate document ID for all document types', async () => {
      mockPrismaService.policyDocument.count.mockResolvedValue(0);

      const types: DocumentType[] = [
        'POLICY',
        'STANDARD',
        'PROCEDURE',
        'WORK_INSTRUCTION',
        'FORM',
        'TEMPLATE',
        'CHECKLIST',
        'GUIDELINE',
        'RECORD',
      ];
      const expectedPrefixes = ['POL', 'STD', 'PRO', 'WI', 'FRM', 'TPL', 'CHK', 'GDL', 'REC'];

      for (const [index, type] of types.entries()) {
        const result = await service.generateDocumentId(type, 'org-1');
        expect(result).toBe(`${expectedPrefixes[index]}-001`);
      }
    });

    it('should generate hierarchical ID when parent document exists', async () => {
      const mockParentDocument = {
        id: 'parent-1',
        documentId: 'POL-005',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockParentDocument);
      mockPrismaService.policyDocument.count.mockResolvedValue(2);

      const result = await service.generateDocumentId('PROCEDURE', 'org-1', 'parent-1');

      expect(result).toBe('PRO-005-03');
      expect(mockPrismaService.policyDocument.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        select: { documentId: true },
      });
      expect(mockPrismaService.policyDocument.count).toHaveBeenCalledWith({
        where: { organisationId: 'org-1', parentDocumentId: 'parent-1' },
      });
    });

    it('should handle parent with complex document ID', async () => {
      const mockParentDocument = {
        id: 'parent-1',
        documentId: 'POL-123-ABC',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockParentDocument);
      mockPrismaService.policyDocument.count.mockResolvedValue(0);

      const result = await service.generateDocumentId('WORK_INSTRUCTION', 'org-1', 'parent-1');

      expect(result).toBe('WI-123-01');
    });

    it('should fall back to non-hierarchical when parent not found', async () => {
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);
      mockPrismaService.policyDocument.count.mockResolvedValue(10);

      const result = await service.generateDocumentId('PROCEDURE', 'org-1', 'non-existent-parent');

      expect(result).toBe('PRO-011');
    });

    it('should pad numbers correctly with leading zeros', async () => {
      mockPrismaService.policyDocument.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(9)
        .mockResolvedValueOnce(99)
        .mockResolvedValueOnce(999);

      expect(await service.generateDocumentId('POLICY', 'org-1')).toBe('POL-001');
      expect(await service.generateDocumentId('POLICY', 'org-1')).toBe('POL-010');
      expect(await service.generateDocumentId('POLICY', 'org-1')).toBe('POL-100');
      expect(await service.generateDocumentId('POLICY', 'org-1')).toBe('POL-1000');
    });
  });
});
