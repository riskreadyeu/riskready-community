import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  DocumentAttachmentService,
  CreateAttachmentDto,
  UpdateAttachmentDto,
} from '../services/document-attachment.service';
import { AttachmentType } from '@prisma/client';
import { Response } from 'express';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';

// Multer file interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('policies')
export class DocumentAttachmentController {
  constructor(private readonly service: DocumentAttachmentService) {}

  // =============================================
  // ATTACHMENT OPERATIONS
  // =============================================

  @Get(':documentId/attachments')
  async getAttachments(@Param('documentId') documentId: string) {
    return this.service.getAttachments(documentId);
  }

  @Get('attachments/:id')
  async getAttachment(@Param('id') id: string) {
    return this.service.getAttachment(id);
  }

  @Get(':documentId/attachments/by-type/:type')
  async getAttachmentsByType(
    @Param('documentId') documentId: string,
    @Param('type') attachmentType: AttachmentType,
  ) {
    return this.service.getAttachmentsByType(documentId, attachmentType);
  }

  @Post(':documentId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('documentId') documentId: string,
    @UploadedFile() file: MulterFile,
    @Body()
    body: {
      attachmentType: AttachmentType;
      description?: string;
      uploadedById?: string;
    },
  ) {
    // Ensure storage directory exists
    await this.service.ensureStorageDirectory(documentId);

    // Validate file
    const validation = await this.service.validateFileBuffer(file.buffer);
    if (!validation.valid) {
      throw new Error(`Invalid file: ${validation.errors.join(', ')}`);
    }

    // Generate storage path
    const storagePath = this.service.generateStoragePath(documentId, file.originalname);
    const fullPath = this.service.getFullStoragePath(storagePath);

    // Write file to storage
    await fs.writeFile(fullPath, file.buffer);

    // Create attachment record
    const attachmentData: CreateAttachmentDto = {
      documentId,
      filename: file.originalname,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      attachmentType: body.attachmentType,
      description: body.description,
      storagePath,
      checksum: validation.checksum,
      uploadedById: body.uploadedById,
    };

    return this.service.createAttachment(attachmentData);
  }

  @Post(':documentId/attachments/metadata')
  async createAttachmentMetadata(
    @Param('documentId') documentId: string,
    @Body() data: Omit<CreateAttachmentDto, 'documentId'>,
  ) {
    return this.service.createAttachment({ documentId, ...data });
  }

  @Put('attachments/:id')
  async updateAttachment(
    @Param('id') id: string,
    @Body() data: UpdateAttachmentDto,
  ) {
    return this.service.updateAttachment(id, data);
  }

  @Delete('attachments/:id')
  async deleteAttachment(@Param('id') id: string) {
    const result = await this.service.deleteAttachment(id);

    // Optionally delete the file from storage
    try {
      const fullPath = this.service.getFullStoragePath(result.storagePath);
      await fs.unlink(fullPath);
    } catch {
      // File may not exist or already deleted
    }

    return result;
  }

  @Get('attachments/:id/download')
  async downloadAttachment(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const attachment = await this.service.getAttachment(id);
    const fullPath = this.service.getFullStoragePath(attachment.storagePath);

    // Verify file exists
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error('File not found in storage');
    }

    const file = createReadStream(fullPath);

    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.originalFilename}"`,
      'Content-Length': attachment.size,
    });

    return new StreamableFile(file);
  }

  @Get('attachments/:id/verify')
  async verifyAttachment(@Param('id') id: string) {
    const attachment = await this.service.getAttachment(id);
    const fullPath = this.service.getFullStoragePath(attachment.storagePath);

    try {
      const isValid = await this.service.verifyFileIntegrity(id, fullPath);
      return {
        valid: isValid,
        attachmentId: id,
        storedChecksum: attachment.checksum,
      };
    } catch (error) {
      return {
        valid: false,
        attachmentId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // =============================================
  // STATISTICS & UTILITIES
  // =============================================

  @Get(':documentId/attachments/stats')
  async getAttachmentStats(@Param('documentId') documentId: string) {
    return this.service.getAttachmentStats(documentId);
  }

  @Get(':documentId/attachments/storage-size')
  async getDocumentStorageSize(@Param('documentId') documentId: string) {
    const size = await this.service.getDocumentStorageSize(documentId);
    return {
      documentId,
      sizeBytes: size,
      sizeMB: Math.round((size / 1024 / 1024) * 100) / 100,
    };
  }

  @Post(':documentId/attachments/check-duplicate')
  async checkDuplicate(
    @Param('documentId') documentId: string,
    @Body() data: { checksum: string },
  ) {
    const existing = await this.service.findByChecksum(documentId, data.checksum);
    return {
      isDuplicate: !!existing,
      existingAttachment: existing,
    };
  }
}
