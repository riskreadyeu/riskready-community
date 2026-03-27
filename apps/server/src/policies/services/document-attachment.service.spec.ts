import { Test, TestingModule } from '@nestjs/testing';
import { DocumentAttachmentService } from './document-attachment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AttachmentType } from '@prisma/client';
import * as crypto from 'crypto';

describe('DocumentAttachmentService', () => {
  let service: DocumentAttachmentService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    documentAttachment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    policyDocument: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentAttachmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DocumentAttachmentService>(DocumentAttachmentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAttachments', () => {
    it('should return attachments for a document ordered by upload date', async () => {
      const documentId = 'doc-1';
      const mockAttachments = [
        {
          id: 'att-1',
          documentId,
          filename: 'risk-assessment.pdf',
          originalFilename: 'Risk Assessment 2024.pdf',
          mimeType: 'application/pdf',
          size: 1024000,
          attachmentType: 'SUPPORTING_EVIDENCE',
          uploadedAt: new Date(),
          uploadedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
        },
        {
          id: 'att-2',
          documentId,
          filename: 'policy-approval.pdf',
          originalFilename: 'Approval Document.pdf',
          mimeType: 'application/pdf',
          size: 512000,
          attachmentType: 'APPROVAL_SIGNATURE',
          uploadedAt: new Date(),
          uploadedBy: null,
        },
      ];

      mockPrismaService.documentAttachment.findMany.mockResolvedValue(mockAttachments);

      const result = await service.getAttachments(documentId);

      expect(result).toEqual(mockAttachments);
      expect(mockPrismaService.documentAttachment.findMany).toHaveBeenCalledWith({
        where: { documentId },
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });
    });

    it('should return empty array when no attachments exist', async () => {
      mockPrismaService.documentAttachment.findMany.mockResolvedValue([]);

      const result = await service.getAttachments('doc-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAttachment', () => {
    it('should return a single attachment with document and uploader details', async () => {
      const attachmentId = 'att-1';
      const mockAttachment = {
        id: attachmentId,
        documentId: 'doc-1',
        filename: 'test.pdf',
        document: {
          id: 'doc-1',
          documentId: 'POL-001',
          title: 'Security Policy',
          status: 'APPROVED',
        },
        uploadedBy: {
          id: 'user-1',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      mockPrismaService.documentAttachment.findUnique.mockResolvedValue(mockAttachment);

      const result = await service.getAttachment(attachmentId);

      expect(result).toEqual(mockAttachment);
    });

    it('should throw NotFoundException when attachment does not exist', async () => {
      mockPrismaService.documentAttachment.findUnique.mockResolvedValue(null);

      await expect(service.getAttachment('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getAttachment('non-existent')).rejects.toThrow(
        'Attachment with ID non-existent not found'
      );
    });
  });

  describe('createAttachment', () => {
    it('should create attachment with valid metadata', async () => {
      const createData = {
        documentId: 'doc-1',
        filename: '1234567890-abc123-risk-assessment.pdf',
        originalFilename: 'Risk Assessment.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        attachmentType: 'SUPPORTING_EVIDENCE' as AttachmentType,
        description: 'Annual risk assessment document',
        storagePath: '/storage/doc-1/1234567890-abc123-risk-assessment.pdf',
        checksum: 'a1b2c3d4e5f6',
        isEncrypted: false,
        uploadedById: 'user-1',
      };

      const mockDocument = { id: 'doc-1', title: 'Test Document' };
      const mockCreatedAttachment = {
        id: 'att-new',
        ...createData,
        uploadedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.documentAttachment.create.mockResolvedValue(mockCreatedAttachment);

      const result = await service.createAttachment(createData);

      expect(result).toEqual(mockCreatedAttachment);
      expect(mockPrismaService.policyDocument.findUnique).toHaveBeenCalledWith({
        where: { id: createData.documentId },
      });
    });

    it('should throw NotFoundException when document does not exist', async () => {
      const createData = {
        documentId: 'non-existent',
        filename: 'test.pdf',
        originalFilename: 'Test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        attachmentType: 'SUPPORTING_EVIDENCE' as AttachmentType,
        storagePath: '/storage/test.pdf',
        checksum: 'abc123',
      };

      mockPrismaService.policyDocument.findUnique.mockResolvedValue(null);

      await expect(service.createAttachment(createData)).rejects.toThrow(NotFoundException);
      await expect(service.createAttachment(createData)).rejects.toThrow(
        'Document with ID non-existent not found'
      );
    });

    it('should throw BadRequestException for file size exceeding maximum', async () => {
      const createData = {
        documentId: 'doc-1',
        filename: 'huge-file.pdf',
        originalFilename: 'Huge File.pdf',
        mimeType: 'application/pdf',
        size: 60 * 1024 * 1024, // 60MB - exceeds 50MB limit
        attachmentType: 'SUPPORTING_EVIDENCE' as AttachmentType,
        storagePath: '/storage/huge-file.pdf',
        checksum: 'abc123',
      };

      const mockDocument = { id: 'doc-1', title: 'Test Document' };
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);

      await expect(service.createAttachment(createData)).rejects.toThrow(BadRequestException);
      await expect(service.createAttachment(createData)).rejects.toThrow(
        /File size exceeds maximum allowed size/
      );
    });

    it('should throw BadRequestException for disallowed MIME type', async () => {
      const createData = {
        documentId: 'doc-1',
        filename: 'malicious.exe',
        originalFilename: 'Malicious.exe',
        mimeType: 'application/x-msdownload',
        size: 1024,
        attachmentType: 'SUPPORTING_EVIDENCE' as AttachmentType,
        storagePath: '/storage/malicious.exe',
        checksum: 'abc123',
      };

      const mockDocument = { id: 'doc-1', title: 'Test Document' };
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);

      await expect(service.createAttachment(createData)).rejects.toThrow(BadRequestException);
      await expect(service.createAttachment(createData)).rejects.toThrow(
        /File type .* is not allowed/
      );
    });

    it('should throw BadRequestException for zero or negative file size', async () => {
      const createData = {
        documentId: 'doc-1',
        filename: 'empty.pdf',
        originalFilename: 'Empty.pdf',
        mimeType: 'application/pdf',
        size: 0,
        attachmentType: 'SUPPORTING_EVIDENCE' as AttachmentType,
        storagePath: '/storage/empty.pdf',
        checksum: 'abc123',
      };

      const mockDocument = { id: 'doc-1', title: 'Test Document' };
      mockPrismaService.policyDocument.findUnique.mockResolvedValue(mockDocument);

      await expect(service.createAttachment(createData)).rejects.toThrow(BadRequestException);
      await expect(service.createAttachment(createData)).rejects.toThrow(
        /File size must be greater than 0/
      );
    });
  });

  describe('validateAttachmentMetadata', () => {
    it('should validate file with allowed MIME type and size', () => {
      const file = {
        size: 1024000,
        mimeType: 'application/pdf',
      };

      const result = service.validateAttachmentMetadata(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject file exceeding maximum size', () => {
      const file = {
        size: 60 * 1024 * 1024, // 60MB
        mimeType: 'application/pdf',
      };

      const result = service.validateAttachmentMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds maximum allowed size of 50MB');
    });

    it('should reject file with zero size', () => {
      const file = {
        size: 0,
        mimeType: 'application/pdf',
      };

      const result = service.validateAttachmentMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size must be greater than 0');
    });

    it('should reject file with disallowed MIME type', () => {
      const file = {
        size: 1024,
        mimeType: 'application/x-executable',
      };

      const result = service.validateAttachmentMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File type application/x-executable is not allowed');
    });

    it('should validate various allowed MIME types', () => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'application/json',
      ];

      allowedTypes.forEach((mimeType) => {
        const result = service.validateAttachmentMetadata({ size: 1024, mimeType });
        expect(result.valid).toBe(true);
      });
    });

    it('should accumulate multiple validation errors', () => {
      const file = {
        size: 60 * 1024 * 1024,
        mimeType: 'application/x-executable',
      };

      const result = service.validateAttachmentMetadata(file);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('generateChecksum', () => {
    it('should generate SHA-256 checksum for buffer', () => {
      const buffer = Buffer.from('test content');
      const checksum = service.generateChecksum(buffer);

      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBe(64); // SHA-256 hex is 64 characters
    });

    it('should generate consistent checksum for same content', () => {
      const buffer1 = Buffer.from('test content');
      const buffer2 = Buffer.from('test content');

      const checksum1 = service.generateChecksum(buffer1);
      const checksum2 = service.generateChecksum(buffer2);

      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksums for different content', () => {
      const buffer1 = Buffer.from('content one');
      const buffer2 = Buffer.from('content two');

      const checksum1 = service.generateChecksum(buffer1);
      const checksum2 = service.generateChecksum(buffer2);

      expect(checksum1).not.toBe(checksum2);
    });

    it('should generate expected SHA-256 hash', () => {
      const buffer = Buffer.from('hello world');
      const expectedHash = crypto.createHash('sha256').update(buffer).digest('hex');

      const checksum = service.generateChecksum(buffer);

      expect(checksum).toBe(expectedHash);
    });
  });

  describe('generateStoragePath', () => {
    it('should generate unique storage path with document ID', () => {
      const documentId = 'doc-123';
      const filename = 'test-file.pdf';

      const path = service.generateStoragePath(documentId, filename);

      expect(path).toContain(documentId);
      expect(path).toContain('.pdf');
      expect(path).toMatch(/\d+-[a-f0-9]+-/); // timestamp-random pattern
    });

    it('should preserve file extension', () => {
      const extensions = ['.pdf', '.docx', '.xlsx', '.png', '.json'];

      extensions.forEach((ext) => {
        const path = service.generateStoragePath('doc-1', `file${ext}`);
        expect(path).toContain(ext);
      });
    });

    it('should sanitize filename by removing special characters', () => {
      const dangerousFilename = 'test file with spaces & special!@#$%chars.pdf';

      const path = service.generateStoragePath('doc-1', dangerousFilename);

      expect(path).not.toContain(' ');
      expect(path).not.toContain('!');
      expect(path).not.toContain('@');
      expect(path).not.toContain('#');
    });

    it('should generate different paths for same filename', () => {
      const filename = 'test.pdf';
      const documentId = 'doc-1';

      const path1 = service.generateStoragePath(documentId, filename);
      const path2 = service.generateStoragePath(documentId, filename);

      expect(path1).not.toBe(path2);
    });

    it('should include base storage path', () => {
      const path = service.generateStoragePath('doc-1', 'test.pdf');

      expect(path).toMatch(/storage\/attachments/);
    });
  });

  describe('generateSecureFilename', () => {
    it('should generate secure filename with timestamp and random string', () => {
      const originalFilename = 'test-file.pdf';

      const secureFilename = service.generateSecureFilename(originalFilename);

      expect(secureFilename).toMatch(/^\d+-[a-f0-9]+\.pdf$/);
    });

    it('should preserve file extension', () => {
      const extensions = ['.pdf', '.docx', '.xlsx', '.png'];

      extensions.forEach((ext) => {
        const filename = service.generateSecureFilename(`file${ext}`);
        expect(filename).toMatch(new RegExp(`\\${ext}$`));
      });
    });

    it('should generate different filenames for same input', () => {
      const originalFilename = 'test.pdf';

      const filename1 = service.generateSecureFilename(originalFilename);
      const filename2 = service.generateSecureFilename(originalFilename);

      expect(filename1).not.toBe(filename2);
    });
  });

  describe('updateAttachment', () => {
    it('should update attachment metadata', async () => {
      const attachmentId = 'att-1';
      const updateData = {
        filename: 'updated-filename.pdf',
        attachmentType: 'APPROVAL_SIGNATURE' as AttachmentType,
        description: 'Updated description',
      };

      const existingAttachment = { id: attachmentId, filename: 'old.pdf' };
      const mockUpdatedAttachment = {
        id: attachmentId,
        ...updateData,
        uploadedBy: { id: 'user-1', email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      mockPrismaService.documentAttachment.findUnique.mockResolvedValue(existingAttachment);
      mockPrismaService.documentAttachment.update.mockResolvedValue(mockUpdatedAttachment);

      const result = await service.updateAttachment(attachmentId, updateData);

      expect(result).toEqual(mockUpdatedAttachment);
      expect(mockPrismaService.documentAttachment.update).toHaveBeenCalledWith({
        where: { id: attachmentId },
        data: {
          filename: updateData.filename,
          attachmentType: updateData.attachmentType,
          description: updateData.description,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when attachment does not exist', async () => {
      mockPrismaService.documentAttachment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAttachment('non-existent', { filename: 'test.pdf' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment and return storage path', async () => {
      const attachmentId = 'att-1';
      const mockAttachment = {
        id: attachmentId,
        storagePath: '/storage/doc-1/test.pdf',
      };

      mockPrismaService.documentAttachment.findUnique.mockResolvedValue(mockAttachment);
      mockPrismaService.documentAttachment.delete.mockResolvedValue(mockAttachment);

      const result = await service.deleteAttachment(attachmentId);

      expect(result).toEqual({
        deleted: true,
        storagePath: mockAttachment.storagePath,
      });
      expect(mockPrismaService.documentAttachment.delete).toHaveBeenCalledWith({
        where: { id: attachmentId },
      });
    });

    it('should throw NotFoundException when attachment does not exist', async () => {
      mockPrismaService.documentAttachment.findUnique.mockResolvedValue(null);

      await expect(service.deleteAttachment('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAttachmentsByType', () => {
    it('should return attachments filtered by type', async () => {
      const documentId = 'doc-1';
      const attachmentType = 'APPROVAL_SIGNATURE' as AttachmentType;
      const mockAttachments = [
        {
          id: 'att-1',
          documentId,
          attachmentType,
          filename: 'signature1.pdf',
        },
        {
          id: 'att-2',
          documentId,
          attachmentType,
          filename: 'signature2.pdf',
        },
      ];

      mockPrismaService.documentAttachment.findMany.mockResolvedValue(mockAttachments);

      const result = await service.getAttachmentsByType(documentId, attachmentType);

      expect(result).toEqual(mockAttachments);
      expect(mockPrismaService.documentAttachment.findMany).toHaveBeenCalledWith({
        where: {
          documentId,
          attachmentType,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });
    });
  });

  describe('getDocumentStorageSize', () => {
    it('should return total storage size for document', async () => {
      const documentId = 'doc-1';
      const totalSize = 5242880; // 5MB

      mockPrismaService.documentAttachment.aggregate.mockResolvedValue({
        _sum: { size: totalSize },
      });

      const result = await service.getDocumentStorageSize(documentId);

      expect(result).toBe(totalSize);
      expect(mockPrismaService.documentAttachment.aggregate).toHaveBeenCalledWith({
        where: { documentId },
        _sum: { size: true },
      });
    });

    it('should return 0 when no attachments exist', async () => {
      mockPrismaService.documentAttachment.aggregate.mockResolvedValue({
        _sum: { size: null },
      });

      const result = await service.getDocumentStorageSize('doc-1');

      expect(result).toBe(0);
    });
  });

  describe('findByChecksum', () => {
    it('should find attachment by checksum for duplicate detection', async () => {
      const documentId = 'doc-1';
      const checksum = 'a1b2c3d4e5f6';
      const mockAttachment = {
        id: 'att-1',
        documentId,
        checksum,
        filename: 'duplicate.pdf',
      };

      mockPrismaService.documentAttachment.findFirst.mockResolvedValue(mockAttachment);

      const result = await service.findByChecksum(documentId, checksum);

      expect(result).toEqual(mockAttachment);
      expect(mockPrismaService.documentAttachment.findFirst).toHaveBeenCalledWith({
        where: {
          documentId,
          checksum,
        },
      });
    });

    it('should return null when no matching checksum found', async () => {
      mockPrismaService.documentAttachment.findFirst.mockResolvedValue(null);

      const result = await service.findByChecksum('doc-1', 'nonexistent-checksum');

      expect(result).toBeNull();
    });
  });

  describe('getAttachmentStats', () => {
    it('should return attachment statistics for document', async () => {
      const documentId = 'doc-1';
      const mockAttachments = [
        {
          size: 1024000,
          attachmentType: 'SUPPORTING_EVIDENCE',
          mimeType: 'application/pdf',
        },
        {
          size: 512000,
          attachmentType: 'SUPPORTING_EVIDENCE',
          mimeType: 'application/pdf',
        },
        {
          size: 2048000,
          attachmentType: 'APPROVAL_SIGNATURE',
          mimeType: 'image/png',
        },
      ];

      mockPrismaService.documentAttachment.findMany.mockResolvedValue(mockAttachments);

      const result = await service.getAttachmentStats(documentId);

      expect(result.count).toBe(3);
      expect(result.totalSize).toBe(3584000);
      expect(result.totalSizeMB).toBe(3.42);
      expect(result.byType).toEqual({
        SUPPORTING_EVIDENCE: 2,
        APPROVAL_SIGNATURE: 1,
      });
      expect(result.byMimeType).toEqual({
        'application/pdf': 2,
        'image/png': 1,
      });
    });

    it('should return zero statistics for document with no attachments', async () => {
      mockPrismaService.documentAttachment.findMany.mockResolvedValue([]);

      const result = await service.getAttachmentStats('doc-1');

      expect(result.count).toBe(0);
      expect(result.totalSize).toBe(0);
      expect(result.totalSizeMB).toBe(0);
    });
  });

  describe('validateFileBuffer', () => {
    it('should validate buffer and return checksum', async () => {
      const buffer = Buffer.from('test file content');

      const result = await service.validateFileBuffer(buffer);

      expect(result.valid).toBe(true);
      expect(result.checksum).toBeDefined();
      expect(result.checksum.length).toBe(64);
      expect(result.errors).toEqual([]);
    });

    it('should reject empty buffer', async () => {
      const buffer = Buffer.from('');

      const result = await service.validateFileBuffer(buffer);

      expect(result.valid).toBe(false);
      expect(result.checksum).toBe('');
      expect(result.errors).toContain('File buffer is empty');
    });

    it('should reject buffer exceeding maximum size', async () => {
      const largeBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB

      const result = await service.validateFileBuffer(largeBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds maximum allowed size of 50MB');
    });
  });
});
