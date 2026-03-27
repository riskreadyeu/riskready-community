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

// Action severity tiers for audit logging
const TIER_MAP: Record<string, string> = {
  // Tier 1: Create (new data, reversible)
  CREATE_RISK: 'low', CREATE_CONTROL: 'low', CREATE_SCENARIO: 'low',
  CREATE_ASSESSMENT: 'low', CREATE_KRI: 'low', CREATE_RTS: 'low',
  CREATE_TREATMENT_PLAN: 'low', CREATE_TREATMENT_ACTION: 'low',
  CREATE_POLICY: 'low', CREATE_EVIDENCE: 'low', CREATE_INCIDENT: 'low',
  CREATE_NONCONFORMITY: 'low', CREATE_ASSET: 'low', CREATE_CHANGE: 'low',
  CREATE_DEPARTMENT: 'low', CREATE_LOCATION: 'low',
  CREATE_BUSINESS_PROCESS: 'low', CREATE_COMMITTEE: 'low',
  CREATE_COMMITTEE_MEETING: 'low', CREATE_EXTERNAL_DEPENDENCY: 'low',
  CREATE_EVIDENCE_REQUEST: 'low', CREATE_CAPACITY_PLAN: 'low',
  CREATE_SCOPE_ITEM: 'low', CREATE_SOA: 'low',
  CREATE_POLICY_EXCEPTION: 'low', CREATE_POLICY_CHANGE_REQUEST: 'low',
  CREATE_ASSET_RELATIONSHIP: 'low', CREATE_REMEDIATION: 'low',

  // Tier 2: Update (modify existing data)
  UPDATE_RISK: 'medium', UPDATE_CONTROL: 'medium', UPDATE_POLICY: 'medium',
  UPDATE_INCIDENT: 'medium', UPDATE_NONCONFORMITY: 'medium',
  UPDATE_ASSESSMENT: 'medium', UPDATE_CHANGE: 'medium',
  UPDATE_ASSET: 'medium', UPDATE_SCOPE_ITEM: 'medium',
  UPDATE_SOA: 'medium', UPDATE_DEPARTMENT: 'medium',
  UPDATE_LOCATION: 'medium', UPDATE_BUSINESS_PROCESS: 'medium',
  UPDATE_COMMITTEE: 'medium', UPDATE_EXTERNAL_DEPENDENCY: 'medium',
  UPDATE_CAPACITY_PLAN: 'medium', UPDATE_ORG_PROFILE: 'medium',
  UPDATE_EVIDENCE: 'medium', UPDATE_CONTROL_STATUS: 'medium',
  UPDATE_METRIC_VALUE: 'medium', UPDATE_SOA_ENTRY: 'medium',
  UPDATE_TEST: 'medium', UPDATE_ROOT_CAUSE: 'medium',
  RECORD_KRI_VALUE: 'medium', RECORD_TEST_RESULT: 'medium',

  // Tier 3: Lifecycle transitions and approvals (business-critical)
  APPROVE_POLICY: 'high', PUBLISH_POLICY: 'high', RETIRE_POLICY: 'high',
  APPROVE_SOA: 'high', APPROVE_RTS: 'high', APPROVE_CAP: 'high',
  APPROVE_CHANGE: 'high', APPROVE_POLICY_EXCEPTION: 'high',
  SUBMIT_POLICY_REVIEW: 'high', SUBMIT_SOA_REVIEW: 'high',
  SUBMIT_ASSESSMENT_REVIEW: 'high', SUBMIT_CAP: 'high',
  COMPLETE_ASSESSMENT: 'high', COMPLETE_CHANGE: 'high',
  CLOSE_INCIDENT: 'high', CLOSE_NONCONFORMITY: 'high',
  CLOSE_EVIDENCE_REQUEST: 'high',

  // Tier 4: Destructive (irreversible)
  DELETE_ASSESSMENT: 'critical', DELETE_ASSET: 'critical',
  DELETE_SOA: 'critical', DELETE_SCOPE_ITEM: 'critical',
  DISABLE_CONTROL: 'critical', CANCEL_ASSESSMENT: 'critical',
  CANCEL_CHANGE: 'critical', REJECT_CHANGE: 'critical',
  REJECT_CAP: 'critical',
};

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
import { registerAgentOpsExecutors } from './executors/agent-ops.executors';

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

    registerAgentOpsExecutors(this.executors, {
      prismaService: this.prismaService,
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

    const tier = TIER_MAP[actionType] || 'medium';
    this.logger.log(`Executing ${tier} action: ${actionType}`);

    // Strip MCP-only metadata from the payload.
    // - `reason` is never a Prisma field — always strip it.
    // - `organisationId` is needed by CREATE operations (Prisma relation) but
    //   rejected by UPDATE operations (not a scalar update field).
    //   Determine which case by checking the action type prefix.
    const isCreate = actionType.startsWith('CREATE_') || actionType.startsWith('LINK_') || actionType.startsWith('ADD_') || actionType.startsWith('RECORD_');
    const { reason: _reason, ...rest } = payload;
    const cleanPayload = isCreate ? rest : (() => { const { organisationId: _org, ...data } = rest; return data; })();
    return executor(cleanPayload, reviewedById);
  }
}
