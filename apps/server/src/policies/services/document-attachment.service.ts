import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttachmentType } from '@prisma/client';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface CreateAttachmentDto {
  documentId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  attachmentType: AttachmentType;
  description?: string;
  storagePath: string;
  checksum: string;
  isEncrypted?: boolean;
  uploadedById?: string;
}

export interface UpdateAttachmentDto {
  filename?: string;
  attachmentType?: AttachmentType;
  description?: string;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class DocumentAttachmentService {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_MIME_TYPES = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    // SVG removed: can contain embedded <script> XSS payloads
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    // Other
    'application/json',
    'application/xml',
    'text/xml',
  ];

  private readonly STORAGE_BASE_PATH = process.env['ATTACHMENT_STORAGE_PATH'] || './storage/attachments';

  constructor(private prisma: PrismaService) {}

  /**
   * Get all attachments for a document
   */
  async getAttachments(documentId: string) {
    return this.prisma.documentAttachment.findMany({
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
  }

  /**
   * Get single attachment by ID
   */
  async getAttachment(id: string) {
    const attachment = await this.prisma.documentAttachment.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            id: true,
            documentId: true,
            title: true,
            status: true,
          },
        },
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

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return attachment;
  }

  /**
   * Create attachment record (metadata only)
   */
  async createAttachment(data: CreateAttachmentDto) {
    // Verify document exists
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: data.documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${data.documentId} not found`);
    }

    // Validate file metadata
    const validation = this.validateAttachmentMetadata({
      size: data.size,
      mimeType: data.mimeType,
    });

    if (!validation.valid) {
      throw new BadRequestException(`Invalid file: ${validation.errors.join(', ')}`);
    }

    return this.prisma.documentAttachment.create({
      data: {
        document: { connect: { id: data.documentId } },
        filename: data.filename,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        size: data.size,
        attachmentType: data.attachmentType,
        description: data.description,
        storagePath: data.storagePath,
        checksum: data.checksum,
        isEncrypted: data.isEncrypted || false,
        uploadedBy: data.uploadedById ? { connect: { id: data.uploadedById } } : undefined,
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
  }

  /**
   * Update attachment metadata
   */
  async updateAttachment(id: string, data: UpdateAttachmentDto) {
    // Verify attachment exists
    const existing = await this.prisma.documentAttachment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return this.prisma.documentAttachment.update({
      where: { id },
      data: {
        filename: data.filename,
        attachmentType: data.attachmentType,
        description: data.description,
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
  }

  /**
   * Delete attachment record
   */
  async deleteAttachment(id: string) {
    const attachment = await this.prisma.documentAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    await this.prisma.documentAttachment.delete({
      where: { id },
    });

    return {
      deleted: true,
      storagePath: attachment.storagePath,
    };
  }

  /**
   * Generate unique storage path for an attachment
   */
  generateStoragePath(documentId: string, filename: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(filename);
    const sanitizedName = this.sanitizeFilename(path.basename(filename, ext));

    // Structure: {base}/{documentId}/{timestamp}-{random}-{sanitized}.{ext}
    const generatedFilename = `${timestamp}-${randomString}-${sanitizedName}${ext}`;
    return path.join(this.STORAGE_BASE_PATH, documentId, generatedFilename);
  }

  /**
   * Generate secure filename
   */
  generateSecureFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(originalFilename);
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Sanitize filename to remove potentially dangerous characters
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }

  /**
   * Validate attachment metadata
   */
  validateAttachmentMetadata(file: { size: number; mimeType: string }): FileValidationResult {
    const errors: string[] = [];

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (file.size <= 0) {
      errors.push('File size must be greater than 0');
    }

    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      errors.push(`File type ${file.mimeType} is not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate file buffer and generate checksum
   */
  async validateFileBuffer(buffer: Buffer): Promise<{ valid: boolean; checksum: string; errors: string[] }> {
    const errors: string[] = [];

    if (!buffer || buffer.length === 0) {
      errors.push('File buffer is empty');
      return { valid: false, checksum: '', errors };
    }

    if (buffer.length > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Generate SHA-256 checksum
    const checksum = this.generateChecksum(buffer);

    return {
      valid: errors.length === 0,
      checksum,
      errors,
    };
  }

  /**
   * Generate SHA-256 checksum for file buffer
   */
  generateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate checksum from file path
   */
  async generateChecksumFromFile(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath);
      return this.generateChecksum(buffer);
    } catch (error) {
      throw new BadRequestException(`Failed to read file for checksum: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify file integrity by comparing checksums
   */
  async verifyFileIntegrity(attachmentId: string, filePath: string): Promise<boolean> {
    const attachment = await this.getAttachment(attachmentId);
    const currentChecksum = await this.generateChecksumFromFile(filePath);
    return currentChecksum === attachment.checksum;
  }

  /**
   * Get attachments by type
   */
  async getAttachmentsByType(documentId: string, attachmentType: AttachmentType) {
    return this.prisma.documentAttachment.findMany({
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
  }

  /**
   * Get total storage size for a document
   */
  async getDocumentStorageSize(documentId: string): Promise<number> {
    const result = await this.prisma.documentAttachment.aggregate({
      where: { documentId },
      _sum: { size: true },
    });

    return result._sum.size || 0;
  }

  /**
   * Check if attachment exists by checksum (duplicate detection)
   */
  async findByChecksum(documentId: string, checksum: string) {
    return this.prisma.documentAttachment.findFirst({
      where: {
        documentId,
        checksum,
      },
    });
  }

  /**
   * Get attachment statistics for a document
   */
  async getAttachmentStats(documentId: string) {
    const attachments = await this.prisma.documentAttachment.findMany({
      where: { documentId },
      select: {
        size: true,
        attachmentType: true,
        mimeType: true,
      },
    });

    const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    const typeBreakdown = attachments.reduce((acc, att) => {
      acc[att.attachmentType] = (acc[att.attachmentType] || 0) + 1;
      return acc;
    }, {} as Record<AttachmentType, number>);

    const mimeTypeBreakdown = attachments.reduce((acc, att) => {
      acc[att.mimeType] = (acc[att.mimeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      count: attachments.length,
      totalSize,
      totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      byType: typeBreakdown,
      byMimeType: mimeTypeBreakdown,
    };
  }

  /**
   * Ensure storage directory exists
   */
  async ensureStorageDirectory(documentId: string): Promise<string> {
    const dirPath = path.join(this.STORAGE_BASE_PATH, documentId);

    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }

    return dirPath;
  }

  /**
   * Get full storage path, ensuring it stays within the storage base directory.
   */
  getFullStoragePath(storagePath: string): string {
    const baseDir = path.resolve(this.STORAGE_BASE_PATH);
    const resolved = path.resolve(baseDir, storagePath);
    if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
      throw new BadRequestException('Invalid storage path');
    }
    return resolved;
  }
}
