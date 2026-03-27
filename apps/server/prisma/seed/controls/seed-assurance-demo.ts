/**
 * Control Assurance Demo Seed
 *
 * Seeds the two-control demo from ISO27001_Control_Assurance_Demo.xlsx:
 * - Control A.5.15 (Access control) — 7 activities, 10 tests, 10 metrics
 * - Control A.8.8 (Management of technical vulnerabilities) — 7 activities, 10 tests, 12 metrics
 *
 * Creates ControlActivity, LayerTest (linked to activities), ControlMetric,
 * and sample test executions with realistic results.
 *
 * Run standalone: npx ts-node prisma/seed/controls/seed-assurance-demo.ts
 */

import {
  PrismaClient,
  LayerType,
  ActivityType,
  TestResult,
  CollectionFrequency,
  AutomationStatus,
  RAGStatus,
  TrendDirection,
  ScopeType,
  ScopeCriticality,
} from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================================
// Excel Layer name → DB enum mapping
// =============================================================================
const LAYER_MAP: Record<string, LayerType> = {
  'Governance & Design': 'GOVERNANCE',
  Platform: 'PLATFORM',
  Consumption: 'CONSUMPTION',
  Oversight: 'OVERSIGHT',
};

const ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  Process: 'PROCESS',
  Technology: 'TECHNOLOGY',
  People: 'PEOPLE',
  Physical: 'PHYSICAL',
};

// =============================================================================
// Scope Items (Applications)
// =============================================================================
interface ScopeItemSeed {
  code: string;
  name: string;
  scopeType: ScopeType;
  criticality: ScopeCriticality;
}

const SCOPE_ITEMS: ScopeItemSeed[] = [
  { code: 'AD', name: 'Active Directory', scopeType: 'APPLICATION', criticality: 'CRITICAL' },
  { code: 'M365', name: 'Microsoft 365', scopeType: 'APPLICATION', criticality: 'HIGH' },
  { code: 'SAP-ERP', name: 'SAP ERP', scopeType: 'APPLICATION', criticality: 'CRITICAL' },
  { code: 'SFDC', name: 'Salesforce', scopeType: 'APPLICATION', criticality: 'HIGH' },
  { code: 'SNOW', name: 'ServiceNow', scopeType: 'APPLICATION', criticality: 'MEDIUM' },
  { code: 'AWS', name: 'AWS Cloud', scopeType: 'APPLICATION', criticality: 'HIGH' },
  { code: 'JIRA', name: 'Jira', scopeType: 'APPLICATION', criticality: 'MEDIUM' },
  { code: 'CONFL', name: 'Confluence', scopeType: 'APPLICATION', criticality: 'LOW' },
  { code: 'GH', name: 'GitHub', scopeType: 'APPLICATION', criticality: 'HIGH' },
  { code: 'HRMS', name: 'HRMS', scopeType: 'APPLICATION', criticality: 'HIGH' },
];

// A.5.15 activities that need per-application testing
const SCOPED_ACTIVITIES = new Set(['A.5.15-C02', 'A.5.15-C03', 'A.5.15-C04', 'A.5.15-C05', 'A.5.15-C06']);

// Realistic per-app test results for scoped activities
// key: `${capabilityId}-${scopeItem.code}`, value: TestResult
const SCOPED_TEST_RESULTS: Record<string, TestResult> = {
  // C02 - Access Authorization Workflow
  'A.5.15-C02-AD': 'PASS', 'A.5.15-C02-M365': 'PASS', 'A.5.15-C02-SAP-ERP': 'PARTIAL',
  'A.5.15-C02-SFDC': 'PASS', 'A.5.15-C02-SNOW': 'PASS', 'A.5.15-C02-AWS': 'PASS',
  'A.5.15-C02-JIRA': 'PARTIAL', 'A.5.15-C02-GH': 'PASS', 'A.5.15-C02-HRMS': 'FAIL',
  'A.5.15-C02-CONFL': 'PASS',
  // C03 - RBAC
  'A.5.15-C03-AD': 'PASS', 'A.5.15-C03-M365': 'PASS', 'A.5.15-C03-SAP-ERP': 'PASS',
  'A.5.15-C03-SFDC': 'PARTIAL', 'A.5.15-C03-SNOW': 'PASS', 'A.5.15-C03-AWS': 'PASS',
  'A.5.15-C03-JIRA': 'PASS', 'A.5.15-C03-GH': 'PARTIAL', 'A.5.15-C03-HRMS': 'FAIL',
  'A.5.15-C03-CONFL': 'PASS',
  // C04 - Least Privilege
  'A.5.15-C04-AD': 'PASS', 'A.5.15-C04-M365': 'PARTIAL', 'A.5.15-C04-SAP-ERP': 'PARTIAL',
  'A.5.15-C04-SFDC': 'PASS', 'A.5.15-C04-SNOW': 'PASS', 'A.5.15-C04-AWS': 'PARTIAL',
  'A.5.15-C04-JIRA': 'PASS', 'A.5.15-C04-GH': 'PASS', 'A.5.15-C04-HRMS': 'FAIL',
  'A.5.15-C04-CONFL': 'PASS',
  // C05 - Periodic Access Review
  'A.5.15-C05-AD': 'PASS', 'A.5.15-C05-M365': 'PASS', 'A.5.15-C05-SAP-ERP': 'PASS',
  'A.5.15-C05-SFDC': 'PASS', 'A.5.15-C05-SNOW': 'PARTIAL', 'A.5.15-C05-AWS': 'PASS',
  'A.5.15-C05-JIRA': 'PARTIAL', 'A.5.15-C05-GH': 'PASS', 'A.5.15-C05-HRMS': 'PARTIAL',
  'A.5.15-C05-CONFL': 'NOT_TESTED',
  // C06 - SoD
  'A.5.15-C06-AD': 'PASS', 'A.5.15-C06-M365': 'PASS', 'A.5.15-C06-SAP-ERP': 'PARTIAL',
  'A.5.15-C06-SFDC': 'PARTIAL', 'A.5.15-C06-SNOW': 'PASS', 'A.5.15-C06-AWS': 'PASS',
  'A.5.15-C06-JIRA': 'NOT_APPLICABLE', 'A.5.15-C06-GH': 'NOT_APPLICABLE', 'A.5.15-C06-HRMS': 'FAIL',
  'A.5.15-C06-CONFL': 'NOT_APPLICABLE',
};

const FREQUENCY_MAP: Record<string, CollectionFrequency> = {
  Daily: 'DAILY',
  Weekly: 'WEEKLY',
  Monthly: 'MONTHLY',
  Quarterly: 'QUARTERLY',
  Annual: 'ANNUAL',
};

const AUTOMATION_MAP: Record<string, AutomationStatus> = {
  Yes: 'FULLY_AUTOMATED',
  Partial: 'SEMI_AUTOMATED',
  No: 'MANUAL',
};

const CRITICALITY_WEIGHT: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

// =============================================================================
// Capabilities (→ ControlActivity) from sheet "2.Capabilities"
// =============================================================================
interface CapabilityRow {
  controlId: string;
  capabilityId: string;
  name: string;
  layer: string;
  capabilityType: string;
  description: string;
  testCriteria: string;
  evidenceRequired: string;
}

const CAPABILITIES: CapabilityRow[] = [
  // A.5.15 — Access control
  {
    controlId: '5.15',
    capabilityId: 'A.5.15-C01',
    name: 'Access Control Policy Framework',
    layer: 'Governance & Design',
    capabilityType: 'Process',
    description: 'Documented access control policy defining principles, scope, roles, and authorization requirements',
    testCriteria: 'Access control policy exists with: (1) defined scope covering all systems, (2) least privilege principle stated, (3) authorization workflow defined, (4) review requirements specified, (5) executive approval dated within 12 months',
    evidenceRequired: 'Access control policy document; approval records; policy review log',
  },
  {
    controlId: '5.15',
    capabilityId: 'A.5.15-C02',
    name: 'Access Authorization Workflow',
    layer: 'Platform',
    capabilityType: 'Technology',
    description: 'Automated workflow for access requests requiring manager and data owner approval before provisioning',
    testCriteria: 'Access request system configured with: (1) manager approval step mandatory, (2) data owner approval for sensitive systems, (3) SLA tracking enabled, (4) audit trail of all approvals captured',
    evidenceRequired: 'IAM system configuration; sample of 10 recent access requests with approval chain; workflow screenshots',
  },
  {
    controlId: '5.15',
    capabilityId: 'A.5.15-C03',
    name: 'Role-Based Access Control (RBAC)',
    layer: 'Platform',
    capabilityType: 'Technology',
    description: 'Access permissions assigned through predefined roles aligned with job functions rather than individual permissions',
    testCriteria: 'RBAC implemented with: (1) ≥80% of access granted via roles not individual permissions, (2) role definitions documented with business justification, (3) role owners assigned, (4) role certification completed annually',
    evidenceRequired: 'Role catalog with descriptions; RBAC coverage report from IAM; sample of 5 role definitions with owner assignment',
  },
  {
    controlId: '5.15',
    capabilityId: 'A.5.15-C04',
    name: 'Least Privilege Enforcement',
    layer: 'Consumption',
    capabilityType: 'Process',
    description: 'Access rights limited to minimum necessary for job function with regular validation',
    testCriteria: 'Sample 25 users across departments: (1) access matches documented job requirements, (2) no excessive permissions identified, (3) access request tied to business justification',
    evidenceRequired: 'User access matrix sample; job description to access mapping; access justification records',
  },
  {
    controlId: '5.15',
    capabilityId: 'A.5.15-C05',
    name: 'Periodic Access Review',
    layer: 'Consumption',
    capabilityType: 'Process',
    description: 'Regular certification of user access rights by managers and data owners',
    testCriteria: 'Access reviews completed: (1) quarterly for privileged access, (2) semi-annually for standard access, (3) ≥95% completion rate, (4) revocations processed within 5 business days',
    evidenceRequired: 'Access review campaign results; completion rates by department; revocation tickets',
  },
  {
    controlId: '5.15',
    capabilityId: 'A.5.15-C06',
    name: 'Segregation of Duties (SoD)',
    layer: 'Consumption',
    capabilityType: 'Process',
    description: 'Conflicting duties separated to prevent fraud and errors; SoD violations detected and managed',
    testCriteria: 'SoD rules defined: (1) critical SoD pairs documented (≥20 rules), (2) automated detection enabled, (3) current violations <5% of population, (4) all violations have documented compensating controls or remediation plan',
    evidenceRequired: 'SoD ruleset; violation report with remediation status; compensating control documentation',
  },
  {
    controlId: '5.15',
    capabilityId: 'A.5.15-C07',
    name: 'Access Control Monitoring & Reporting',
    layer: 'Oversight',
    capabilityType: 'Technology',
    description: 'Continuous monitoring of access control effectiveness with dashboards and alerting',
    testCriteria: 'Monitoring in place: (1) dashboard shows access review completion, orphan accounts, SoD violations, (2) alerts for >10 failed access attempts, (3) monthly access control report to management, (4) KRIs tracked with thresholds',
    evidenceRequired: 'Access control dashboard screenshots; alert configuration; sample management report; KRI trending',
  },

  // A.8.8 — Management of technical vulnerabilities
  {
    controlId: '8.8',
    capabilityId: 'A.8.8-C01',
    name: 'Vulnerability Management Policy & Standards',
    layer: 'Governance & Design',
    capabilityType: 'Process',
    description: 'Documented policy defining vulnerability identification, assessment, remediation SLAs, and exception handling',
    testCriteria: 'Policy exists with: (1) scanning frequency requirements, (2) remediation SLAs by severity (Critical: 48-72h, High: 7-14 days, Medium: 30 days, Low: 90 days), (3) exception/risk acceptance process, (4) approved within 12 months',
    evidenceRequired: 'Vulnerability management policy; SLA matrix; exception process document; approval records',
  },
  {
    controlId: '8.8',
    capabilityId: 'A.8.8-C02',
    name: 'Vulnerability Scanning Infrastructure',
    layer: 'Platform',
    capabilityType: 'Technology',
    description: 'Automated vulnerability scanning tools covering all asset types with authenticated scanning capability',
    testCriteria: 'Scanning platform configured: (1) authenticated scanning enabled for ≥90% of assets, (2) scan schedules defined (weekly for internet-facing, monthly for internal), (3) integration with asset inventory, (4) CVSS scoring enabled',
    evidenceRequired: 'Scanner configuration export; scan schedule; asset coverage report; authentication credential management',
  },
  {
    controlId: '8.8',
    capabilityId: 'A.8.8-C03',
    name: 'Patch Management System',
    layer: 'Platform',
    capabilityType: 'Technology',
    description: 'Centralized patch deployment system with testing, approval workflow, and rollback capability',
    testCriteria: 'Patch system configured: (1) automated patch deployment enabled, (2) test environment validation before production, (3) emergency patch process documented, (4) rollback procedures tested quarterly',
    evidenceRequired: 'Patch management console screenshots; deployment workflow; test results; rollback test evidence',
  },
  {
    controlId: '8.8',
    capabilityId: 'A.8.8-C04',
    name: 'Vulnerability Remediation Tracking',
    layer: 'Consumption',
    capabilityType: 'Process',
    description: 'Systematic tracking of vulnerabilities from identification through remediation with owner assignment',
    testCriteria: 'Sample 20 critical/high vulnerabilities: (1) owner assigned within 24h of detection, (2) remediation plan documented, (3) SLA compliance tracked, (4) closure verification performed',
    evidenceRequired: 'Vulnerability tickets with timestamps; owner assignment records; SLA compliance report; closure evidence',
  },
  {
    controlId: '8.8',
    capabilityId: 'A.8.8-C05',
    name: 'Asset Coverage Validation',
    layer: 'Consumption',
    capabilityType: 'Process',
    description: 'Verification that vulnerability scanning covers all in-scope assets with no blind spots',
    testCriteria: 'Coverage validation: (1) ≥95% of assets scanned in last 30 days, (2) internet-facing assets scanned weekly, (3) new assets scanned within 24h of deployment, (4) coverage gaps reported and tracked',
    evidenceRequired: 'Asset inventory vs scan coverage reconciliation; gap report; new asset scan timestamps',
  },
  {
    controlId: '8.8',
    capabilityId: 'A.8.8-C06',
    name: 'Exception & Risk Acceptance Management',
    layer: 'Consumption',
    capabilityType: 'Process',
    description: 'Formal process for managing vulnerabilities that cannot be remediated within SLA with compensating controls',
    testCriteria: 'Exception process: (1) documented approval workflow with appropriate authority levels, (2) compensating controls required, (3) time-limited exceptions (max 90 days), (4) exceptions reviewed monthly',
    evidenceRequired: 'Exception register; approval records with authority level; compensating control documentation; review meeting minutes',
  },
  {
    controlId: '8.8',
    capabilityId: 'A.8.8-C07',
    name: 'Vulnerability Metrics & Reporting',
    layer: 'Oversight',
    capabilityType: 'Technology',
    description: 'Continuous monitoring of vulnerability posture with KRIs, dashboards, and executive reporting',
    testCriteria: 'Monitoring in place: (1) real-time vulnerability dashboard, (2) MTTR tracked by severity, (3) SLA compliance trending, (4) monthly executive report, (5) alerts for critical vulnerabilities and SLA breaches',
    evidenceRequired: 'Vulnerability dashboard; MTTR metrics; SLA compliance report; executive report sample; alert configuration',
  },
];

// =============================================================================
// Test Cases from sheet "3.Test_Cases"
// =============================================================================
interface TestCaseRow {
  testId: string;
  controlId: string;
  capabilityId: string;
  layer: string;
  population: string;
  objective: string;
  procedure: string;
  evidence: string;
  acceptanceCriteria: string;
  owner: string;
  priority: string;
  hours: number;
}

const TEST_CASES: TestCaseRow[] = [
  // A.5.15 tests
  { testId: 'TC-A.5.15-001', controlId: '5.15', capabilityId: 'A.5.15-C01', layer: 'Governance & Design', population: 'ALL', objective: 'Verify access control policy documentation exists and is current', procedure: '1. Obtain access control policy from document management system. 2. Review for required elements: scope, principles, authorization workflow, review requirements. 3. Verify executive approval and date. 4. Check version control and review history.', evidence: 'Access control policy document; approval signature page; version control log', acceptanceCriteria: 'Policy exists, covers all required elements, approved by CISO/executive within 12 months, version controlled', owner: 'GRC', priority: 'P1', hours: 2 },
  { testId: 'TC-A.5.15-002', controlId: '5.15', capabilityId: 'A.5.15-C01', layer: 'Governance & Design', population: 'ALL', objective: 'Verify access control standards define authorization levels and approval requirements', procedure: '1. Review access control standards document. 2. Verify authorization matrix defines approval requirements by system sensitivity. 3. Confirm data owner responsibilities documented. 4. Check alignment with policy.', evidence: 'Access control standards; authorization matrix; data classification mapping', acceptanceCriteria: 'Standards exist, authorization matrix complete for all system tiers, data owner roles defined', owner: 'GRC', priority: 'P1', hours: 2 },
  { testId: 'TC-A.5.15-003', controlId: '5.15', capabilityId: 'A.5.15-C02', layer: 'Platform', population: 'ALL', objective: 'Verify access request workflow is configured with required approval steps', procedure: '1. Access IAM system admin console. 2. Review workflow configuration for standard access requests. 3. Verify manager approval step is mandatory. 4. Verify data owner approval for sensitive systems. 5. Confirm SLA tracking enabled.', evidence: 'IAM workflow configuration screenshots; approval step settings; SLA configuration', acceptanceCriteria: 'Manager approval mandatory for all requests; data owner approval for sensitive systems; SLA ≤5 days tracked', owner: 'IT Identity', priority: 'P0', hours: 3 },
  { testId: 'TC-A.5.15-004', controlId: '5.15', capabilityId: 'A.5.15-C02', layer: 'Platform', population: 'Corporate SaaS', objective: 'Verify access provisioning automation is functioning correctly', procedure: '1. Create test access request in IAM system. 2. Complete approval workflow. 3. Verify access provisioned to target system via SCIM/API. 4. Verify provisioning timestamp meets SLA. 5. Verify audit log entry created.', evidence: 'Test request ticket; approval records; target system access verification; audit log', acceptanceCriteria: 'Access provisioned within 4 hours of final approval; audit trail complete', owner: 'IT Identity', priority: 'P0', hours: 4 },
  { testId: 'TC-A.5.15-005', controlId: '5.15', capabilityId: 'A.5.15-C03', layer: 'Platform', population: 'ALL', objective: 'Verify RBAC model is implemented with documented roles', procedure: '1. Export role catalog from IAM system. 2. Verify each role has documented business justification. 3. Verify role owner assigned. 4. Calculate % of access granted via roles vs individual permissions.', evidence: 'Role catalog export; role documentation; RBAC coverage metrics', acceptanceCriteria: '≥80% access via roles; all roles have documented justification and assigned owner', owner: 'IT Identity', priority: 'P0', hours: 4 },
  { testId: 'TC-A.5.15-006', controlId: '5.15', capabilityId: 'A.5.15-C04', layer: 'Consumption', population: 'ALL', objective: 'Verify least privilege is enforced through user access sampling', procedure: '1. Select random sample of 25 users across departments. 2. For each user, compare access rights to documented job requirements. 3. Identify any excessive permissions not justified by role. 4. Document findings.', evidence: 'Sample user list; access rights report; job description mapping; findings summary', acceptanceCriteria: '≤5% of sampled users have unjustified excess permissions', owner: 'IT Security', priority: 'P0', hours: 6 },
  { testId: 'TC-A.5.15-007', controlId: '5.15', capabilityId: 'A.5.15-C05', layer: 'Consumption', population: 'ALL', objective: 'Verify access review campaigns are completed on schedule', procedure: '1. Obtain access review campaign schedule. 2. Review completion rates for last 4 quarters. 3. Verify privileged access reviewed quarterly. 4. Verify standard access reviewed semi-annually. 5. Sample 10 revocations to verify processing time.', evidence: 'Access review campaign reports; completion metrics; revocation tickets with timestamps', acceptanceCriteria: '≥95% completion rate; privileged reviewed quarterly; revocations processed within 5 business days', owner: 'IT Security', priority: 'P0', hours: 4 },
  { testId: 'TC-A.5.15-008', controlId: '5.15', capabilityId: 'A.5.15-C06', layer: 'Consumption', population: 'Business Apps', objective: 'Verify SoD violations are detected and managed', procedure: '1. Obtain SoD ruleset and violation report. 2. Verify ≥20 critical SoD rules defined. 3. Review current violation count and rate. 4. Sample 5 violations to verify compensating controls or remediation plan exists.', evidence: 'SoD ruleset; violation report; compensating control documentation; remediation plans', acceptanceCriteria: '≥20 SoD rules; violations <5% of population; all violations have documented mitigation', owner: 'IT Security', priority: 'P1', hours: 4 },
  { testId: 'TC-A.5.15-009', controlId: '5.15', capabilityId: 'A.5.15-C07', layer: 'Oversight', population: 'ALL', objective: 'Verify access control KRIs are tracked with appropriate thresholds', procedure: '1. Review access control KRI definitions and thresholds. 2. Verify KRIs include: access review completion, orphan accounts, SoD violations, privileged access count. 3. Review trending for last 6 months. 4. Verify escalation for threshold breaches.', evidence: 'KRI definitions; threshold configuration; trending reports; escalation records', acceptanceCriteria: 'All defined KRIs tracked monthly; thresholds documented; breaches escalated within 48h', owner: 'GRC', priority: 'P1', hours: 3 },
  { testId: 'TC-A.5.15-010', controlId: '5.15', capabilityId: 'A.5.15-C07', layer: 'Oversight', population: 'ALL', objective: 'Verify access control reporting to management is occurring', procedure: '1. Obtain last 3 months of access control management reports. 2. Verify reports include key metrics: review completion, violations, orphan accounts. 3. Verify distribution to appropriate management level. 4. Review evidence of management action on findings.', evidence: 'Management reports; distribution records; meeting minutes showing discussion', acceptanceCriteria: 'Monthly reports produced; distributed to IT management; findings actioned', owner: 'GRC', priority: 'P1', hours: 2 },

  // A.8.8 tests
  { testId: 'TC-A.8.8-001', controlId: '8.8', capabilityId: 'A.8.8-C01', layer: 'Governance & Design', population: 'ALL', objective: 'Verify vulnerability management policy defines remediation SLAs', procedure: '1. Obtain vulnerability management policy. 2. Verify remediation SLAs defined by severity (Critical, High, Medium, Low). 3. Verify scanning frequency requirements documented. 4. Check approval and review date.', evidence: 'Vulnerability management policy; SLA matrix; approval records', acceptanceCriteria: 'Policy approved within 12 months; SLAs defined for all severity levels; Critical ≤72h, High ≤14d, Medium ≤30d', owner: 'GRC', priority: 'P1', hours: 2 },
  { testId: 'TC-A.8.8-002', controlId: '8.8', capabilityId: 'A.8.8-C01', layer: 'Governance & Design', population: 'ALL', objective: 'Verify exception/risk acceptance process is documented', procedure: '1. Review vulnerability exception process documentation. 2. Verify approval authority levels defined. 3. Verify compensating control requirements. 4. Verify time limits on exceptions.', evidence: 'Exception process document; approval matrix; exception template', acceptanceCriteria: 'Process documented; authority levels defined (Critical requires CISO); max exception duration 90 days', owner: 'GRC', priority: 'P1', hours: 2 },
  { testId: 'TC-A.8.8-003', controlId: '8.8', capabilityId: 'A.8.8-C02', layer: 'Platform', population: 'ALL', objective: 'Verify vulnerability scanner configuration meets requirements', procedure: '1. Access vulnerability scanner admin console. 2. Verify authenticated scanning enabled. 3. Review scan schedules (weekly internet-facing, monthly internal). 4. Verify CVSS scoring enabled. 5. Check asset inventory integration.', evidence: 'Scanner configuration export; scan schedules; credential management settings; asset integration config', acceptanceCriteria: 'Authenticated scanning ≥90% assets; schedules per policy; CVSS v3.x scoring; asset sync enabled', owner: 'Security Operations', priority: 'P0', hours: 4 },
  { testId: 'TC-A.8.8-004', controlId: '8.8', capabilityId: 'A.8.8-C02', layer: 'Platform', population: 'Cloud Infrastructure', objective: 'Verify cloud-native vulnerability scanning is configured', procedure: '1. Review cloud security posture management (CSPM) configuration. 2. Verify container/image scanning enabled. 3. Verify IaC scanning in CI/CD pipeline. 4. Check integration with central vulnerability management.', evidence: 'CSPM configuration; container scanning settings; pipeline configuration; integration evidence', acceptanceCriteria: 'CSPM enabled all subscriptions; container scanning in registry; IaC scanning blocks high-severity', owner: 'Cloud Security', priority: 'P0', hours: 4 },
  { testId: 'TC-A.8.8-005', controlId: '8.8', capabilityId: 'A.8.8-C03', layer: 'Platform', population: 'Corporate Endpoints', objective: 'Verify patch management system is properly configured', procedure: '1. Review patch management console configuration. 2. Verify automated deployment schedules. 3. Verify test environment validation workflow. 4. Test rollback capability documentation. 5. Review emergency patch process.', evidence: 'Patch system configuration; deployment schedules; test validation process; rollback procedure', acceptanceCriteria: 'Automated deployment enabled; test validation required; rollback tested quarterly; emergency process <24h', owner: 'IT Operations', priority: 'P0', hours: 4 },
  { testId: 'TC-A.8.8-006', controlId: '8.8', capabilityId: 'A.8.8-C04', layer: 'Consumption', population: 'ALL', objective: 'Verify critical vulnerability remediation meets SLA', procedure: '1. Export list of critical vulnerabilities from last 90 days. 2. Sample 20 critical vulnerabilities. 3. For each, verify: detection date, owner assignment date, remediation date. 4. Calculate SLA compliance rate.', evidence: 'Critical vulnerability list; sample remediation tickets; SLA calculation', acceptanceCriteria: '≥90% critical vulnerabilities remediated within SLA (72h); owners assigned within 24h', owner: 'Security Operations', priority: 'P0', hours: 6 },
  { testId: 'TC-A.8.8-007', controlId: '8.8', capabilityId: 'A.8.8-C05', layer: 'Consumption', population: 'ALL', objective: 'Verify vulnerability scanning coverage across asset inventory', procedure: '1. Export asset inventory. 2. Export vulnerability scan coverage report. 3. Reconcile: identify assets not scanned in last 30 days. 4. Verify internet-facing assets scanned weekly. 5. Review new asset scan timing.', evidence: 'Asset inventory; scan coverage report; reconciliation analysis; new asset scan evidence', acceptanceCriteria: '≥95% assets scanned in 30 days; 100% internet-facing scanned weekly; new assets scanned <24h', owner: 'Security Operations', priority: 'P0', hours: 4 },
  { testId: 'TC-A.8.8-008', controlId: '8.8', capabilityId: 'A.8.8-C06', layer: 'Consumption', population: 'ALL', objective: 'Verify vulnerability exceptions are properly managed', procedure: '1. Obtain current vulnerability exception register. 2. Sample 10 exceptions. 3. For each, verify: appropriate approval authority, compensating controls documented, expiration date set. 4. Verify expired exceptions are reviewed.', evidence: 'Exception register; approval records; compensating control documentation; expiry tracking', acceptanceCriteria: 'All exceptions have appropriate approval; compensating controls documented; max duration 90 days; monthly review', owner: 'Security Operations', priority: 'P1', hours: 4 },
  { testId: 'TC-A.8.8-009', controlId: '8.8', capabilityId: 'A.8.8-C07', layer: 'Oversight', population: 'ALL', objective: 'Verify vulnerability KRIs are tracked with thresholds and alerting', procedure: '1. Review vulnerability management KRI definitions. 2. Verify KRIs include: MTTR by severity, SLA compliance, scan coverage, open critical count. 3. Verify threshold alerting configured. 4. Review trending for last 6 months.', evidence: 'KRI definitions; threshold configuration; alert rules; trending dashboard', acceptanceCriteria: 'All KRIs tracked; green/amber/red thresholds defined; alerts for red status; monthly trending reviewed', owner: 'Security Operations', priority: 'P0', hours: 3 },
  { testId: 'TC-A.8.8-010', controlId: '8.8', capabilityId: 'A.8.8-C07', layer: 'Oversight', population: 'ALL', objective: 'Verify vulnerability management executive reporting', procedure: '1. Obtain last 3 monthly executive vulnerability reports. 2. Verify reports include: posture summary, MTTR trends, SLA compliance, critical vulnerability count, exception count. 3. Verify appropriate distribution. 4. Review evidence of management action.', evidence: 'Executive reports; distribution list; meeting minutes; action items', acceptanceCriteria: 'Monthly reports to CISO/executive; includes all key metrics; actions tracked to closure', owner: 'Security Operations', priority: 'P1', hours: 2 },
];

// =============================================================================
// Metrics from sheet "4.Metrics"
// =============================================================================
interface MetricRow {
  metricId: string;
  controlId: string;
  capabilityId: string;
  name: string;
  description: string;
  unit: string;
  green: string;
  amber: string;
  red: string;
  dataSource: string;
  collectionFrequency: string;
  owner: string;
  automated: string;
}

const METRICS: MetricRow[] = [
  // A.5.15 metrics
  { metricId: 'M-A.5.15-001', controlId: '5.15', capabilityId: 'A.5.15-C01', name: 'Access Control Policy Currency', description: 'Days since access control policy was last reviewed and approved', unit: 'Days', green: '≤365', amber: '366-450', red: '>450', dataSource: 'Policy Management System', collectionFrequency: 'Monthly', owner: 'GRC', automated: 'Yes' },
  { metricId: 'M-A.5.15-002', controlId: '5.15', capabilityId: 'A.5.15-C02', name: 'Access Request SLA Compliance', description: 'Percentage of access requests processed within defined SLA', unit: '%', green: '≥95', amber: '85-94', red: '<85', dataSource: 'IAM System', collectionFrequency: 'Weekly', owner: 'IT Identity', automated: 'Yes' },
  { metricId: 'M-A.5.15-003', controlId: '5.15', capabilityId: 'A.5.15-C02', name: 'Access Request Approval Coverage', description: 'Percentage of access requests with complete approval chain', unit: '%', green: '100', amber: '95-99', red: '<95', dataSource: 'IAM System', collectionFrequency: 'Weekly', owner: 'IT Identity', automated: 'Yes' },
  { metricId: 'M-A.5.15-004', controlId: '5.15', capabilityId: 'A.5.15-C03', name: 'RBAC Coverage Rate', description: 'Percentage of access granted through roles vs individual permissions', unit: '%', green: '≥80', amber: '70-79', red: '<70', dataSource: 'IAM System', collectionFrequency: 'Monthly', owner: 'IT Identity', automated: 'Yes' },
  { metricId: 'M-A.5.15-005', controlId: '5.15', capabilityId: 'A.5.15-C04', name: 'Excessive Permission Rate', description: 'Percentage of users with permissions exceeding documented job requirements', unit: '%', green: '≤5', amber: '6-10', red: '>10', dataSource: 'Access Review Tool', collectionFrequency: 'Quarterly', owner: 'IT Security', automated: 'Partial' },
  { metricId: 'M-A.5.15-006', controlId: '5.15', capabilityId: 'A.5.15-C05', name: 'Access Review Completion Rate', description: 'Percentage of required access reviews completed on schedule', unit: '%', green: '≥95', amber: '85-94', red: '<85', dataSource: 'Access Review Tool', collectionFrequency: 'Quarterly', owner: 'IT Security', automated: 'Yes' },
  { metricId: 'M-A.5.15-007', controlId: '5.15', capabilityId: 'A.5.15-C05', name: 'Access Revocation Timeliness', description: 'Average days to process access revocations from review findings', unit: 'Days', green: '≤5', amber: '6-10', red: '>10', dataSource: 'IAM System', collectionFrequency: 'Monthly', owner: 'IT Identity', automated: 'Yes' },
  { metricId: 'M-A.5.15-008', controlId: '5.15', capabilityId: 'A.5.15-C06', name: 'SoD Violation Rate', description: 'Percentage of users with unmitigated segregation of duties violations', unit: '%', green: '<3', amber: '3-5', red: '>5', dataSource: 'GRC/IAM System', collectionFrequency: 'Monthly', owner: 'IT Security', automated: 'Yes' },
  { metricId: 'M-A.5.15-009', controlId: '5.15', capabilityId: 'A.5.15-C07', name: 'Orphan Account Count', description: 'Number of active accounts without corresponding HR record or owner', unit: 'Count', green: '0', amber: '1-10', red: '>10', dataSource: 'IAM System', collectionFrequency: 'Weekly', owner: 'IT Identity', automated: 'Yes' },
  { metricId: 'M-A.5.15-010', controlId: '5.15', capabilityId: 'A.5.15-C07', name: 'Access Control Report Timeliness', description: 'Days after month-end that access control report is published', unit: 'Days', green: '≤5', amber: '6-10', red: '>10', dataSource: 'GRC System', collectionFrequency: 'Monthly', owner: 'GRC', automated: 'Partial' },

  // A.8.8 metrics
  { metricId: 'M-A.8.8-001', controlId: '8.8', capabilityId: 'A.8.8-C01', name: 'Vulnerability Policy Currency', description: 'Days since vulnerability management policy was last reviewed and approved', unit: 'Days', green: '≤365', amber: '366-450', red: '>450', dataSource: 'Policy Management System', collectionFrequency: 'Monthly', owner: 'GRC', automated: 'Yes' },
  { metricId: 'M-A.8.8-002', controlId: '8.8', capabilityId: 'A.8.8-C02', name: 'Authenticated Scan Coverage', description: 'Percentage of assets scanned with authenticated scanning', unit: '%', green: '≥90', amber: '80-89', red: '<80', dataSource: 'Vulnerability Scanner', collectionFrequency: 'Weekly', owner: 'Security Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-003', controlId: '8.8', capabilityId: 'A.8.8-C02', name: 'Scan Schedule Compliance', description: 'Percentage of scheduled scans completed on time', unit: '%', green: '≥98', amber: '90-97', red: '<90', dataSource: 'Vulnerability Scanner', collectionFrequency: 'Weekly', owner: 'Security Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-004', controlId: '8.8', capabilityId: 'A.8.8-C03', name: 'Patch Deployment Success Rate', description: 'Percentage of patches successfully deployed without rollback', unit: '%', green: '≥98', amber: '95-97', red: '<95', dataSource: 'Patch Management System', collectionFrequency: 'Weekly', owner: 'IT Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-005', controlId: '8.8', capabilityId: 'A.8.8-C04', name: 'Critical Vulnerability MTTR', description: 'Mean time to remediate critical (CVSS ≥9.0) vulnerabilities in hours', unit: 'Hours', green: '≤48', amber: '49-72', red: '>72', dataSource: 'Vulnerability Scanner', collectionFrequency: 'Weekly', owner: 'Security Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-006', controlId: '8.8', capabilityId: 'A.8.8-C04', name: 'High Vulnerability MTTR', description: 'Mean time to remediate high (CVSS 7.0-8.9) vulnerabilities in days', unit: 'Days', green: '≤7', amber: '8-14', red: '>14', dataSource: 'Vulnerability Scanner', collectionFrequency: 'Weekly', owner: 'Security Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-007', controlId: '8.8', capabilityId: 'A.8.8-C04', name: 'Critical Vulnerability SLA Compliance', description: 'Percentage of critical vulnerabilities remediated within SLA', unit: '%', green: '≥95', amber: '85-94', red: '<85', dataSource: 'Vulnerability Scanner', collectionFrequency: 'Weekly', owner: 'Security Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-008', controlId: '8.8', capabilityId: 'A.8.8-C05', name: 'Asset Scan Coverage', description: 'Percentage of assets scanned for vulnerabilities in last 30 days', unit: '%', green: '≥95', amber: '90-94', red: '<90', dataSource: 'Vulnerability Scanner', collectionFrequency: 'Weekly', owner: 'Security Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-009', controlId: '8.8', capabilityId: 'A.8.8-C05', name: 'Internet-Facing Scan Frequency', description: 'Percentage of internet-facing assets scanned within last 7 days', unit: '%', green: '100', amber: '95-99', red: '<95', dataSource: 'Vulnerability Scanner', collectionFrequency: 'Weekly', owner: 'Security Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-010', controlId: '8.8', capabilityId: 'A.8.8-C06', name: 'Vulnerability Exception Count', description: 'Number of active vulnerability exceptions/risk acceptances', unit: 'Count', green: '≤10', amber: '11-25', red: '>25', dataSource: 'Exception Register', collectionFrequency: 'Weekly', owner: 'Security Operations', automated: 'Partial' },
  { metricId: 'M-A.8.8-011', controlId: '8.8', capabilityId: 'A.8.8-C07', name: 'Open Critical Vulnerability Count', description: 'Number of unpatched critical vulnerabilities across all assets', unit: 'Count', green: '0', amber: '1-5', red: '>5', dataSource: 'Vulnerability Scanner', collectionFrequency: 'Daily', owner: 'Security Operations', automated: 'Yes' },
  { metricId: 'M-A.8.8-012', controlId: '8.8', capabilityId: 'A.8.8-C07', name: 'Vulnerability Report Timeliness', description: 'Days after month-end that vulnerability management report is published', unit: 'Days', green: '≤5', amber: '6-10', red: '>10', dataSource: 'GRC System', collectionFrequency: 'Monthly', owner: 'Security Operations', automated: 'Partial' },
];

// =============================================================================
// Sample metric values for realistic demo data
// =============================================================================
const SAMPLE_VALUES: Record<string, { value: string; status: RAGStatus; trend: TrendDirection }> = {
  'M-A.5.15-001': { value: '180', status: 'GREEN', trend: 'STABLE' },
  'M-A.5.15-002': { value: '97', status: 'GREEN', trend: 'IMPROVING' },
  'M-A.5.15-003': { value: '98', status: 'AMBER', trend: 'STABLE' },
  'M-A.5.15-004': { value: '84', status: 'GREEN', trend: 'IMPROVING' },
  'M-A.5.15-005': { value: '3', status: 'GREEN', trend: 'IMPROVING' },
  'M-A.5.15-006': { value: '96', status: 'GREEN', trend: 'STABLE' },
  'M-A.5.15-007': { value: '3', status: 'GREEN', trend: 'IMPROVING' },
  'M-A.5.15-008': { value: '4.2', status: 'AMBER', trend: 'DECLINING' },
  'M-A.5.15-009': { value: '2', status: 'AMBER', trend: 'DECLINING' },
  'M-A.5.15-010': { value: '4', status: 'GREEN', trend: 'STABLE' },
  'M-A.8.8-001': { value: '210', status: 'GREEN', trend: 'STABLE' },
  'M-A.8.8-002': { value: '92', status: 'GREEN', trend: 'IMPROVING' },
  'M-A.8.8-003': { value: '99', status: 'GREEN', trend: 'STABLE' },
  'M-A.8.8-004': { value: '97', status: 'AMBER', trend: 'STABLE' },
  'M-A.8.8-005': { value: '52', status: 'AMBER', trend: 'DECLINING' },
  'M-A.8.8-006': { value: '9', status: 'AMBER', trend: 'STABLE' },
  'M-A.8.8-007': { value: '91', status: 'AMBER', trend: 'DECLINING' },
  'M-A.8.8-008': { value: '96', status: 'GREEN', trend: 'IMPROVING' },
  'M-A.8.8-009': { value: '100', status: 'GREEN', trend: 'STABLE' },
  'M-A.8.8-010': { value: '8', status: 'GREEN', trend: 'STABLE' },
  'M-A.8.8-011': { value: '3', status: 'AMBER', trend: 'DECLINING' },
  'M-A.8.8-012': { value: '6', status: 'AMBER', trend: 'STABLE' },
};

// Sample test results — realistic mix
const SAMPLE_RESULTS: Record<string, TestResult> = {
  'TC-A.5.15-001': 'PASS',
  'TC-A.5.15-002': 'PASS',
  'TC-A.5.15-003': 'PASS',
  'TC-A.5.15-004': 'PASS',
  'TC-A.5.15-005': 'PASS',
  'TC-A.5.15-006': 'PARTIAL',
  'TC-A.5.15-007': 'PASS',
  'TC-A.5.15-008': 'PARTIAL',
  'TC-A.5.15-009': 'PASS',
  'TC-A.5.15-010': 'PASS',
  'TC-A.8.8-001': 'PASS',
  'TC-A.8.8-002': 'PASS',
  'TC-A.8.8-003': 'PASS',
  'TC-A.8.8-004': 'PARTIAL',
  'TC-A.8.8-005': 'PASS',
  'TC-A.8.8-006': 'PARTIAL',
  'TC-A.8.8-007': 'PASS',
  'TC-A.8.8-008': 'FAIL',
  'TC-A.8.8-009': 'PASS',
  'TC-A.8.8-010': 'PASS',
};

// =============================================================================
// Main seed function
// =============================================================================
export async function seedAssuranceDemo(prismaArg?: PrismaClient): Promise<{
  activitiesCreated: number;
  testsCreated: number;
  metricsCreated: number;
  executionsCreated: number;
  scopeItemsCreated: number;
}> {
  const db = prismaArg || prisma;
  console.log('🎯 Seeding control assurance demo (A.5.15 + A.8.8)...\n');

  const user = await db.user.findFirst();
  if (!user) {
    console.warn('   ⚠️ No user found. Skipping.');
    return { activitiesCreated: 0, testsCreated: 0, metricsCreated: 0, executionsCreated: 0, scopeItemsCreated: 0 };
  }

  // Fetch the two controls with their layers
  const controls = await db.control.findMany({
    where: { controlId: { in: ['5.15', '8.8'] } },
    include: { layers: true },
  });

  if (controls.length === 0) {
    console.warn('   ⚠️ Controls 5.15 and 8.8 not found. Run full seed first.');
    return { activitiesCreated: 0, testsCreated: 0, metricsCreated: 0, executionsCreated: 0, scopeItemsCreated: 0 };
  }

  // Build lookup: controlId → layerType → layerId
  const layerLookup: Record<string, Record<string, string>> = {};
  for (const control of controls) {
    layerLookup[control.controlId] = {};
    for (const layer of control.layers) {
      layerLookup[control.controlId][layer.layer] = layer.id;
    }
  }

  let activitiesCreated = 0;
  let testsCreated = 0;
  let metricsCreated = 0;
  let executionsCreated = 0;
  let scopeItemsCreated = 0;

  // ------------------------------------------------------------------
  // 1. Get organisation and create scope items
  // ------------------------------------------------------------------
  const org = await db.organisationProfile.findFirst();
  if (!org) {
    console.warn('   ⚠️ No organisation found. Skipping scope items.');
  }

  // Create scope items
  const scopeItemMap: Record<string, string> = {}; // code → DB id
  if (org) {
    for (const item of SCOPE_ITEMS) {
      const scopeItem = await db.scopeItem.upsert({
        where: {
          organisationId_scopeType_code: {
            organisationId: org.id,
            scopeType: item.scopeType,
            code: item.code,
          },
        },
        update: {
          name: item.name,
          criticality: item.criticality,
        },
        create: {
          organisationId: org.id,
          scopeType: item.scopeType,
          code: item.code,
          name: item.name,
          criticality: item.criticality,
          createdById: user.id,
        },
      });
      scopeItemMap[item.code] = scopeItem.id;
      scopeItemsCreated++;
    }
    console.log(`   ✅ ${SCOPE_ITEMS.length} scope items created`);
  }

  // ------------------------------------------------------------------
  // 1b. Delete existing old template-based activities for these controls
  //    to replace with rich demo data
  // ------------------------------------------------------------------
  for (const control of controls) {
    const oldActivities = await db.controlActivity.findMany({
      where: { layer: { controlId: control.id } },
      select: { id: true },
    });
    if (oldActivities.length > 0) {
      await db.controlActivity.deleteMany({
        where: { id: { in: oldActivities.map((a) => a.id) } },
      });
      console.log(`   🗑️  Cleared ${oldActivities.length} old activities for ${control.controlId}`);
    }
  }

  // ------------------------------------------------------------------
  // 2. Create ControlActivities (from Capabilities sheet)
  // ------------------------------------------------------------------
  const activityIdMap: Record<string, string> = {}; // capabilityId → DB id

  for (let i = 0; i < CAPABILITIES.length; i++) {
    const cap = CAPABILITIES[i];
    const layerType = LAYER_MAP[cap.layer];
    const layerId = layerLookup[cap.controlId]?.[layerType];
    if (!layerId) {
      console.warn(`   ⚠️ Layer ${cap.layer} not found for ${cap.controlId}`);
      continue;
    }

    const activity = await db.controlActivity.upsert({
      where: {
        activityId_layerId: { activityId: cap.capabilityId, layerId },
      },
      update: {
        name: cap.name,
        activityType: ACTIVITY_TYPE_MAP[cap.capabilityType],
        description: cap.description,
        testCriteria: cap.testCriteria,
        evidenceRequired: cap.evidenceRequired,
        sortOrder: i,
        scopeType: SCOPED_ACTIVITIES.has(cap.capabilityId) ? 'APPLICATION' as ScopeType : null,
      },
      create: {
        activityId: cap.capabilityId,
        layerId,
        name: cap.name,
        activityType: ACTIVITY_TYPE_MAP[cap.capabilityType],
        description: cap.description,
        testCriteria: cap.testCriteria,
        evidenceRequired: cap.evidenceRequired,
        sortOrder: i,
        scopeType: SCOPED_ACTIVITIES.has(cap.capabilityId) ? 'APPLICATION' as ScopeType : null,
        createdById: user.id,
      },
    });

    activityIdMap[cap.capabilityId] = activity.id;
    activitiesCreated++;
  }

  console.log(`   ✅ ${activitiesCreated} activities created`);

  // ------------------------------------------------------------------
  // 3. Create LayerTests (from Test_Cases sheet), linked to activities
  // ------------------------------------------------------------------
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  for (const tc of TEST_CASES) {
    const layerType = LAYER_MAP[tc.layer];
    const layerId = layerLookup[tc.controlId]?.[layerType];
    const activityId = activityIdMap[tc.capabilityId] || null;
    if (!layerId) continue;

    const result = SAMPLE_RESULTS[tc.testId] || 'NOT_TESTED';
    const executionDate = new Date(oneMonthAgo);
    executionDate.setDate(executionDate.getDate() + Math.floor(Math.random() * 20));

    // Upsert test
    const test = await db.layerTest.upsert({
      where: {
        testCode_layerId: { testCode: tc.testId, layerId },
      },
      update: {
        name: tc.objective,
        description: tc.procedure,
        expectedResult: tc.acceptanceCriteria,
        evidenceRequired: tc.evidence,
        estimatedDuration: tc.hours * 60,
        activityId,
        status: 'COMPLETED',
        result,
        lastTestedAt: executionDate,
        lastTesterId: user.id,
      },
      create: {
        testCode: tc.testId,
        layerId,
        activityId,
        name: tc.objective,
        description: tc.procedure,
        expectedResult: tc.acceptanceCriteria,
        evidenceRequired: tc.evidence,
        estimatedDuration: tc.hours * 60,
        status: 'COMPLETED',
        result,
        lastTestedAt: executionDate,
        lastTesterId: user.id,
        findings: result === 'FAIL' ? 'Exception management process has gaps — expired exceptions not being reviewed monthly as required.' : result === 'PARTIAL' ? 'Minor deficiencies found — some areas meet criteria but improvement needed.' : null,
        recommendations: result !== 'PASS' ? 'Implement remediation plan and re-test within 30 days.' : null,
        createdById: user.id,
      },
    });

    // Create test execution record
    await db.layerTestExecution.create({
      data: {
        testId: test.id,
        testerId: user.id,
        executionDate,
        result,
        findings: result === 'FAIL' ? 'Exception management process has gaps.' : result === 'PARTIAL' ? 'Minor deficiencies found.' : 'All criteria met.',
        recommendations: result !== 'PASS' ? 'Remediation required.' : null,
        durationMinutes: tc.hours * 60,
        samplesReviewed: tc.population === 'ALL' ? 10 : 5,
        periodStart: oneMonthAgo,
        periodEnd: executionDate,
      },
    });

    testsCreated++;
    executionsCreated++;
  }

  console.log(`   ✅ ${testsCreated} tests created with executions`);

  // ------------------------------------------------------------------
  // 3b. Create per-application scoped tests for A.5.15 activities
  // ------------------------------------------------------------------
  if (org) {
    for (const capId of SCOPED_ACTIVITIES) {
      const activityId = activityIdMap[capId];
      if (!activityId) continue;

      const cap = CAPABILITIES.find((c) => c.capabilityId === capId);
      if (!cap) continue;

      const layerType = LAYER_MAP[cap.layer];
      const layerId = layerLookup[cap.controlId]?.[layerType];
      if (!layerId) continue;

      for (const scopeItem of SCOPE_ITEMS) {
        const testCode = `${capId}-${scopeItem.code}`;
        const result = SCOPED_TEST_RESULTS[testCode] || 'NOT_TESTED';
        const executionDate = new Date(oneMonthAgo);
        executionDate.setDate(executionDate.getDate() + Math.floor(Math.random() * 20));

        const scopeItemId = scopeItemMap[scopeItem.code];
        if (!scopeItemId) continue;

        const test = await db.layerTest.upsert({
          where: {
            testCode_layerId: { testCode, layerId },
          },
          update: {
            name: `${cap.name} - ${scopeItem.name}`,
            description: `Scoped test for ${scopeItem.name} (${scopeItem.scopeType})`,
            activityId,
            scopeItemId,
            status: result === 'NOT_TESTED' ? 'NOT_TESTED' : 'COMPLETED',
            result: result === 'NOT_TESTED' ? null : result,
            lastTestedAt: result !== 'NOT_TESTED' ? executionDate : null,
            lastTesterId: result !== 'NOT_TESTED' ? user.id : null,
          },
          create: {
            testCode,
            layerId,
            activityId,
            scopeItemId,
            name: `${cap.name} - ${scopeItem.name}`,
            description: `Scoped test for ${scopeItem.name} (${scopeItem.scopeType})`,
            status: result === 'NOT_TESTED' ? 'NOT_TESTED' : 'COMPLETED',
            result: result === 'NOT_TESTED' ? null : result,
            lastTestedAt: result !== 'NOT_TESTED' ? executionDate : null,
            lastTesterId: result !== 'NOT_TESTED' ? user.id : null,
            findings: result === 'FAIL' ? `${scopeItem.name}: Significant gaps identified — manual processes without adequate controls.` : result === 'PARTIAL' ? `${scopeItem.name}: Some criteria met but improvements needed.` : null,
            recommendations: result === 'FAIL' ? `Prioritize remediation for ${scopeItem.name} within 30 days.` : result === 'PARTIAL' ? `Review and strengthen controls for ${scopeItem.name}.` : null,
            createdById: user.id,
          },
        });

        // Create execution record for tested items
        if (result !== 'NOT_TESTED') {
          await db.layerTestExecution.create({
            data: {
              testId: test.id,
              testerId: user.id,
              executionDate,
              result,
              findings: result === 'FAIL' ? `${scopeItem.name}: Gaps found.` : result === 'PARTIAL' ? `${scopeItem.name}: Minor issues.` : `${scopeItem.name}: All criteria met.`,
              recommendations: result !== 'PASS' ? `Remediation needed for ${scopeItem.name}.` : null,
              durationMinutes: 120,
              samplesReviewed: 5,
              periodStart: oneMonthAgo,
              periodEnd: executionDate,
            },
          });
          executionsCreated++;
        }

        testsCreated++;
      }
    }
    console.log(`   ✅ Scoped per-application tests created for A.5.15`);
  }

  // ------------------------------------------------------------------
  // 4. Create ControlMetrics (from Metrics sheet), linked to activities
  // ------------------------------------------------------------------
  for (const m of METRICS) {
    const activityId = activityIdMap[m.capabilityId];
    if (!activityId) continue;

    const sampleVal = SAMPLE_VALUES[m.metricId];
    const measuredDate = new Date(now);
    measuredDate.setDate(measuredDate.getDate() - Math.floor(Math.random() * 7));

    await db.controlMetric.upsert({
      where: {
        metricId_activityId: { metricId: m.metricId, activityId },
      },
      update: {
        name: m.name,
        description: m.description,
        unit: m.unit,
        greenThreshold: m.green,
        amberThreshold: m.amber,
        redThreshold: m.red,
        dataSource: m.dataSource,
        collectionFrequency: FREQUENCY_MAP[m.collectionFrequency] || 'MONTHLY',
        owner: m.owner,
        automationStatus: AUTOMATION_MAP[m.automated] || 'NOT_CONFIGURED',
        currentValue: sampleVal?.value || null,
        status: sampleVal?.status || 'NOT_MEASURED',
        trend: sampleVal?.trend || 'NEW',
        lastMeasured: sampleVal ? measuredDate : null,
      },
      create: {
        metricId: m.metricId,
        activityId,
        name: m.name,
        description: m.description,
        unit: m.unit,
        greenThreshold: m.green,
        amberThreshold: m.amber,
        redThreshold: m.red,
        dataSource: m.dataSource,
        collectionFrequency: FREQUENCY_MAP[m.collectionFrequency] || 'MONTHLY',
        owner: m.owner,
        automationStatus: AUTOMATION_MAP[m.automated] || 'NOT_CONFIGURED',
        currentValue: sampleVal?.value || null,
        status: sampleVal?.status || 'NOT_MEASURED',
        trend: sampleVal?.trend || 'NEW',
        lastMeasured: sampleVal ? measuredDate : null,
        createdById: user.id,
      },
    });

    // Create one history entry for metrics with values
    if (sampleVal) {
      await db.controlMetricHistory.create({
        data: {
          metricId: (await db.controlMetric.findFirst({ where: { metricId: m.metricId, activityId } }))!.id,
          value: sampleVal.value,
          status: sampleVal.status,
          measuredAt: measuredDate,
          measuredBy: user.id,
          notes: 'Initial measurement from control assurance demo',
        },
      });
    }

    metricsCreated++;
  }

  console.log(`   ✅ ${metricsCreated} metrics created`);

  // ------------------------------------------------------------------
  // 5. Recalculate activity and layer stats with weighted scoring
  // ------------------------------------------------------------------
  for (const cap of CAPABILITIES) {
    const activityId = activityIdMap[cap.capabilityId];
    if (!activityId) continue;

    const actTests = await db.layerTest.findMany({
      where: { activityId },
      include: {
        scopeItem: { select: { criticality: true } },
      },
    });

    let passed = 0;
    let total = 0;
    let weightedScore = 0;
    let totalWeight = 0;

    for (const t of actTests) {
      if (t.result === 'NOT_APPLICABLE' || t.result === null) continue;
      const weight = t.scopeItem ? (CRITICALITY_WEIGHT[t.scopeItem.criticality] ?? 1) : 1;
      totalWeight += weight;
      total++;
      if (t.result === 'PASS') {
        passed++;
        weightedScore += 1.0 * weight;
      } else if (t.result === 'PARTIAL') {
        weightedScore += 0.5 * weight;
      }
    }

    const protectionScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

    await db.controlActivity.update({
      where: { id: activityId },
      data: {
        testsPassed: Math.floor(passed),
        testsTotal: total,
        protectionScore,
      },
    });
  }

  // Recalculate layer stats with weighted scoring
  for (const control of controls) {
    for (const layer of control.layers) {
      const layerTests = await db.layerTest.findMany({
        where: { layerId: layer.id },
        include: {
          scopeItem: { select: { criticality: true } },
        },
      });

      let passed = 0;
      let total = 0;
      let weightedScore = 0;
      let totalWeight = 0;

      for (const t of layerTests) {
        if (t.result === 'NOT_APPLICABLE' || t.result === null) continue;
        const weight = t.scopeItem ? (CRITICALITY_WEIGHT[t.scopeItem.criticality] ?? 1) : 1;
        totalWeight += weight;
        total++;
        if (t.result === 'PASS') {
          passed++;
          weightedScore += 1.0 * weight;
        } else if (t.result === 'PARTIAL') {
          weightedScore += 0.5 * weight;
        }
      }

      const protectionScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
      const lastTested = layerTests
        .filter((t) => t.lastTestedAt)
        .sort((a, b) => b.lastTestedAt!.getTime() - a.lastTestedAt!.getTime())[0]?.lastTestedAt;

      await db.controlLayer.update({
        where: { id: layer.id },
        data: {
          testsPassed: Math.floor(passed),
          testsTotal: total,
          protectionScore,
          lastTestedAt: lastTested ?? null,
        },
      });
    }
  }

  console.log(`\n   🎯 Assurance demo complete: ${activitiesCreated} activities, ${testsCreated} tests, ${metricsCreated} metrics, ${executionsCreated} executions, ${scopeItemsCreated} scope items`);

  return { activitiesCreated, testsCreated, metricsCreated, executionsCreated, scopeItemsCreated };
}

if (require.main === module) {
  seedAssuranceDemo()
    .then((r) => {
      console.log('\n✅ Done:', r);
      process.exit(0);
    })
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
