import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncidentEvidenceType, Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('incidents/:incidentId/evidence')
export class IncidentEvidenceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Param('incidentId') incidentId: string,
    @Query('evidenceType') evidenceType?: IncidentEvidenceType,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const where: Prisma.IncidentEvidenceWhereInput = { incidentId };
    if (evidenceType) where.evidenceType = evidenceType;

    const [results, count] = await Promise.all([
      this.prisma.incidentEvidence.findMany({
        where,
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        orderBy: { collectedAt: 'desc' },
        include: {
          collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.incidentEvidence.count({ where }),
    ]);

    return { results, count };
  }

  @Get(':id')
  async findOne(@Param('incidentId') incidentId: string, @Param('id') id: string) {
    const evidence = await this.prisma.incidentEvidence.findFirst({
      where: { id, incidentId },
      include: {
        collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${id} not found`);
    }

    return evidence;
  }

  @Post()
  async create(
    @Param('incidentId') incidentId: string,
    @Request() req: AuthenticatedRequest,
    @Body()
    data: {
      evidenceType: IncidentEvidenceType;
      title: string;
      description?: string;
      fileName?: string;
      fileUrl?: string;
      fileSizeBytes?: number;
      mimeType?: string;
      hashSha256?: string;
      hashMd5?: string;
      collectedAt: string;
      collectedById?: string;
      collectionMethod?: string;
      chainOfCustodyNotes?: string;
      isForensicallySound?: boolean;
      storageLocation?: string;
      retainUntil?: string;
    },
  ) {
    // Verify incident exists
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const evidence = await this.prisma.incidentEvidence.create({
      data: {
        incidentId,
        evidenceType: data.evidenceType,
        title: data.title,
        description: data.description,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSizeBytes: data.fileSizeBytes,
        mimeType: data.mimeType,
        hashSha256: data.hashSha256,
        hashMd5: data.hashMd5,
        collectedAt: new Date(data.collectedAt),
        collectedById: data.collectedById || req.user.id,
        collectionMethod: data.collectionMethod,
        chainOfCustodyNotes: data.chainOfCustodyNotes,
        isForensicallySound: data.isForensicallySound || false,
        storageLocation: data.storageLocation,
        retainUntil: data.retainUntil ? new Date(data.retainUntil) : undefined,
        createdById: req.user.id,
      },
      include: {
        collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Update incident evidence preserved flag
    await this.prisma.incident.update({
      where: { id: incidentId },
      data: { evidencePreserved: true },
    });

    // Create timeline entry
    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId,
        timestamp: new Date(),
        entryType: 'EVIDENCE_COLLECTED',
        title: `Evidence Collected: ${data.title}`,
        description: `${data.evidenceType} evidence collected${data.isForensicallySound ? ' (forensically sound)' : ''}`,
        visibility: 'INTERNAL',
        isAutomated: true,
        createdById: req.user.id,
      },
    });

    return evidence;
  }

  @Put(':id')
  async update(
    @Param('incidentId') incidentId: string,
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      description?: string;
      fileName?: string;
      fileUrl?: string;
      fileSizeBytes?: number;
      mimeType?: string;
      hashSha256?: string;
      hashMd5?: string;
      collectionMethod?: string;
      chainOfCustodyNotes?: string;
      isForensicallySound?: boolean;
      storageLocation?: string;
      retainUntil?: string;
    },
  ) {
    const evidence = await this.prisma.incidentEvidence.findFirst({
      where: { id, incidentId },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${id} not found`);
    }

    return this.prisma.incidentEvidence.update({
      where: { id },
      data: {
        ...data,
        retainUntil: data.retainUntil ? new Date(data.retainUntil) : undefined,
      },
      include: {
        collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  @Delete(':id')
  async delete(@Param('incidentId') incidentId: string, @Param('id') id: string) {
    const evidence = await this.prisma.incidentEvidence.findFirst({
      where: { id, incidentId },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${id} not found`);
    }

    return this.prisma.incidentEvidence.delete({
      where: { id },
    });
  }

  // ============================================
  // CHAIN OF CUSTODY
  // ============================================

  @Put(':id/chain-of-custody')
  async updateChainOfCustody(
    @Param('incidentId') incidentId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body()
    data: {
      notes: string;
      action: string; // transferred_to, accessed_by, verified, etc.
    },
  ) {
    const evidence = await this.prisma.incidentEvidence.findFirst({
      where: { id, incidentId },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${id} not found`);
    }

    const timestamp = new Date().toISOString();
    const newEntry = `[${timestamp}] ${data.action}: ${data.notes}`;
    const updatedNotes = evidence.chainOfCustodyNotes
      ? `${evidence.chainOfCustodyNotes}\n${newEntry}`
      : newEntry;

    const updated = await this.prisma.incidentEvidence.update({
      where: { id },
      data: {
        chainOfCustodyNotes: updatedNotes,
      },
      include: {
        collectedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Update incident chain of custody flag
    await this.prisma.incident.update({
      where: { id: incidentId },
      data: { chainOfCustodyMaintained: true },
    });

    return updated;
  }
}

