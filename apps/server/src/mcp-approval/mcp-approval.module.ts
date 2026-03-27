import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ControlsModule } from '../controls/controls.module';
import { RisksModule } from '../risks/risks.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { PoliciesModule } from '../policies/policies.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { AuditsModule } from '../audits/audits.module';
import { ITSMModule } from '../itsm/itsm.module';
import { OrganisationModule } from '../organisation/organisation.module';
import { McpApprovalController } from './mcp-approval.controller';
import { McpApprovalService } from './mcp-approval.service';
import { McpApprovalExecutorService } from './mcp-approval-executor.service';

@Module({
  imports: [
    PrismaModule,
    ControlsModule,
    RisksModule,
    IncidentsModule,
    PoliciesModule,
    EvidenceModule,
    AuditsModule,
    ITSMModule,
    OrganisationModule,
  ],
  controllers: [McpApprovalController],
  providers: [McpApprovalService, McpApprovalExecutorService],
})
export class McpApprovalModule {}
