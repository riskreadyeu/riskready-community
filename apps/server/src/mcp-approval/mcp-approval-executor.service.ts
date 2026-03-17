import { Injectable, Logger } from '@nestjs/common';
import { McpActionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Controls domain
import { ControlService } from '../controls/services/control.service';
import { AssessmentService } from '../controls/services/assessment.service';
import { AssessmentTestService } from '../controls/services/assessment-test.service';
import { SOAService } from '../controls/services/soa.service';
import { SOAEntryService } from '../controls/services/soa-entry.service';
import { ScopeItemService } from '../controls/services/scope-item.service';

// Risks domain
import { RiskService } from '../risks/services/risk.service';
import { RiskScenarioService } from '../risks/services/risk-scenario.service';
import { KRIService } from '../risks/services/kri.service';
import { RiskToleranceStatementService } from '../risks/services/rts.service';
import { TreatmentPlanService } from '../risks/services/treatment-plan.service';

// Incidents domain
import { IncidentService } from '../incidents/services/incident.service';

// Policies domain
import { PolicyDocumentService } from '../policies/services/policy-document.service';
import { DocumentExceptionService } from '../policies/services/document-exception.service';
import { ChangeRequestService } from '../policies/services/change-request.service';

// Evidence domain
import { EvidenceService } from '../evidence/services/evidence.service';
import { EvidenceLinkService } from '../evidence/services/evidence-link.service';
import { EvidenceRequestService } from '../evidence/services/evidence-request.service';

// Audits domain
import { NonconformityService } from '../audits/services/nonconformity.service';

// ITSM domain
import { ChangeService } from '../itsm/services/change.service';
import { AssetService } from '../itsm/services/asset.service';
import { CapacityService } from '../itsm/services/capacity.service';

// Organisation domain
import { OrganisationProfileService } from '../organisation/services/organisation-profile.service';
import { DepartmentService } from '../organisation/services/department.service';
import { LocationService } from '../organisation/services/location.service';
import { BusinessProcessService } from '../organisation/services/business-process.service';
import { SecurityCommitteeService } from '../organisation/services/security-committee.service';
import { CommitteeMeetingService } from '../organisation/services/committee-meeting.service';
import { ExternalDependencyService } from '../organisation/services/external-dependency.service';

// Executor registrars
import { ExecutorMap } from './executors/types';
import { registerControlExecutors } from './executors/control.executors';
import { registerRiskExecutors } from './executors/risk.executors';
import { registerIncidentExecutors } from './executors/incident.executors';
import { registerPolicyExecutors } from './executors/policy.executors';
import { registerEvidenceExecutors } from './executors/evidence.executors';
import { registerAuditExecutors } from './executors/audit.executors';
import { registerItsmExecutors } from './executors/itsm.executors';
import { registerOrganisationExecutors } from './executors/organisation.executors';

@Injectable()
export class McpApprovalExecutorService {
  private readonly logger = new Logger(McpApprovalExecutorService.name);
  private readonly executors: ExecutorMap = new Map();

  constructor(
    private prismaService: PrismaService,
    // Controls
    private controlService: ControlService,
    private assessmentService: AssessmentService,
    private assessmentTestService: AssessmentTestService,
    private soaService: SOAService,
    private soaEntryService: SOAEntryService,
    private scopeItemService: ScopeItemService,
    // Risks
    private riskService: RiskService,
    private scenarioService: RiskScenarioService,
    private kriService: KRIService,
    private rtsService: RiskToleranceStatementService,
    private treatmentPlanService: TreatmentPlanService,
    // Incidents
    private incidentService: IncidentService,
    // Policies
    private policyDocumentService: PolicyDocumentService,
    private documentExceptionService: DocumentExceptionService,
    private changeRequestService: ChangeRequestService,
    // Evidence
    private evidenceService: EvidenceService,
    private evidenceLinkService: EvidenceLinkService,
    private evidenceRequestService: EvidenceRequestService,
    // Audits
    private nonconformityService: NonconformityService,
    // ITSM
    private changeService: ChangeService,
    private assetService: AssetService,
    private capacityService: CapacityService,
    // Organisation
    private organisationProfileService: OrganisationProfileService,
    private departmentService: DepartmentService,
    private locationService: LocationService,
    private businessProcessService: BusinessProcessService,
    private securityCommitteeService: SecurityCommitteeService,
    private committeeMeetingService: CommitteeMeetingService,
    private externalDependencyService: ExternalDependencyService,
  ) {
    registerControlExecutors(this.executors, {
      controlService: this.controlService,
      assessmentService: this.assessmentService,
      assessmentTestService: this.assessmentTestService,
      soaService: this.soaService,
      soaEntryService: this.soaEntryService,
      scopeItemService: this.scopeItemService,
      prismaService: this.prismaService,
      treatmentPlanService: this.treatmentPlanService,
    });

    registerRiskExecutors(this.executors, {
      riskService: this.riskService,
      scenarioService: this.scenarioService,
      kriService: this.kriService,
      rtsService: this.rtsService,
      treatmentPlanService: this.treatmentPlanService,
    });

    registerIncidentExecutors(this.executors, {
      incidentService: this.incidentService,
      prismaService: this.prismaService,
    });

    registerPolicyExecutors(this.executors, {
      policyDocumentService: this.policyDocumentService,
      documentExceptionService: this.documentExceptionService,
      changeRequestService: this.changeRequestService,
    });

    registerEvidenceExecutors(this.executors, {
      evidenceService: this.evidenceService,
      evidenceLinkService: this.evidenceLinkService,
      evidenceRequestService: this.evidenceRequestService,
    });

    registerAuditExecutors(this.executors, {
      nonconformityService: this.nonconformityService,
    });

    registerItsmExecutors(this.executors, {
      changeService: this.changeService,
      assetService: this.assetService,
      capacityService: this.capacityService,
      prismaService: this.prismaService,
    });

    registerOrganisationExecutors(this.executors, {
      organisationProfileService: this.organisationProfileService,
      departmentService: this.departmentService,
      locationService: this.locationService,
      businessProcessService: this.businessProcessService,
      securityCommitteeService: this.securityCommitteeService,
      committeeMeetingService: this.committeeMeetingService,
      externalDependencyService: this.externalDependencyService,
    });
  }

  canExecute(actionType: McpActionType): boolean {
    return this.executors.has(actionType);
  }

  async execute(actionType: McpActionType, payload: Record<string, any>, reviewedById: string): Promise<unknown> {
    const executor = this.executors.get(actionType);
    if (!executor) {
      this.logger.warn(`No executor registered for action type: ${actionType}`);
      return null;
    }

    this.logger.log(`Executing action type: ${actionType}`);
    return executor(payload, reviewedById);
  }
}
