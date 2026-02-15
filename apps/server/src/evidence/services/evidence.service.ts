import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EvidenceType,
  EvidenceStatus,
  EvidenceClassification,
  EvidenceSourceType,
} from '@prisma/client';

@Injectable()
export class EvidenceService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // FIND ALL - with filtering
  // ============================================

  async findAll(params?: {
    skip?: number;
    take?: number;
    evidenceType?: EvidenceType;
    status?: EvidenceStatus;
    classification?: EvidenceClassification;
    sourceType?: EvidenceSourceType;
    category?: string;
    search?: string;
    collectedById?: string;
    validUntilBefore?: Date;
    validUntilAfter?: Date;
  }) {
    const where: any = {};

    if (params?.evidenceType) where.evidenceType = params.evidenceType;
    if (params?.status) where.status = params.status;
    if (params?.classification) where.classification = params.classification;
    if (params?.sourceType) where.sourceType = params.sourceType;
    if (params?.category) where.category = params.category;
    if (params?.collectedById) where.collectedById = params.collectedById;

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { evidenceRef: { contains: params.search, mode: 'insensitive' } },
        { fileName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.validUntilBefore || params?.validUntilAfter) {
      where.validUntil = {};
      if (params.validUntilBefore) where.validUntil.lte = params.validUntilBefore;
      if (params.validUntilAfter) where.validUntil.gte = params.validUntilAfter;
    }

    const [results, count] = await Promise.all([
      this.prisma.evidence.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        include: {
          collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: {
            select: {
              controlLinks: true,
              nonconformityLinks: true,
              incidentLinks: true,
              riskLinks: true,
              assetLinks: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.evidence.count({ where }),
    ]);

    return { results, count };
  }

  // ============================================
  // FIND ONE
  // ============================================

  async findOne(id: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      include: {
        collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        rejectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        previousVersion: { select: { id: true, evidenceRef: true, title: true, version: true } },
        newerVersions: { select: { id: true, evidenceRef: true, title: true, version: true } },
        // Include linked entities counts
        controlLinks: {
          include: {
            control: { select: { id: true, controlId: true, name: true } },
          },
        },
        nonconformityLinks: {
          include: {
            nonconformity: { select: { id: true, ncId: true, title: true, status: true, severity: true } },
          },
        },
        incidentLinks: {
          include: {
            incident: { select: { id: true, referenceNumber: true, title: true, status: true, severity: true } },
          },
        },
        riskLinks: {
          include: {
            risk: { select: { id: true, riskId: true, title: true, status: true } },
          },
        },
        assetLinks: {
          include: {
            asset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
          },
        },
        requestFulfillments: {
          include: {
            request: { select: { id: true, requestRef: true, title: true, status: true } },
          },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    return evidence;
  }

  // ============================================
  // CREATE
  // ============================================

  async create(data: {
    title: string;
    description?: string;
    evidenceType: EvidenceType;
    classification?: EvidenceClassification;
    tags?: string[];
    category?: string;
    subcategory?: string;
    fileName?: string;
    originalFileName?: string;
    fileUrl?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    storagePath?: string;
    storageProvider?: string;
    isEncrypted?: boolean;
    hashSha256?: string;
    hashMd5?: string;
    isForensicallySound?: boolean;
    chainOfCustodyNotes?: string;
    sourceType?: EvidenceSourceType;
    sourceSystem?: string;
    sourceReference?: string;
    collectedAt?: Date;
    collectedById?: string;
    collectionMethod?: string;
    validFrom?: Date;
    validUntil?: Date;
    retainUntil?: Date;
    renewalRequired?: boolean;
    renewalReminderDays?: number;
    metadata?: any;
    notes?: string;
    createdById: string;
  }) {
    // Generate evidence reference
    const year = new Date().getFullYear();
    const lastEvidence = await this.prisma.evidence.findFirst({
      where: {
        evidenceRef: { startsWith: `EVD-${year}-` },
      },
      orderBy: { evidenceRef: 'desc' },
    });

    let nextNumber = 1;
    if (lastEvidence) {
      const match = lastEvidence.evidenceRef.match(/EVD-\d{4}-(\d+)/);
      if (match?.[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const evidenceRef = `EVD-${year}-${nextNumber.toString().padStart(4, '0')}`;

    return this.prisma.evidence.create({
      data: {
        evidenceRef,
        title: data.title,
        description: data.description,
        evidenceType: data.evidenceType,
        status: EvidenceStatus.PENDING,
        classification: data.classification || EvidenceClassification.INTERNAL,
        tags: data.tags || [],
        category: data.category,
        subcategory: data.subcategory,
        fileName: data.fileName,
        originalFileName: data.originalFileName,
        fileUrl: data.fileUrl,
        fileSizeBytes: data.fileSizeBytes,
        mimeType: data.mimeType,
        storagePath: data.storagePath,
        storageProvider: data.storageProvider || 'local',
        isEncrypted: data.isEncrypted || false,
        hashSha256: data.hashSha256,
        hashMd5: data.hashMd5,
        isForensicallySound: data.isForensicallySound || false,
        chainOfCustodyNotes: data.chainOfCustodyNotes,
        sourceType: data.sourceType || EvidenceSourceType.MANUAL_UPLOAD,
        sourceSystem: data.sourceSystem,
        sourceReference: data.sourceReference,
        collectedAt: data.collectedAt || new Date(),
        collectedById: data.collectedById,
        collectionMethod: data.collectionMethod,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        retainUntil: data.retainUntil,
        renewalRequired: data.renewalRequired || false,
        renewalReminderDays: data.renewalReminderDays,
        metadata: data.metadata || {},
        notes: data.notes,
        createdById: data.createdById,
      },
      include: {
        collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  // ============================================
  // UPDATE
  // ============================================

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      evidenceType?: EvidenceType;
      classification?: EvidenceClassification;
      tags?: string[];
      category?: string;
      subcategory?: string;
      fileName?: string;
      originalFileName?: string;
      fileUrl?: string;
      fileSizeBytes?: number;
      mimeType?: string;
      storagePath?: string;
      storageProvider?: string;
      isEncrypted?: boolean;
      hashSha256?: string;
      hashMd5?: string;
      isForensicallySound?: boolean;
      chainOfCustodyNotes?: string;
      sourceType?: EvidenceSourceType;
      sourceSystem?: string;
      sourceReference?: string;
      collectionMethod?: string;
      validFrom?: Date;
      validUntil?: Date;
      retainUntil?: Date;
      renewalRequired?: boolean;
      renewalReminderDays?: number;
      metadata?: any;
      notes?: string;
      updatedById: string;
    },
  ) {
    const existing = await this.prisma.evidence.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    // Don't allow updates to approved/archived evidence without creating new version
    if (existing.status === EvidenceStatus.APPROVED || existing.status === EvidenceStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot update approved or archived evidence. Create a new version instead.',
      );
    }

    return this.prisma.evidence.update({
      where: { id },
      data: {
        ...data,
        updatedById: data.updatedById,
      },
      include: {
        collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  // ============================================
  // DELETE
  // ============================================

  async delete(id: string) {
    const existing = await this.prisma.evidence.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    // Don't allow deletion of approved evidence
    if (existing.status === EvidenceStatus.APPROVED) {
      throw new BadRequestException('Cannot delete approved evidence. Archive it instead.');
    }

    return this.prisma.evidence.delete({ where: { id } });
  }

  // ============================================
  // REVIEW WORKFLOW
  // ============================================

  async submitForReview(id: string, userId: string) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    if (evidence.status !== EvidenceStatus.PENDING) {
      throw new BadRequestException('Evidence must be in PENDING status to submit for review');
    }

    return this.prisma.evidence.update({
      where: { id },
      data: {
        status: EvidenceStatus.UNDER_REVIEW,
        updatedById: userId,
      },
    });
  }

  async approve(id: string, userId: string, notes?: string) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    if (evidence.status !== EvidenceStatus.UNDER_REVIEW) {
      throw new BadRequestException('Evidence must be under review to approve');
    }

    return this.prisma.evidence.update({
      where: { id },
      data: {
        status: EvidenceStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: userId,
        approvalNotes: notes,
        updatedById: userId,
      },
    });
  }

  async reject(id: string, userId: string, reason: string) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    if (evidence.status !== EvidenceStatus.UNDER_REVIEW) {
      throw new BadRequestException('Evidence must be under review to reject');
    }

    return this.prisma.evidence.update({
      where: { id },
      data: {
        status: EvidenceStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: userId,
        rejectionReason: reason,
        updatedById: userId,
      },
    });
  }

  async archive(id: string, userId: string) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      throw new NotFoundException(`Evidence with ID ${id} not found`);
    }

    return this.prisma.evidence.update({
      where: { id },
      data: {
        status: EvidenceStatus.ARCHIVED,
        updatedById: userId,
      },
    });
  }

  // ============================================
  // CREATE NEW VERSION
  // ============================================

  async createNewVersion(
    previousId: string,
    data: {
      title: string;
      description?: string;
      evidenceType: EvidenceType;
      classification?: EvidenceClassification;
      fileName?: string;
      fileUrl?: string;
      fileSizeBytes?: number;
      mimeType?: string;
      hashSha256?: string;
      hashMd5?: string;
      validFrom?: Date;
      validUntil?: Date;
      notes?: string;
      createdById: string;
    },
  ) {
    const previous = await this.prisma.evidence.findUnique({ where: { id: previousId } });
    if (!previous) {
      throw new NotFoundException(`Previous evidence with ID ${previousId} not found`);
    }

    // Generate new reference
    const year = new Date().getFullYear();
    const lastEvidence = await this.prisma.evidence.findFirst({
      where: {
        evidenceRef: { startsWith: `EVD-${year}-` },
      },
      orderBy: { evidenceRef: 'desc' },
    });

    let nextNumber = 1;
    if (lastEvidence) {
      const match = lastEvidence.evidenceRef.match(/EVD-\d{4}-(\d+)/);
      if (match?.[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const evidenceRef = `EVD-${year}-${nextNumber.toString().padStart(4, '0')}`;

    return this.prisma.evidence.create({
      data: {
        evidenceRef,
        title: data.title,
        description: data.description,
        evidenceType: data.evidenceType,
        status: EvidenceStatus.PENDING,
        classification: data.classification || previous.classification,
        tags: previous.tags as string[],
        category: previous.category,
        subcategory: previous.subcategory,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSizeBytes: data.fileSizeBytes,
        mimeType: data.mimeType,
        hashSha256: data.hashSha256,
        hashMd5: data.hashMd5,
        sourceType: previous.sourceType,
        sourceSystem: previous.sourceSystem,
        collectedAt: new Date(),
        collectedById: data.createdById,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        notes: data.notes,
        version: previous.version + 1,
        previousVersionId: previousId,
        createdById: data.createdById,
      },
    });
  }

  // ============================================
  // STATS & DASHBOARD
  // ============================================

  async getStats() {
    const [
      totalCount,
      byStatus,
      byType,
      byClassification,
      expiringCount,
      recentCount,
    ] = await Promise.all([
      this.prisma.evidence.count(),
      this.prisma.evidence.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.evidence.groupBy({
        by: ['evidenceType'],
        _count: true,
      }),
      this.prisma.evidence.groupBy({
        by: ['classification'],
        _count: true,
      }),
      // Evidence expiring in next 30 days
      this.prisma.evidence.count({
        where: {
          validUntil: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          status: { not: EvidenceStatus.ARCHIVED },
        },
      }),
      // Evidence added in last 7 days
      this.prisma.evidence.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total: totalCount,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      byType: byType.reduce((acc, item) => ({ ...acc, [item.evidenceType]: item._count }), {}),
      byClassification: byClassification.reduce((acc, item) => ({ ...acc, [item.classification]: item._count }), {}),
      expiringSoon: expiringCount,
      recentlyAdded: recentCount,
    };
  }

  // ============================================
  // GET EXPIRING EVIDENCE
  // ============================================

  async getExpiring(days: number = 30) {
    return this.prisma.evidence.findMany({
      where: {
        validUntil: {
          gte: new Date(),
          lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        },
        status: { not: EvidenceStatus.ARCHIVED },
      },
      include: {
        collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { validUntil: 'asc' },
    });
  }
}

