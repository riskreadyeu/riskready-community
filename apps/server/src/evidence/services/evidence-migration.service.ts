import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvidenceType, EvidenceClassification, EvidenceSourceType } from '@prisma/client';

/**
 * Service to migrate existing evidence-like data from legacy tables
 * (IncidentEvidence, DocumentAttachment, VendorDocument) to the central Evidence module.
 * 
 * This is designed to be run once during migration, but can also be used
 * to sync new records created in legacy tables.
 */
@Injectable()
export class EvidenceMigrationService {
  private readonly logger = new Logger(EvidenceMigrationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique evidence reference number
   */
  private async generateEvidenceRef(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EVD-${year}-`;
    
    // Find the highest existing number for this year
    const lastEvidence = await this.prisma.evidence.findFirst({
      where: {
        evidenceRef: { startsWith: prefix },
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

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Map IncidentEvidenceType to central EvidenceType
   */
  private mapIncidentEvidenceType(type: string): EvidenceType {
    const mapping: Record<string, EvidenceType> = {
      LOG: 'LOG',
      SCREENSHOT: 'SCREENSHOT',
      MEMORY_DUMP: 'MEMORY_DUMP',
      DISK_IMAGE: 'DISK_IMAGE',
      NETWORK_CAPTURE: 'NETWORK_CAPTURE',
      MALWARE_SAMPLE: 'MALWARE_SAMPLE',
      EMAIL: 'EMAIL',
      DOCUMENT: 'DOCUMENT',
      OTHER: 'OTHER',
    };
    return mapping[type] || 'OTHER';
  }

  /**
   * Map PolicyDocument AttachmentType to central EvidenceType
   */
  private mapAttachmentType(type: string): EvidenceType {
    const mapping: Record<string, EvidenceType> = {
      APPENDIX: 'DOCUMENT',
      FORM: 'DOCUMENT',
      TEMPLATE: 'DOCUMENT',
      DIAGRAM: 'DOCUMENT',
      REFERENCE: 'DOCUMENT',
      EVIDENCE: 'DOCUMENT',
      SIGNATURE: 'APPROVAL_RECORD',
    };
    return mapping[type] || 'DOCUMENT';
  }

  /**
   * Map VendorDocument documentType to central EvidenceType
   */
  private mapVendorDocumentType(type: string): EvidenceType {
    const mapping: Record<string, EvidenceType> = {
      CERTIFICATE: 'CERTIFICATE',
      SOC_REPORT: 'AUDIT_REPORT',
      POLICY: 'POLICY',
      CONTRACT: 'DOCUMENT',
      EVIDENCE: 'DOCUMENT',
      ASSESSMENT: 'ASSESSMENT_RESULT',
      QUESTIONNAIRE: 'ASSESSMENT_RESULT',
      INSURANCE: 'CERTIFICATE',
      AUDIT_REPORT: 'AUDIT_REPORT',
    };
    return mapping[type] || 'DOCUMENT';
  }

  /**
   * Migrate all IncidentEvidence records to central Evidence
   */
  async migrateIncidentEvidence(dryRun = false): Promise<{
    total: number;
    migrated: number;
    skipped: number;
    errors: string[];
  }> {
    this.logger.log('Starting IncidentEvidence migration...');
    
    const results = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    try {
      // Get all IncidentEvidence records
      const incidentEvidences = await this.prisma.incidentEvidence.findMany({
        include: {
          incident: { select: { id: true, referenceNumber: true } },
          collectedBy: { select: { id: true } },
          createdBy: { select: { id: true } },
        },
      });

      results.total = incidentEvidences.length;
      this.logger.log(`Found ${results.total} IncidentEvidence records`);

      for (const ie of incidentEvidences) {
        try {
          // Check if already migrated (by looking for existing link)
          const existingLink = await this.prisma.evidenceIncident.findFirst({
            where: {
              incidentId: ie.incidentId,
              evidence: {
                fileName: ie.fileName,
                title: ie.title,
              },
            },
          });

          if (existingLink) {
            this.logger.debug(`Skipping already migrated: ${ie.title}`);
            results.skipped++;
            continue;
          }

          if (dryRun) {
            this.logger.log(`[DRY RUN] Would migrate: ${ie.title}`);
            results.migrated++;
            continue;
          }

          // Create the central Evidence record
          const evidenceRef = await this.generateEvidenceRef();
          
          const evidence = await this.prisma.evidence.create({
            data: {
              evidenceRef,
              title: ie.title,
              description: ie.description,
              evidenceType: this.mapIncidentEvidenceType(ie.evidenceType),
              status: 'APPROVED', // Existing evidence is assumed approved
              classification: 'INTERNAL',
              sourceType: 'MANUAL_UPLOAD',
              
              // File info
              fileName: ie.fileName,
              originalFileName: ie.fileName,
              fileUrl: ie.fileUrl,
              fileSizeBytes: ie.fileSizeBytes,
              mimeType: ie.mimeType,
              storagePath: ie.storageLocation,
              
              // Integrity
              hashSha256: ie.hashSha256,
              hashMd5: ie.hashMd5,
              isForensicallySound: ie.isForensicallySound,
              chainOfCustodyNotes: ie.chainOfCustodyNotes,
              
              // Collection
              collectedAt: ie.collectedAt,
              collectedById: ie.collectedById,
              collectionMethod: ie.collectionMethod,
              
              // Retention
              retainUntil: ie.retainUntil,
              
              // Approval (mark as approved since it was already collected)
              approvedAt: ie.createdAt,
              approvedById: ie.collectedById,
              
              // Audit
              createdAt: ie.createdAt,
              createdById: ie.createdById,
            },
          });

          // Create the link to the incident
          await this.prisma.evidenceIncident.create({
            data: {
              evidenceId: evidence.id,
              incidentId: ie.incidentId,
              linkType: 'INCIDENT_EVIDENCE',
              notes: `Migrated from IncidentEvidence (original ID: ${ie.id})`,
              createdById: ie.createdById,
            },
          });

          this.logger.log(`Migrated: ${ie.title} -> ${evidenceRef}`);
          results.migrated++;
        } catch (error) {
          const err = error as Error;
          const errorMsg = `Error migrating ${ie.id}: ${err.message}`;
          this.logger.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Migration failed: ${err.message}`);
      results.errors.push(err.message);
    }

    this.logger.log(`IncidentEvidence migration complete: ${results.migrated}/${results.total} migrated, ${results.skipped} skipped`);
    return results;
  }

  /**
   * Migrate all DocumentAttachment records to central Evidence
   */
  async migrateDocumentAttachments(dryRun = false): Promise<{
    total: number;
    migrated: number;
    skipped: number;
    errors: string[];
  }> {
    this.logger.log('Starting DocumentAttachment migration...');
    
    const results = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    try {
      // Get all DocumentAttachment records
      const attachments = await this.prisma.documentAttachment.findMany({
        include: {
          document: { select: { id: true, documentId: true, title: true } },
          uploadedBy: { select: { id: true } },
        },
      });

      results.total = attachments.length;
      this.logger.log(`Found ${results.total} DocumentAttachment records`);

      for (const att of attachments) {
        try {
          // Check if already migrated
          const existingLink = await this.prisma.evidencePolicy.findFirst({
            where: {
              policyId: att.documentId,
              evidence: {
                fileName: att.filename,
              },
            },
          });

          if (existingLink) {
            this.logger.debug(`Skipping already migrated: ${att.filename}`);
            results.skipped++;
            continue;
          }

          if (dryRun) {
            this.logger.log(`[DRY RUN] Would migrate: ${att.filename}`);
            results.migrated++;
            continue;
          }

          // Create the central Evidence record
          const evidenceRef = await this.generateEvidenceRef();
          
          const evidence = await this.prisma.evidence.create({
            data: {
              evidenceRef,
              title: att.originalFilename || att.filename,
              description: att.description,
              evidenceType: this.mapAttachmentType(att.attachmentType),
              status: 'APPROVED',
              classification: 'INTERNAL',
              sourceType: 'MANUAL_UPLOAD',
              
              // File info
              fileName: att.filename,
              originalFileName: att.originalFilename,
              fileSizeBytes: att.size,
              mimeType: att.mimeType,
              storagePath: att.storagePath,
              storageProvider: att.storageProvider,
              isEncrypted: att.isEncrypted,
              
              // Integrity
              hashSha256: att.checksum,
              
              // Collection
              collectedAt: att.uploadedAt,
              collectedById: att.uploadedById,
              
              // Approval
              approvedAt: att.uploadedAt,
              approvedById: att.uploadedById,
              
              // Audit
              createdAt: att.uploadedAt,
              createdById: att.uploadedById,
            },
          });

          // Create the link to the policy document
          await this.prisma.evidencePolicy.create({
            data: {
              evidenceId: evidence.id,
              policyId: att.documentId,
              linkType: att.attachmentType,
              notes: `Migrated from DocumentAttachment (original ID: ${att.id})`,
              createdById: att.uploadedById,
            },
          });

          this.logger.log(`Migrated: ${att.filename} -> ${evidenceRef}`);
          results.migrated++;
        } catch (error) {
          const err = error as Error;
          const errorMsg = `Error migrating ${att.id}: ${err.message}`;
          this.logger.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Migration failed: ${err.message}`);
      results.errors.push(err.message);
    }

    this.logger.log(`DocumentAttachment migration complete: ${results.migrated}/${results.total} migrated, ${results.skipped} skipped`);
    return results;
  }

  /**
   * Migrate all VendorDocument records to central Evidence
   */
  async migrateVendorDocuments(dryRun = false): Promise<{
    total: number;
    migrated: number;
    skipped: number;
    errors: string[];
  }> {
    this.logger.log('Starting VendorDocument migration...');
    
    const results = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // VendorDocument and EvidenceVendor models not available in Community Edition
    this.logger.warn('VendorDocument migration skipped: model not available in Community Edition');
    results.errors.push('VendorDocument model not available in Community Edition');

    this.logger.log(`VendorDocument migration complete: ${results.migrated}/${results.total} migrated, ${results.skipped} skipped`);
    return results;
  }

  /**
   * Run full migration of all legacy evidence tables
   */
  async runFullMigration(dryRun = false): Promise<{
    incidentEvidence: { total: number; migrated: number; skipped: number; errors: string[] };
    documentAttachments: { total: number; migrated: number; skipped: number; errors: string[] };
    vendorDocuments: { total: number; migrated: number; skipped: number; errors: string[] };
    summary: { totalMigrated: number; totalSkipped: number; totalErrors: number };
  }> {
    this.logger.log(`Starting full evidence migration... (dryRun: ${dryRun})`);

    const incidentEvidence = await this.migrateIncidentEvidence(dryRun);
    const documentAttachments = await this.migrateDocumentAttachments(dryRun);
    const vendorDocuments = await this.migrateVendorDocuments(dryRun);

    const summary = {
      totalMigrated: incidentEvidence.migrated + documentAttachments.migrated + vendorDocuments.migrated,
      totalSkipped: incidentEvidence.skipped + documentAttachments.skipped + vendorDocuments.skipped,
      totalErrors: incidentEvidence.errors.length + documentAttachments.errors.length + vendorDocuments.errors.length,
    };

    this.logger.log(`Full migration complete: ${summary.totalMigrated} migrated, ${summary.totalSkipped} skipped, ${summary.totalErrors} errors`);

    return {
      incidentEvidence,
      documentAttachments,
      vendorDocuments,
      summary,
    };
  }
}

