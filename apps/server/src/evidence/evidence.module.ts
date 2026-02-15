import { Module } from '@nestjs/common';
import { EvidenceController } from './controllers/evidence.controller';
import { EvidenceRequestController } from './controllers/evidence-request.controller';
import { EvidenceLinkController } from './controllers/evidence-link.controller';
import { EvidenceMigrationController } from './controllers/evidence-migration.controller';
import { EvidenceService } from './services/evidence.service';
import { EvidenceRequestService } from './services/evidence-request.service';
import { EvidenceLinkService } from './services/evidence-link.service';
import { EvidenceMigrationService } from './services/evidence-migration.service';

@Module({
  controllers: [
    EvidenceController,
    EvidenceRequestController,
    EvidenceLinkController,
    EvidenceMigrationController,
  ],
  providers: [
    EvidenceService,
    EvidenceRequestService,
    EvidenceLinkService,
    EvidenceMigrationService,
  ],
  exports: [
    EvidenceService,
    EvidenceRequestService,
    EvidenceLinkService,
    EvidenceMigrationService,
  ],
})
export class EvidenceModule {}

