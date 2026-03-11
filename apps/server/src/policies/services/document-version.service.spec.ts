import { Test, TestingModule } from '@nestjs/testing';
import { DocumentVersionService } from './document-version.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PolicyAuditService } from './policy-audit.service';
import { NotFoundException } from '@nestjs/common';
import { ChangeType } from '@prisma/client';

describe('DocumentVersionService', () => {
  let service: DocumentVersionService;
  let prismaService: PrismaService;
  let auditService: PolicyAuditService;

  const mockPrismaService = {
    documentVersion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    policyDocument: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentVersionService,
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

    service = module.get<DocumentVersionService>(DocumentVersionService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<PolicyAuditService>(PolicyAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all versions for a document ordered by createdAt desc', async () => {
      const documentId = 'doc-1';
      const mockVersions = [
        {
          id: 'version-2',
          documentId,
          version: '2.0',
          majorVersion: 2,
          minorVersion: 0,
          content: 'Updated content',
          changeDescription: 'Major update',
          changeType: 'MAJOR_REVISION',
          createdAt: new Date('2024-01-02'),
          createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
        {
          id: 'version-1',
          documentId,
          version: '1.0',
          majorVersion: 1,
          minorVersion: 0,
          content: 'Initial content',
          changeDescription: 'Initial version',
          changeType: 'INITIAL_DRAFT',
          createdAt: new Date('2024-01-01'),
          createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.documentVersion.findMany.mockResolvedValue(mockVersions);

      const result = await service.findAll(documentId);

      expect(result).toEqual(mockVersions);
      expect(mockPrismaService.documentVersion.findMany).toHaveBeenCalledWith({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should return empty array when no versions exist', async () => {
      mockPrismaService.documentVersion.findMany.mockResolvedValue([]);

      const result = await service.findAll('doc-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single version with document and creator details', async () => {
      const versionId = 'version-1';
      const mockVersion = {
        id: versionId,
        documentId: 'doc-1',
        version: '1.0',
        majorVersion: 1,
        minorVersion: 0,
        content: 'Version content',
        changeDescription: 'Initial version',
        changeType: 'INITIAL_DRAFT',
        document: { id: 'doc-1', documentId: 'DOC-001', title: 'Test Document' },
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentVersion.findUnique.mockResolvedValue(mockVersion);

      const result = await service.findOne(versionId);

      expect(result).toEqual(mockVersion);
      expect(mockPrismaService.documentVersion.findUnique).toHaveBeenCalledWith({
        where: { id: versionId },
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should throw NotFoundException when version does not exist', async () => {
      const versionId = 'non-existent';
      mockPrismaService.documentVersion.findUnique.mockResolvedValue(null);

      await expect(service.findOne(versionId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(versionId)).rejects.toThrow(
        `Version with ID ${versionId} not found`
      );
    });
  });

  describe('findByVersion', () => {
    it('should return version by document ID and version number', async () => {
      const documentId = 'doc-1';
      const versionNumber = '2.0';
      const mockVersion = {
        id: 'version-2',
        documentId,
        version: versionNumber,
        majorVersion: 2,
        minorVersion: 0,
        content: 'Version 2 content',
        changeDescription: 'Major update',
        changeType: 'MAJOR_REVISION',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentVersion.findFirst.mockResolvedValue(mockVersion);

      const result = await service.findByVersion(documentId, versionNumber);

      expect(result).toEqual(mockVersion);
      expect(mockPrismaService.documentVersion.findFirst).toHaveBeenCalledWith({
        where: { documentId, version: versionNumber },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should return null when version is not found', async () => {
      mockPrismaService.documentVersion.findFirst.mockResolvedValue(null);

      const result = await service.findByVersion('doc-1', '99.0');

      expect(result).toBeNull();
    });
  });

  describe('createVersion', () => {
    const mockDocument = {
      id: 'doc-1',
      documentId: 'DOC-001',
      title: 'Test Document',
      content: 'Current content',
      version: '1.0',
      majorVersion: 1,
      minorVersion: 0,
    };

    it('should create a minor version when isMajor is false', async () => {
      const createData = {
        documentId: 'doc-1',
        changeDescription: 'Minor update',
        changeType: 'MINOR_UPDATE' as ChangeType,
        isMajor: false,
        userId: 'user-1',
      };

      const mockPreviousVersion = {
        content: 'Previous content',
      };

      const mockCreatedVersion = {
        id: 'version-new',
        documentId: 'doc-1',
        version: '1.1',
        majorVersion: 1,
        minorVersion: 1,
        content: 'Current content',
        changeDescription: 'Minor update',
        changeType: 'MINOR_UPDATE',
        diffFromPrevious: '- Previous content\n+ Current content',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.findFirst.mockResolvedValue(mockPreviousVersion);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockCreatedVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue({ ...mockDocument, version: '1.1' });

      const result = await service.createVersion(createData);

      expect(result).toEqual(mockCreatedVersion);
      expect(mockPrismaService.documentVersion.create).toHaveBeenCalledWith({
        data: {
          document: { connect: { id: 'doc-1' } },
          version: '1.1',
          majorVersion: 1,
          minorVersion: 1,
          content: 'Current content',
          changeDescription: 'Minor update',
          changeSummary: undefined,
          changeType: 'MINOR_UPDATE',
          diffFromPrevious: expect.any(String),
          createdBy: { connect: { id: 'user-1' } },
        },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: {
          version: '1.1',
          majorVersion: 1,
          minorVersion: 1,
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId: 'doc-1',
        action: 'VERSION_CREATED',
        description: 'Version 1.1 created: Minor update',
        performedById: 'user-1',
        previousValue: { version: '1.0' },
        newValue: { version: '1.1', changeType: 'MINOR_UPDATE' },
      });
    });

    it('should create a major version when isMajor is true', async () => {
      const createData = {
        documentId: 'doc-1',
        changeDescription: 'Major revision',
        changeType: 'CONTENT_UPDATE' as ChangeType,
        isMajor: true,
        userId: 'user-1',
      };

      const mockCreatedVersion = {
        id: 'version-new',
        documentId: 'doc-1',
        version: '2.0',
        majorVersion: 2,
        minorVersion: 0,
        content: 'Current content',
        changeDescription: 'Major revision',
        changeType: 'CONTENT_UPDATE',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.findFirst.mockResolvedValue(null);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockCreatedVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue({ ...mockDocument, version: '2.0' });

      const result = await service.createVersion(createData);

      expect(result.version).toBe('2.0');
      expect(result.majorVersion).toBe(2);
      expect(result.minorVersion).toBe(0);
    });

    it('should create a major version when changeType is MAJOR_REVISION', async () => {
      const createData = {
        documentId: 'doc-1',
        changeDescription: 'Major revision',
        changeType: 'MAJOR_REVISION' as ChangeType,
        isMajor: false,
        userId: 'user-1',
      };

      const mockCreatedVersion = {
        id: 'version-new',
        documentId: 'doc-1',
        version: '2.0',
        majorVersion: 2,
        minorVersion: 0,
        content: 'Current content',
        changeDescription: 'Major revision',
        changeType: 'MAJOR_REVISION',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.findFirst.mockResolvedValue(null);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockCreatedVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue({ ...mockDocument, version: '2.0' });

      const result = await service.createVersion(createData);

      expect(result.version).toBe('2.0');
      expect(result.majorVersion).toBe(2);
      expect(result.minorVersion).toBe(0);
    });

    it('should create a major version when changeType is RESTRUCTURE', async () => {
      const createData = {
        documentId: 'doc-1',
        changeDescription: 'Document restructure',
        changeType: 'RESTRUCTURE' as ChangeType,
        userId: 'user-1',
      };

      const mockCreatedVersion = {
        id: 'version-new',
        documentId: 'doc-1',
        version: '2.0',
        majorVersion: 2,
        minorVersion: 0,
        content: 'Current content',
        changeDescription: 'Document restructure',
        changeType: 'RESTRUCTURE',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.findFirst.mockResolvedValue(null);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockCreatedVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue({ ...mockDocument, version: '2.0' });

      const result = await service.createVersion(createData);

      expect(result.version).toBe('2.0');
      expect(result.majorVersion).toBe(2);
      expect(result.minorVersion).toBe(0);
    });

    it('should create version without userId', async () => {
      const createData = {
        documentId: 'doc-1',
        changeDescription: 'System update',
        changeType: 'CONTENT_UPDATE' as ChangeType,
      };

      const mockCreatedVersion = {
        id: 'version-new',
        documentId: 'doc-1',
        version: '1.1',
        majorVersion: 1,
        minorVersion: 1,
        content: 'Current content',
        changeDescription: 'System update',
        changeType: 'CONTENT_UPDATE',
        createdBy: null,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.findFirst.mockResolvedValue(null);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockCreatedVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue({ ...mockDocument, version: '1.1' });

      const result = await service.createVersion(createData);

      expect(result).toEqual(mockCreatedVersion);
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should include changeSummary when provided', async () => {
      const createData = {
        documentId: 'doc-1',
        changeDescription: 'Updated security policies',
        changeSummary: 'Added new authentication requirements',
        changeType: 'CONTENT_UPDATE' as ChangeType,
        userId: 'user-1',
      };

      const mockCreatedVersion = {
        id: 'version-new',
        documentId: 'doc-1',
        version: '1.1',
        majorVersion: 1,
        minorVersion: 1,
        content: 'Current content',
        changeDescription: 'Updated security policies',
        changeSummary: 'Added new authentication requirements',
        changeType: 'CONTENT_UPDATE',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.findFirst.mockResolvedValue(null);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockCreatedVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue({ ...mockDocument, version: '1.1' });

      const result = await service.createVersion(createData);

      expect(result.changeSummary).toBe('Added new authentication requirements');
    });

    it('should throw NotFoundException when document does not exist', async () => {
      const createData = {
        documentId: 'non-existent',
        changeDescription: 'Update',
        changeType: 'CONTENT_UPDATE' as ChangeType,
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);

      await expect(service.createVersion(createData)).rejects.toThrow(NotFoundException);
      await expect(service.createVersion(createData)).rejects.toThrow(
        'Document with ID non-existent not found'
      );
    });

    it('should generate diff from previous version', async () => {
      const createData = {
        documentId: 'doc-1',
        changeDescription: 'Content change',
        changeType: 'CONTENT_UPDATE' as ChangeType,
        userId: 'user-1',
      };

      const mockPreviousVersion = {
        content: 'Line 1\nLine 2\nLine 3',
      };

      const mockDocumentWithChanges = {
        ...mockDocument,
        content: 'Line 1\nLine 2 Modified\nLine 3',
      };

      const mockCreatedVersion = {
        id: 'version-new',
        documentId: 'doc-1',
        version: '1.1',
        majorVersion: 1,
        minorVersion: 1,
        content: 'Line 1\nLine 2 Modified\nLine 3',
        changeDescription: 'Content change',
        changeType: 'CONTENT_UPDATE',
        diffFromPrevious: '- Line 2\n+ Line 2 Modified',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocumentWithChanges);
      mockPrismaService.documentVersion.findFirst.mockResolvedValue(mockPreviousVersion);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockCreatedVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue({ ...mockDocument, version: '1.1' });

      const result = await service.createVersion(createData);

      expect(result.diffFromPrevious).toBeTruthy();
      expect(mockPrismaService.documentVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            diffFromPrevious: expect.any(String),
          }),
        })
      );
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions and return diff', async () => {
      const documentId = 'doc-1';
      const version1Data = {
        id: 'version-1',
        documentId,
        version: '1.0',
        content: 'Original content\nLine 2',
        changeType: 'INITIAL_DRAFT',
        changeDescription: 'Initial version',
        createdAt: new Date('2024-01-01'),
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      const version2Data = {
        id: 'version-2',
        documentId,
        version: '2.0',
        content: 'Updated content\nLine 2',
        changeType: 'MAJOR_REVISION',
        changeDescription: 'Major update',
        createdAt: new Date('2024-01-02'),
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentVersion.findFirst
        .mockResolvedValueOnce(version1Data)
        .mockResolvedValueOnce(version2Data);

      const result = await service.compareVersions(documentId, '1.0', '2.0');

      expect(result).toHaveProperty('version1');
      expect(result).toHaveProperty('version2');
      expect(result).toHaveProperty('diff');
      expect(result.version1.version).toBe('1.0');
      expect(result.version2.version).toBe('2.0');
      expect(result.diff).toContain('- Original content');
      expect(result.diff).toContain('+ Updated content');
    });

    it('should throw NotFoundException when version1 is not found', async () => {
      mockPrismaService.documentVersion.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'version-2', version: '2.0' });

      await expect(service.compareVersions('doc-1', '1.0', '2.0')).rejects.toThrow(
        'One or both versions not found'
      );
    });

    it('should throw NotFoundException when version2 is not found', async () => {
      mockPrismaService.documentVersion.findFirst
        .mockResolvedValueOnce({ id: 'version-1', version: '1.0' })
        .mockResolvedValueOnce(null);

      await expect(service.compareVersions('doc-1', '1.0', '2.0')).rejects.toThrow(
        'One or both versions not found'
      );
    });

    it('should handle identical versions with no diff', async () => {
      const documentId = 'doc-1';
      const versionData = {
        id: 'version-1',
        documentId,
        version: '1.0',
        content: 'Same content',
        changeType: 'INITIAL_DRAFT',
        changeDescription: 'Initial version',
        createdAt: new Date('2024-01-01'),
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentVersion.findFirst
        .mockResolvedValueOnce(versionData)
        .mockResolvedValueOnce({ ...versionData, id: 'version-2', version: '1.1' });

      const result = await service.compareVersions(documentId, '1.0', '1.1');

      expect(result.diff).toBe('');
    });
  });

  describe('getVersionHistory', () => {
    it('should return paginated version history', async () => {
      const documentId = 'doc-1';
      const mockVersions = [
        {
          id: 'version-3',
          documentId,
          version: '3.0',
          createdAt: new Date('2024-01-03'),
          createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
        {
          id: 'version-2',
          documentId,
          version: '2.0',
          createdAt: new Date('2024-01-02'),
          createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
      ];

      mockPrismaService.documentVersion.findMany.mockResolvedValue(mockVersions);
      mockPrismaService.documentVersion.count.mockResolvedValue(5);

      const result = await service.getVersionHistory(documentId, { skip: 0, take: 2 });

      expect(result.versions).toEqual(mockVersions);
      expect(result.count).toBe(5);
      expect(mockPrismaService.documentVersion.findMany).toHaveBeenCalledWith({
        where: { documentId },
        skip: 0,
        take: 2,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
      expect(mockPrismaService.documentVersion.count).toHaveBeenCalledWith({
        where: { documentId },
      });
    });

    it('should return all versions when no pagination params provided', async () => {
      const documentId = 'doc-1';
      const mockVersions = [
        { id: 'version-1', documentId, version: '1.0' },
        { id: 'version-2', documentId, version: '2.0' },
      ];

      mockPrismaService.documentVersion.findMany.mockResolvedValue(mockVersions);
      mockPrismaService.documentVersion.count.mockResolvedValue(2);

      const result = await service.getVersionHistory(documentId);

      expect(result.versions).toEqual(mockVersions);
      expect(result.count).toBe(2);
      expect(mockPrismaService.documentVersion.findMany).toHaveBeenCalledWith({
        where: { documentId },
        skip: undefined,
        take: undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });

    it('should return empty result when no versions exist', async () => {
      mockPrismaService.documentVersion.findMany.mockResolvedValue([]);
      mockPrismaService.documentVersion.count.mockResolvedValue(0);

      const result = await service.getVersionHistory('doc-1');

      expect(result.versions).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('rollback', () => {
    it('should rollback document to target version and create new version', async () => {
      const documentId = 'doc-1';
      const targetVersion = '1.0';
      const userId = 'user-1';

      const mockTargetVersion = {
        id: 'version-1',
        documentId,
        version: targetVersion,
        content: 'Version 1.0 content',
        changeType: 'INITIAL_DRAFT',
        changeDescription: 'Initial version',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      const mockDocument = {
        id: documentId,
        documentId: 'DOC-001',
        title: 'Test Document',
        content: 'Version 1.0 content',
        version: '1.0',
        majorVersion: 1,
        minorVersion: 0,
        status: 'UNDER_REVISION',
      };

      const mockNewVersion = {
        id: 'version-rollback',
        documentId,
        version: '1.1',
        majorVersion: 1,
        minorVersion: 1,
        content: 'Version 1.0 content',
        changeDescription: 'Rolled back to version 1.0',
        changeType: 'CORRECTION',
        createdBy: { id: userId, email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentVersion.findFirst.mockResolvedValue(mockTargetVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockDocument);
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockNewVersion);

      const result = await service.rollback(documentId, targetVersion, userId);

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: {
          content: mockTargetVersion.content,
          status: 'UNDER_REVISION',
          updatedBy: { connect: { id: userId } },
        },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith({
        documentId,
        action: 'RESTORED',
        description: `Document rolled back to version ${targetVersion}`,
        performedById: userId,
      });
    });

    it('should rollback without userId', async () => {
      const documentId = 'doc-1';
      const targetVersion = '1.0';

      const mockTargetVersion = {
        id: 'version-1',
        documentId,
        version: targetVersion,
        content: 'Version 1.0 content',
        changeType: 'INITIAL_DRAFT',
        changeDescription: 'Initial version',
        createdBy: null,
      };

      const mockDocument = {
        id: documentId,
        documentId: 'DOC-001',
        title: 'Test Document',
        content: 'Version 1.0 content',
        version: '1.0',
        majorVersion: 1,
        minorVersion: 0,
        status: 'UNDER_REVISION',
      };

      const mockNewVersion = {
        id: 'version-rollback',
        documentId,
        version: '1.1',
        majorVersion: 1,
        minorVersion: 1,
        content: 'Version 1.0 content',
        changeDescription: 'Rolled back to version 1.0',
        changeType: 'CORRECTION',
        createdBy: null,
      };

      mockPrismaService.documentVersion.findFirst.mockResolvedValue(mockTargetVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockDocument);
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.create.mockResolvedValue(mockNewVersion);

      const result = await service.rollback(documentId, targetVersion);

      expect(result).toEqual(mockDocument);
      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: {
          content: mockTargetVersion.content,
          status: 'UNDER_REVISION',
          updatedBy: undefined,
        },
      });
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when target version does not exist', async () => {
      const documentId = 'doc-1';
      const targetVersion = '99.0';

      mockPrismaService.documentVersion.findFirst.mockResolvedValue(null);

      await expect(service.rollback(documentId, targetVersion)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.rollback(documentId, targetVersion)).rejects.toThrow(
        `Version ${targetVersion} not found`
      );
    });

    it('should set document status to UNDER_REVISION on rollback', async () => {
      const documentId = 'doc-1';
      const targetVersion = '1.0';
      const userId = 'user-1';

      const mockTargetVersion = {
        id: 'version-1',
        documentId,
        version: targetVersion,
        content: 'Version 1.0 content',
        changeType: 'INITIAL_DRAFT',
        changeDescription: 'Initial version',
        createdBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      const mockDocument = {
        id: documentId,
        documentId: 'DOC-001',
        title: 'Test Document',
        content: 'Version 1.0 content',
        version: '1.0',
        majorVersion: 1,
        minorVersion: 0,
        status: 'UNDER_REVISION',
      };

      mockPrismaService.documentVersion.findFirst.mockResolvedValue(mockTargetVersion);
      mockPrismaService.policyDocument.update.mockResolvedValue(mockDocument);
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentVersion.create.mockResolvedValue({
        id: 'version-rollback',
        documentId,
        version: '1.1',
      });

      await service.rollback(documentId, targetVersion, userId);

      expect(mockPrismaService.policyDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'UNDER_REVISION',
          }),
        })
      );
    });
  });
});
