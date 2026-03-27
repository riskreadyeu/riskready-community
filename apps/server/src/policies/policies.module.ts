import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
// PrismaService provided globally by PrismaModule

// Import EvidenceModule for evidence collection integration
import { EvidenceModule } from '../evidence/evidence.module';

// Services
import { PolicyDocumentService } from './services/policy-document.service';
import { DocumentVersionService } from './services/document-version.service';
import { DocumentReviewService } from './services/document-review.service';
import { ApprovalWorkflowService } from './services/approval-workflow.service';
import { ChangeRequestService } from './services/change-request.service';
import { DocumentExceptionService } from './services/document-exception.service';
import { AcknowledgmentService } from './services/acknowledgment.service';
import { DocumentMappingService } from './services/document-mapping.service';
import { PolicyAuditService } from './services/policy-audit.service';
import { PolicyDashboardService } from './services/policy-dashboard.service';
import { DocumentSectionService } from './services/document-section.service';
import { DocumentAttachmentService } from './services/document-attachment.service';
import { PolicySchedulerService } from './services/policy-scheduler.service';
import { PolicyEvidenceCollectorService } from './services/policy-evidence-collector.service';

// Controllers
import { PolicyDocumentController } from './controllers/policy-document.controller';
import { DocumentVersionController } from './controllers/document-version.controller';
import { DocumentReviewController } from './controllers/document-review.controller';
import { ApprovalWorkflowController } from './controllers/approval-workflow.controller';
import { ChangeRequestController } from './controllers/change-request.controller';
import { DocumentExceptionController } from './controllers/document-exception.controller';
import { AcknowledgmentController } from './controllers/acknowledgment.controller';
import { DocumentMappingController } from './controllers/document-mapping.controller';
import { PolicyDashboardController } from './controllers/policy-dashboard.controller';
import { DocumentSectionController } from './controllers/document-section.controller';
import { DocumentAttachmentController } from './controllers/document-attachment.controller';
import { PolicyEvidenceController } from './controllers/policy-evidence.controller';

@Module({
  imports: [ScheduleModule.forRoot(), EvidenceModule],
  controllers: [
    PolicyDocumentController,
    DocumentVersionController,
    DocumentReviewController,
    ApprovalWorkflowController,
    ChangeRequestController,
    DocumentExceptionController,
    AcknowledgmentController,
    DocumentMappingController,
    PolicyDashboardController,
    DocumentSectionController,
    DocumentAttachmentController,
    PolicyEvidenceController,
  ],
  providers: [
    PolicyDocumentService,
    DocumentVersionService,
    DocumentReviewService,
    ApprovalWorkflowService,
    ChangeRequestService,
    DocumentExceptionService,
    AcknowledgmentService,
    DocumentMappingService,
    PolicyAuditService,
    PolicyDashboardService,
    DocumentSectionService,
    DocumentAttachmentService,
    PolicySchedulerService,
    PolicyEvidenceCollectorService,
  ],
  exports: [
    PolicyDocumentService,
    DocumentVersionService,
    DocumentReviewService,
    ApprovalWorkflowService,
    ChangeRequestService,
    DocumentExceptionService,
    AcknowledgmentService,
    DocumentMappingService,
    PolicyAuditService,
    PolicyDashboardService,
    DocumentSectionService,
    DocumentAttachmentService,
    PolicySchedulerService,
    PolicyEvidenceCollectorService,
  ],
})
export class PoliciesModule {}
