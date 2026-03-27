import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImplementationStatus } from '@prisma/client';

@Injectable()
export class SOAEntryService {
  constructor(private prisma: PrismaService) {}

  async updateEntry(entryId: string, data: {
    applicable?: boolean;
    justificationIfNa?: string;
    implementationStatus?: string;
    implementationDesc?: string;
    parentRiskId?: string;
    scenarioIds?: string;
  }) {
    const entry = await this.prisma.sOAEntry.findUnique({ where: { id: entryId } });
    if (!entry) {
      throw new NotFoundException(
        `SOA entry with ID ${entryId} not found. Cannot update a non-existent entry. Please verify the entry ID and try again.`,
      );
    }
    return this.prisma.sOAEntry.update({
      where: { id: entryId },
      data: {
        applicable: data.applicable,
        justificationIfNa: data.justificationIfNa,
        implementationStatus: data.implementationStatus as ImplementationStatus,
        implementationDesc: data.implementationDesc,
        parentRiskId: data.parentRiskId,
        scenarioIds: data.scenarioIds,
      },
    });
  }

  async bulkUpdateEntries(soaId: string, updates: Array<{
    controlId: string;
    applicable?: boolean;
    justificationIfNa?: string;
    implementationStatus?: string;
    implementationDesc?: string;
  }>) {
    const soa = await this.prisma.statementOfApplicability.findUnique({ where: { id: soaId } });
    if (!soa) {
      throw new NotFoundException(
        `SOA with ID ${soaId} not found. Cannot update entries for a non-existent SOA. Please verify the SOA ID and try again.`,
      );
    }

    const results = await Promise.all(
      updates.map(update =>
        this.prisma.sOAEntry.updateMany({
          where: { soaId, controlId: update.controlId },
          data: {
            applicable: update.applicable,
            justificationIfNa: update.justificationIfNa,
            implementationStatus: update.implementationStatus as ImplementationStatus,
            implementationDesc: update.implementationDesc,
          },
        })
      )
    );
    return results;
  }

  async syncToControls(soaId: string) {
    // Sync SOA entries back to Control records
    const soa = await this.prisma.statementOfApplicability.findUnique({
      where: { id: soaId },
      include: { entries: true },
    });

    if (!soa) {
      throw new NotFoundException(
        `SOA with ID ${soaId} not found. Cannot sync entries to controls from a non-existent SOA. Please verify the SOA ID and try again.`,
      );
    }

    const updates = await Promise.all(
      soa.entries
        .filter(entry => entry.controlRecordId)
        .map(entry =>
          this.prisma.control.update({
            where: { id: entry.controlRecordId! },
            data: {
              applicable: entry.applicable,
              justificationIfNa: entry.justificationIfNa,
              implementationStatus: entry.implementationStatus,
              implementationDesc: entry.implementationDesc,
            },
          })
        )
    );

    return { updatedCount: updates.length };
  }
}

