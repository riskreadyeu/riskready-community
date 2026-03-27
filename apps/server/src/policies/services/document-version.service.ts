import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ChangeType } from '@prisma/client';
import { PolicyAuditService } from './policy-audit.service';

@Injectable()
export class DocumentVersionService {
  constructor(
    private prisma: PrismaService,
    private auditService: PolicyAuditService,
  ) {}

  async findAll(documentId: string) {
    return this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async findOne(id: string) {
    const version = await this.prisma.documentVersion.findUnique({
      where: { id },
      include: {
        document: { select: { id: true, documentId: true, title: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    return version;
  }

  async findByVersion(documentId: string, version: string) {
    return this.prisma.documentVersion.findFirst({
      where: { documentId, version },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async createVersion(data: {
    documentId: string;
    changeDescription: string;
    changeSummary?: string;
    changeType: ChangeType;
    isMajor?: boolean;
    userId?: string;
  }) {
    const { documentId, changeDescription, changeSummary, changeType, isMajor = false, userId } = data;

    // Get current document
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        documentId: true,
        title: true,
        content: true,
        version: true,
        majorVersion: true,
        minorVersion: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Calculate new version
    let newMajor = document.majorVersion;
    let newMinor = document.minorVersion;

    if (isMajor || changeType === 'MAJOR_REVISION' || changeType === 'RESTRUCTURE') {
      newMajor += 1;
      newMinor = 0;
    } else {
      newMinor += 1;
    }

    const newVersion = `${newMajor}.${newMinor}`;

    // Generate diff from previous version
    const previousVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: { content: true },
    });

    // Simple diff (in production, use a proper diff library)
    const diffFromPrevious = previousVersion
      ? this.generateSimpleDiff(previousVersion.content, document.content)
      : null;

    // Create version record
    const version = await this.prisma.documentVersion.create({
      data: {
        document: { connect: { id: documentId } },
        version: newVersion,
        majorVersion: newMajor,
        minorVersion: newMinor,
        content: document.content,
        changeDescription,
        changeSummary,
        changeType,
        diffFromPrevious,
        createdBy: userId ? { connect: { id: userId } } : undefined,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Update document version
    await this.prisma.policyDocument.update({
      where: { id: documentId },
      data: {
        version: newVersion,
        majorVersion: newMajor,
        minorVersion: newMinor,
      },
    });

    // Log audit event
    if (userId) {
      await this.auditService.log({
        documentId,
        action: 'VERSION_CREATED',
        description: `Version ${newVersion} created: ${changeDescription}`,
        performedById: userId,
        previousValue: { version: document.version },
        newValue: { version: newVersion, changeType },
      });
    }

    return version;
  }

  async compareVersions(documentId: string, version1: string, version2: string) {
    const [v1, v2] = await Promise.all([
      this.findByVersion(documentId, version1),
      this.findByVersion(documentId, version2),
    ]);

    if (!v1 || !v2) {
      throw new NotFoundException('One or both versions not found');
    }

    return {
      version1: {
        version: v1.version,
        createdAt: v1.createdAt,
        changeType: v1.changeType,
        changeDescription: v1.changeDescription,
      },
      version2: {
        version: v2.version,
        createdAt: v2.createdAt,
        changeType: v2.changeType,
        changeDescription: v2.changeDescription,
      },
      diff: this.generateSimpleDiff(v1.content, v2.content),
    };
  }

  private generateSimpleDiff(oldContent: string, newContent: string): string {
    // Simple line-by-line diff
    // In production, use a proper diff library like 'diff' or 'jsdiff'
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const diff: string[] = [];
    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine !== newLine) {
        if (oldLine && !newLine) {
          diff.push(`- ${oldLine}`);
        } else if (!oldLine && newLine) {
          diff.push(`+ ${newLine}`);
        } else {
          diff.push(`- ${oldLine}`);
          diff.push(`+ ${newLine}`);
        }
      }
    }

    return diff.join('\n');
  }

  async getVersionHistory(documentId: string, params?: { skip?: number; take?: number }) {
    const { skip, take } = params || {};

    const [versions, count] = await Promise.all([
      this.prisma.documentVersion.findMany({
        where: { documentId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.documentVersion.count({ where: { documentId } }),
    ]);

    return { versions, count };
  }

  async rollback(documentId: string, targetVersion: string, userId?: string) {
    const version = await this.findByVersion(documentId, targetVersion);

    if (!version) {
      throw new NotFoundException(`Version ${targetVersion} not found`);
    }

    // Update document content to target version
    const document = await this.prisma.policyDocument.update({
      where: { id: documentId },
      data: {
        content: version.content,
        status: 'UNDER_REVISION',
        updatedBy: userId ? { connect: { id: userId } } : undefined,
      },
    });

    // Create a new version entry for the rollback
    await this.createVersion({
      documentId,
      changeDescription: `Rolled back to version ${targetVersion}`,
      changeType: 'CORRECTION',
      userId,
    });

    if (userId) {
      await this.auditService.log({
        documentId,
        action: 'RESTORED',
        description: `Document rolled back to version ${targetVersion}`,
        performedById: userId,
      });
    }

    return document;
  }
}
