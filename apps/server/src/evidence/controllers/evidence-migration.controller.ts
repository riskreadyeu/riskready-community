import { Controller, Post, Query, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminOnly, AdminOnlyGuard } from '../../shared/guards/admin-only.guard';
import { EvidenceMigrationService } from '../services/evidence-migration.service';

/**
 * Controller for evidence migration operations.
 * These endpoints should be protected and only accessible by administrators.
 */
@Controller('evidence-migration')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@AdminOnly()
export class EvidenceMigrationController {
  constructor(private readonly migrationService: EvidenceMigrationService) {}

  /**
   * Run full migration of all legacy evidence tables.
   * Use dryRun=true to preview what would be migrated without making changes.
   */
  @Post('run')
  async runMigration(@Query('dryRun') dryRun?: string) {
    const isDryRun = dryRun === 'true';
    return this.migrationService.runFullMigration(isDryRun);
  }

  /**
   * Migrate only IncidentEvidence records
   */
  @Post('incident-evidence')
  async migrateIncidentEvidence(@Query('dryRun') dryRun?: string) {
    const isDryRun = dryRun === 'true';
    return this.migrationService.migrateIncidentEvidence(isDryRun);
  }

  /**
   * Migrate only DocumentAttachment records
   */
  @Post('document-attachments')
  async migrateDocumentAttachments(@Query('dryRun') dryRun?: string) {
    const isDryRun = dryRun === 'true';
    return this.migrationService.migrateDocumentAttachments(isDryRun);
  }

  /**
   * Migrate only VendorDocument records
   */
  @Post('vendor-documents')
  async migrateVendorDocuments(@Query('dryRun') dryRun?: string) {
    const isDryRun = dryRun === 'true';
    return this.migrationService.migrateVendorDocuments(isDryRun);
  }
}

