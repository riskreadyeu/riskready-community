import { api } from './api';

// =============================================
// TYPES
// =============================================

export type DocumentType = 
  | 'POLICY' 
  | 'STANDARD' 
  | 'PROCEDURE' 
  | 'WORK_INSTRUCTION' 
  | 'FORM' 
  | 'TEMPLATE' 
  | 'CHECKLIST' 
  | 'GUIDELINE' 
  | 'RECORD';

export type DocumentStatus = 
  | 'DRAFT' 
  | 'PENDING_REVIEW' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'UNDER_REVISION' 
  | 'SUPERSEDED' 
  | 'RETIRED' 
  | 'ARCHIVED';

export type ClassificationLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export type ReviewFrequency = 
  | 'MONTHLY' 
  | 'QUARTERLY' 
  | 'SEMI_ANNUAL' 
  | 'ANNUAL' 
  | 'BIENNIAL' 
  | 'TRIENNIAL' 
  | 'ON_CHANGE' 
  | 'AS_NEEDED';

export type ApprovalLevel = 
  | 'BOARD' 
  | 'EXECUTIVE' 
  | 'SENIOR_MANAGEMENT' 
  | 'MANAGEMENT' 
  | 'TEAM_LEAD' 
  | 'PROCESS_OWNER';

export type ChangeType = 
  | 'INITIAL' 
  | 'MINOR_UPDATE' 
  | 'CLARIFICATION' 
  | 'ENHANCEMENT' 
  | 'CORRECTION' 
  | 'REGULATORY_UPDATE' 
  | 'MAJOR_REVISION' 
  | 'RESTRUCTURE';

export type ReviewOutcome = 
  | 'NO_CHANGES' 
  | 'MINOR_CHANGES' 
  | 'MAJOR_CHANGES' 
  | 'SUPERSEDE' 
  | 'RETIRE';

export type WorkflowStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CANCELLED' 
  | 'ESCALATED';

export type ApprovalStepStatus = 
  | 'PENDING' 
  | 'IN_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'SKIPPED' 
  | 'DELEGATED';

export type ApprovalDecision = 
  | 'APPROVE' 
  | 'APPROVE_WITH_CHANGES' 
  | 'REJECT' 
  | 'REQUEST_CHANGES' 
  | 'DELEGATE';

export type ExceptionStatus = 
  | 'REQUESTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'ACTIVE' 
  | 'EXPIRED' 
  | 'REVOKED' 
  | 'CLOSED';

export type ChangeRequestStatus = 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'IN_PROGRESS' 
  | 'IMPLEMENTED' 
  | 'VERIFIED' 
  | 'REJECTED' 
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface PolicyDocument {
  id: string;
  documentId: string;
  title: string;
  shortTitle?: string;
  documentType: DocumentType;
  classification: ClassificationLevel;
  distribution: string[];
  purpose: string;
  scope: string;
  content: string;
  summary?: string;
  definitions?: Record<string, string>;
  parentDocumentId?: string;
  parentDocument?: { id: string; documentId: string; title: string };
  childDocuments?: PolicyDocument[];
  version: string;
  majorVersion: number;
  minorVersion: number;
  status: DocumentStatus;
  effectiveDate?: string;
  expiryDate?: string;
  retirementDate?: string;
  documentOwner: string;
  documentOwnerId?: string;
  owner?: User;
  author: string;
  authorId?: string;
  authorUser?: User;
  approvalLevel: ApprovalLevel;
  approvedBy?: string;
  approverId?: string;
  approver?: User;
  approvalDate?: string;
  reviewFrequency: ReviewFrequency;
  lastReviewDate?: string;
  nextReviewDate?: string;
  tags: string[];
  keywords: string[];
  requiresAcknowledgment: boolean;
  acknowledgmentDeadline?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  updatedBy?: User;
  _count?: {
    childDocuments: number;
    versionHistory: number;
    reviewHistory: number;
    acknowledgments: number;
    controlMappings: number;
    riskMappings: number;
    exceptions: number;
    changeRequests: number;
  };
}

export interface DocumentVersion {
  id: string;
  version: string;
  majorVersion: number;
  minorVersion: number;
  content: string;
  changeDescription: string;
  changeSummary?: string;
  changeType: ChangeType;
  approvedBy?: string;
  approvalDate?: string;
  diffFromPrevious?: string;
  createdAt: string;
  createdBy?: User;
}

export interface DocumentReview {
  id: string;
  reviewType: string;
  reviewDate: string;
  reviewedBy?: User;
  outcome: ReviewOutcome;
  findings?: string;
  recommendations?: string;
  actionItems?: string;
  changesRequired: boolean;
  changeDescription?: string;
  nextReviewDate?: string;
  createdAt: string;
}

export interface ApprovalStep {
  id: string;
  stepOrder: number;
  stepName: string;
  approverId?: string;
  approver?: User;
  approverRole?: string;
  status: ApprovalStepStatus;
  decision?: ApprovalDecision;
  comments?: string;
  signature?: string;
  signedAt?: string;
  dueDate?: string;
  reminderSent: boolean;
  escalated: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  workflowType: string;
  status: WorkflowStatus;
  steps: ApprovalStep[];
  currentStepOrder: number;
  initiatedBy?: User;
  initiatedAt: string;
  completedAt?: string;
  finalOutcome?: string;
  comments?: string;
  document?: { id: string; documentId: string; title: string };
}

export interface ChangeRequest {
  id: string;
  changeRequestId: string;
  documentId: string;
  document?: { id: string; documentId: string; title: string; documentType: DocumentType };
  title: string;
  description: string;
  justification: string;
  changeType: ChangeType;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactAssessment?: string;
  affectedDocuments: string[];
  affectedProcesses: string[];
  affectedSystems: string[];
  status: ChangeRequestStatus;
  requestedBy?: User;
  requestedAt: string;
  approvedBy?: User;
  approvalDate?: string;
  approvalComments?: string;
  implementedBy?: User;
  implementedAt?: string;
  newVersionId?: string;
  targetDate?: string;
  actualCompletionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentException {
  id: string;
  exceptionId: string;
  documentId: string;
  document?: { id: string; documentId: string; title: string };
  title: string;
  description: string;
  justification: string;
  scope: string;
  affectedEntities: string[];
  riskAssessment: string;
  residualRisk: string;
  compensatingControls?: string;
  status: ExceptionStatus;
  requestedBy?: User;
  requestedAt: string;
  startDate?: string;
  expiryDate?: string;
  approvalLevel: ApprovalLevel;
  approvedBy?: User;
  approvalDate?: string;
  approvalComments?: string;
  reviewFrequency: ReviewFrequency;
  lastReviewDate?: string;
  nextReviewDate?: string;
  closedAt?: string;
  closureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAcknowledgment {
  id: string;
  documentId: string;
  document?: { id: string; documentId: string; title: string; documentType: DocumentType; summary?: string };
  documentVersion: string;
  userId: string;
  user?: User;
  acknowledgedAt?: string;
  isAcknowledged: boolean;
  method?: 'WEB_PORTAL' | 'EMAIL_LINK' | 'TRAINING_COMPLETION' | 'DIGITAL_SIGNATURE';
  dueDate?: string;
  remindersSent: number;
  lastReminderAt?: string;
  isOverdue: boolean;
  createdAt: string;
}

export interface ControlMapping {
  id: string;
  controlId: string;
  control?: { id: string; controlId: string; name: string; theme: string };
  mappingType: 'IMPLEMENTS' | 'SUPPORTS' | 'REFERENCES' | 'EVIDENCES';
  coverage: 'FULL' | 'PARTIAL' | 'MINIMAL' | 'NONE';
  notes?: string;
  evidenceRequired: boolean;
  evidenceDescription?: string;
  createdAt: string;
}

export interface RiskMapping {
  id: string;
  riskId: string;
  risk?: { id: string; riskId: string; title: string; status: string };
  relationshipType: 'MITIGATES' | 'ADDRESSES' | 'CREATES' | 'MONITORS';
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  documents: {
    total: number;
    published: number;
    byType: Record<DocumentType, number>;
    byStatus: Record<DocumentStatus, number>;
  };
  reviews: {
    overdue: number;
    dueSoon: number;
    upcoming: number;
  };
  approvals: {
    pending: number;
    inProgress: number;
    completedThisMonth: number;
  };
  acknowledgments: {
    total: number;
    acknowledged: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  exceptions: {
    active: number;
    expiring: number;
    pending: number;
  };
  changeRequests: {
    pending: number;
    inProgress: number;
    completedThisMonth: number;
  };
}

export interface ComplianceStatus {
  controlCoverage: {
    total: number;
    covered: number;
    fullyCovered: number;
    percentage: number;
  };
  mandatoryDocuments: {
    total: number;
    completed: number;
    percentage: number;
  };
  overallScore: number;
}

// =============================================
// API FUNCTIONS
// =============================================

// Resolve the current organisation ID from the logged-in user's stored session
function ORG_ID(): string {
  try {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user.organisationId) return user.organisationId;
    }
  } catch { /* ignore */ }
  return '';
}

// Policy Documents
export async function getPolicies(params?: {
  skip?: number;
  take?: number;
  documentType?: DocumentType;
  status?: DocumentStatus;
  search?: string;
  parentDocumentId?: string;
}) {
  const queryParams = new URLSearchParams();
  queryParams.set('organisationId', ORG_ID());
  if (params?.skip) queryParams.set('skip', params.skip.toString());
  if (params?.take) queryParams.set('take', params.take.toString());
  if (params?.documentType) queryParams.set('documentType', params.documentType);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.parentDocumentId) queryParams.set('parentDocumentId', params.parentDocumentId);
  
  return api.get<{ results: PolicyDocument[]; count: number }>(`/policies?${queryParams}`);
}

export async function getPolicy(id: string) {
  return api.get<PolicyDocument>(`/policies/${id}`);
}

export async function createPolicy(data: Partial<PolicyDocument>) {
  return api.post<PolicyDocument>('/policies', {
    ...data,
    organisationId: ORG_ID(),
  });
}

export async function updatePolicy(id: string, data: Partial<PolicyDocument>) {
  return api.put<PolicyDocument>(`/policies/${id}`, data);
}

export async function updatePolicyStatus(id: string, status: DocumentStatus, userId?: string) {
  return api.put<PolicyDocument>(`/policies/${id}/status`, { status, userId });
}

export async function deletePolicy(id: string, hard = false) {
  return api.delete(`/policies/${id}?hard=${hard}`);
}

export async function getPolicyStats() {
  return api.get<any>(`/policies/stats?organisationId=${ORG_ID()}`);
}

export async function getPolicyHierarchy() {
  return api.get<PolicyDocument[]>(`/policies/hierarchy?organisationId=${ORG_ID()}`);
}

export async function generateDocumentId(documentType: DocumentType, parentDocumentId?: string) {
  const params = new URLSearchParams();
  params.set('organisationId', ORG_ID());
  params.set('documentType', documentType);
  if (parentDocumentId) params.set('parentDocumentId', parentDocumentId);
  return api.get<{ documentId: string }>(`/policies/generate-id?${params}`);
}

export async function searchPolicies(params: {
  query?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  tags?: string[];
  controlId?: string;
  riskId?: string;
  skip?: number;
  take?: number;
}) {
  const queryParams = new URLSearchParams();
  queryParams.set('organisationId', ORG_ID());
  if (params.query) queryParams.set('query', params.query);
  if (params.documentType) queryParams.set('documentType', params.documentType);
  if (params.status) queryParams.set('status', params.status);
  if (params.tags?.length) queryParams.set('tags', params.tags.join(','));
  if (params.controlId) queryParams.set('controlId', params.controlId);
  if (params.riskId) queryParams.set('riskId', params.riskId);
  if (params.skip) queryParams.set('skip', params.skip.toString());
  if (params.take) queryParams.set('take', params.take.toString());
  
  return api.get<{ results: PolicyDocument[]; count: number }>(`/policies/search?${queryParams}`);
}

// Versions
export async function getVersions(documentId: string) {
  return api.get<DocumentVersion[]>(`/policies/${documentId}/versions`);
}

export async function createVersion(documentId: string, data: {
  changeDescription: string;
  changeSummary?: string;
  changeType: ChangeType;
  isMajor?: boolean;
  userId?: string;
}) {
  return api.post<DocumentVersion>(`/policies/${documentId}/versions`, data);
}

export async function compareVersions(documentId: string, v1: string, v2: string) {
  return api.get<any>(`/policies/${documentId}/versions/compare?v1=${v1}&v2=${v2}`);
}

export async function rollbackVersion(documentId: string, targetVersion: string, userId?: string) {
  return api.post<PolicyDocument>(`/policies/${documentId}/versions/rollback`, { targetVersion, userId });
}

// Reviews
export async function getReviews(documentId: string) {
  return api.get<DocumentReview[]>(`/policies/${documentId}/reviews`);
}

export async function createReview(documentId: string, data: {
  reviewType: string;
  outcome: ReviewOutcome;
  findings?: string;
  recommendations?: string;
  actionItems?: string;
  changesRequired?: boolean;
  changeDescription?: string;
  reviewedById: string;
}) {
  return api.post<DocumentReview>(`/policies/${documentId}/reviews`, data);
}

export async function getUpcomingReviews(days = 30) {
  return api.get<PolicyDocument[]>(`/policies/reviews/upcoming?organisationId=${ORG_ID()}&days=${days}`);
}

export async function getOverdueReviews() {
  return api.get<PolicyDocument[]>(`/policies/reviews/overdue?organisationId=${ORG_ID()}`);
}

export async function getReviewStats() {
  return api.get<any>(`/policies/reviews/stats?organisationId=${ORG_ID()}`);
}

// Approval Workflows
export async function getWorkflows(documentId: string) {
  return api.get<ApprovalWorkflow[]>(`/policies/${documentId}/workflows`);
}

export async function getCurrentWorkflow(documentId: string) {
  return api.get<ApprovalWorkflow | null>(`/policies/${documentId}/workflow/current`);
}

export async function createWorkflow(documentId: string, data: {
  workflowType: string;
  steps: Array<{
    stepOrder: number;
    stepName: string;
    approverId?: string;
    approverRole?: string;
    dueDate?: string;
  }>;
  initiatedById: string;
  comments?: string;
}) {
  return api.post<ApprovalWorkflow>(`/policies/${documentId}/workflows`, data);
}

export async function processApprovalStep(stepId: string, data: {
  decision: ApprovalDecision;
  comments?: string;
  signature?: string;
  userId: string;
}) {
  return api.post<ApprovalWorkflow>(`/policies/workflows/steps/${stepId}/process`, data);
}

export async function getPendingApprovals(userId: string) {
  return api.get<ApprovalStep[]>(`/policies/approvals/pending?userId=${userId}`);
}

export async function getDefaultWorkflowSteps(approvalLevel: ApprovalLevel) {
  return api.get<any[]>(`/policies/workflows/default-steps?approvalLevel=${approvalLevel}`);
}

// Approval Matrix - Document Type Based Workflows
export interface ApprovalMatrixEntry {
  approvers: string[];
  workflow: string;
}

export interface CommitteeMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface DefaultWorkflowConfig {
  steps: Array<{
    stepOrder: number;
    stepName: string;
    approverId?: string;
    approverRole?: string;
  }>;
  mandatory: boolean;
  description: string;
  committeeMembers?: CommitteeMember[];
}

export async function getApprovalMatrix() {
  return api.get<Record<DocumentType, ApprovalMatrixEntry>>(`/policies/workflows/approval-matrix`);
}

export async function getDefaultWorkflowByDocumentType(
  documentType: DocumentType,
  controlOwnerId?: string
) {
  const params = new URLSearchParams();
  params.set('documentType', documentType);
  if (controlOwnerId) params.set('controlOwnerId', controlOwnerId);
  return api.get<DefaultWorkflowConfig>(`/policies/workflows/default-by-type?${params}`);
}

export async function validateDocumentApprovers(documentId: string) {
  return api.get<{
    valid: boolean;
    documentType: string;
    message: string;
    requiredApprovers?: string[];
  }>(`/policies/${documentId}/workflow/validate`);
}

// Change Requests
export async function getChangeRequests(params?: {
  skip?: number;
  take?: number;
  documentId?: string;
  status?: ChangeRequestStatus;
}) {
  const queryParams = new URLSearchParams();
  queryParams.set('organisationId', ORG_ID());
  if (params?.skip) queryParams.set('skip', params.skip.toString());
  if (params?.take) queryParams.set('take', params.take.toString());
  if (params?.documentId) queryParams.set('documentId', params.documentId);
  if (params?.status) queryParams.set('status', params.status);
  
  return api.get<{ results: ChangeRequest[]; count: number }>(`/change-requests?${queryParams}`);
}

export async function getChangeRequest(id: string) {
  return api.get<ChangeRequest>(`/change-requests/${id}`);
}

export async function createChangeRequest(data: Omit<ChangeRequest, 'id' | 'changeRequestId' | 'status' | 'createdAt' | 'updatedAt'>) {
  return api.post<ChangeRequest>('/change-requests', {
    ...data,
    organisationId: ORG_ID(),
  });
}

export async function approveChangeRequest(id: string, data: { approvedById: string; approvalComments?: string }) {
  return api.post<ChangeRequest>(`/change-requests/${id}/approve`, data);
}

export async function rejectChangeRequest(id: string, data: { approvedById: string; approvalComments: string }) {
  return api.post<ChangeRequest>(`/change-requests/${id}/reject`, data);
}

export async function getChangeRequestStats() {
  return api.get<any>(`/change-requests/stats?organisationId=${ORG_ID()}`);
}

// Exceptions
export async function getExceptions(params?: {
  skip?: number;
  take?: number;
  documentId?: string;
  status?: ExceptionStatus;
}) {
  const queryParams = new URLSearchParams();
  queryParams.set('organisationId', ORG_ID());
  if (params?.skip) queryParams.set('skip', params.skip.toString());
  if (params?.take) queryParams.set('take', params.take.toString());
  if (params?.documentId) queryParams.set('documentId', params.documentId);
  if (params?.status) queryParams.set('status', params.status);
  
  return api.get<{ results: DocumentException[]; count: number }>(`/exceptions?${queryParams}`);
}

export async function getException(id: string) {
  return api.get<DocumentException>(`/exceptions/${id}`);
}

export async function createException(data: Omit<DocumentException, 'id' | 'exceptionId' | 'status' | 'createdAt' | 'updatedAt'>) {
  return api.post<DocumentException>('/exceptions', {
    ...data,
    organisationId: ORG_ID(),
  });
}

export async function approveException(id: string, data: { approvedById: string; approvalComments?: string }) {
  return api.post<DocumentException>(`/exceptions/${id}/approve`, data);
}

export async function getExpiringExceptions(days = 30) {
  return api.get<DocumentException[]>(`/exceptions/expiring?organisationId=${ORG_ID()}&days=${days}`);
}

export async function getExceptionStats() {
  return api.get<any>(`/exceptions/stats?organisationId=${ORG_ID()}`);
}

// Acknowledgments
export async function getAcknowledgments(params?: {
  skip?: number;
  take?: number;
  documentId?: string;
  userId?: string;
  isAcknowledged?: boolean;
}) {
  const queryParams = new URLSearchParams();
  if (params?.skip) queryParams.set('skip', params.skip.toString());
  if (params?.take) queryParams.set('take', params.take.toString());
  if (params?.documentId) queryParams.set('documentId', params.documentId);
  if (params?.userId) queryParams.set('userId', params.userId);
  if (params?.isAcknowledged !== undefined) queryParams.set('isAcknowledged', params.isAcknowledged.toString());
  
  return api.get<{ results: DocumentAcknowledgment[]; count: number }>(`/acknowledgments?${queryParams}`);
}

export async function getPendingAcknowledgments(userId: string) {
  return api.get<DocumentAcknowledgment[]>(`/acknowledgments/pending?userId=${userId}`);
}

export async function getOverdueAcknowledgments() {
  return api.get<DocumentAcknowledgment[]>(`/acknowledgments/overdue?organisationId=${ORG_ID()}`);
}

export async function acknowledgeDocument(id: string, data: {
  method: 'WEB_PORTAL' | 'EMAIL_LINK' | 'TRAINING_COMPLETION' | 'DIGITAL_SIGNATURE';
  ipAddress?: string;
  userAgent?: string;
}) {
  return api.post<DocumentAcknowledgment>(`/acknowledgments/${id}/acknowledge`, data);
}

export async function requestAcknowledgments(documentId: string, userIds: string[], dueDate?: string) {
  return api.post<DocumentAcknowledgment[]>('/acknowledgments/request', {
    documentId,
    userIds,
    dueDate,
  });
}

export async function getAcknowledgmentStats() {
  return api.get<any>(`/acknowledgments/stats?organisationId=${ORG_ID()}`);
}

// Mappings
export async function getControlMappings(documentId: string) {
  return api.get<ControlMapping[]>(`/policies/${documentId}/controls`);
}

export async function addControlMapping(documentId: string, data: {
  controlId: string;
  mappingType?: string;
  coverage?: string;
  notes?: string;
  evidenceRequired?: boolean;
  evidenceDescription?: string;
  createdById?: string;
}) {
  return api.post<ControlMapping>(`/policies/${documentId}/controls`, data);
}

export async function removeControlMapping(id: string) {
  return api.delete(`/policies/control-mappings/${id}`);
}

export async function getRiskMappings(documentId: string) {
  return api.get<RiskMapping[]>(`/policies/${documentId}/risks`);
}

export async function addRiskMapping(documentId: string, data: {
  riskId: string;
  relationshipType?: string;
  notes?: string;
  createdById?: string;
}) {
  return api.post<RiskMapping>(`/policies/${documentId}/risks`, data);
}

export async function removeRiskMapping(id: string) {
  return api.delete(`/policies/risk-mappings/${id}`);
}

export async function getControlCoverageReport() {
  return api.get<any>(`/policies/reports/control-coverage?organisationId=${ORG_ID()}`);
}

export async function getGapAnalysis() {
  return api.get<any[]>(`/policies/reports/gap-analysis?organisationId=${ORG_ID()}`);
}

// Document Relations
export type DocumentRelationType =
  | 'PARENT_OF'
  | 'CHILD_OF'
  | 'REFERENCES'
  | 'REFERENCED_BY'
  | 'SUPERSEDES'
  | 'SUPERSEDED_BY'
  | 'CONFLICTS_WITH'
  | 'COMPLEMENTS'
  | 'DEPENDS_ON';

export interface DocumentRelation {
  id: string;
  sourceDocumentId: string;
  sourceDocument?: { id: string; documentId: string; title: string; documentType: DocumentType; status: DocumentStatus };
  targetDocumentId: string;
  targetDocument?: { id: string; documentId: string; title: string; documentType: DocumentType; status: DocumentStatus };
  relationType: DocumentRelationType;
  description?: string;
  createdAt: string;
  createdBy?: User;
}

export interface DocumentRelations {
  outgoing: DocumentRelation[];
  incoming: DocumentRelation[];
}

export async function getDocumentRelations(documentId: string) {
  return api.get<DocumentRelations>(`/policies/${documentId}/relations`);
}

export async function addDocumentRelation(documentId: string, data: {
  targetDocumentId: string;
  relationType: DocumentRelationType;
  description?: string;
  createdById?: string;
}) {
  return api.post<DocumentRelation>(`/policies/${documentId}/relations`, data);
}

export async function removeDocumentRelation(id: string) {
  return api.delete(`/policies/relations/${id}`);
}

export async function updateRiskMapping(id: string, data: {
  relationshipType?: string;
  notes?: string;
}) {
  return api.put<RiskMapping>(`/policies/risk-mappings/${id}`, data);
}

export async function updateControlMapping(id: string, data: {
  mappingType?: string;
  coverage?: string;
  notes?: string;
  evidenceRequired?: boolean;
  evidenceDescription?: string;
}) {
  return api.put<ControlMapping>(`/policies/control-mappings/${id}`, data);
}

// =============================================
// STRUCTURED SECTIONS
// =============================================

export type DocumentSectionType =
  | 'HEADER'
  | 'MANAGEMENT_COMMITMENT'
  | 'PURPOSE'
  | 'SCOPE'
  | 'DEFINITIONS'
  | 'ISO_CONTROLS'
  | 'RELATED_DOCUMENTS'
  | 'ROLES_RESPONSIBILITIES'
  | 'POLICY_STATEMENTS'
  | 'REQUIREMENTS'
  | 'PROCESS_STEPS'
  | 'PREREQUISITES'
  | 'WORKFLOW'
  | 'COMPLIANCE'
  | 'EXCEPTIONS'
  | 'REVISION_HISTORY'
  | 'APPENDIX'
  | 'CUSTOM';

export interface DocumentSection {
  id: string;
  documentId: string;
  sectionType: DocumentSectionType;
  templateId?: string;
  template?: { id: string; name: string; sectionType: DocumentSectionType; defaultTitle?: string };
  title: string;
  order: number;
  content?: string;
  structuredData?: Record<string, unknown>;
  isVisible: boolean;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

export interface DocumentDefinition {
  id: string;
  documentId: string;
  term: string;
  definition: string;
  source?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentProcessStep {
  id: string;
  documentId: string;
  stepNumber: string;
  title: string;
  description: string;
  responsible?: string;
  accountable?: string;
  consulted: string[];
  informed: string[];
  estimatedDuration?: string;
  inputs: string[];
  outputs: string[];
  isDecisionPoint: boolean;
  decisionOptions?: Record<string, unknown>;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentPrerequisite {
  id: string;
  documentId: string;
  category?: string;
  item: string;
  isMandatory: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRole {
  id: string;
  documentId: string;
  role: string;
  responsibilities: string[];
  raciMatrix?: Record<string, string>;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRevision {
  id: string;
  documentId: string;
  version: string;
  date: string;
  author: string;
  approvedBy?: string;
  description: string;
  order: number;
  createdAt: string;
}

export interface DocumentSectionTemplate {
  id: string;
  name: string;
  sectionType: DocumentSectionType;
  applicableTypes: DocumentType[];
  isRequired: boolean;
  defaultOrder: number;
  defaultTitle?: string;
  defaultContent?: string;
  schema?: Record<string, unknown>;
  description?: string;
  helpText?: string;
  organisationId?: string;
  isSystemTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStructure {
  sections: DocumentSection[];
  definitions: DocumentDefinition[];
  processSteps: DocumentProcessStep[];
  prerequisites: DocumentPrerequisite[];
  roles: DocumentRole[];
  revisions: DocumentRevision[];
}

// Sections
export async function getSections(documentId: string) {
  return api.get<DocumentSection[]>(`/policies/${documentId}/sections`);
}

export async function getSection(id: string) {
  return api.get<DocumentSection>(`/policies/sections/${id}`);
}

export async function createSection(documentId: string, data: {
  sectionType: DocumentSectionType;
  title: string;
  order?: number;
  content?: string;
  structuredData?: Record<string, unknown>;
  templateId?: string;
  isVisible?: boolean;
  isCollapsed?: boolean;
  createdById?: string;
}) {
  return api.post<DocumentSection>(`/policies/${documentId}/sections`, data);
}

export async function updateSection(id: string, data: {
  title?: string;
  order?: number;
  content?: string;
  structuredData?: Record<string, unknown>;
  isVisible?: boolean;
  isCollapsed?: boolean;
}) {
  return api.put<DocumentSection>(`/policies/sections/${id}`, data);
}

export async function deleteSection(id: string) {
  return api.delete(`/policies/sections/${id}`);
}

export async function reorderSections(documentId: string, sectionOrders: Array<{ id: string; order: number }>) {
  return api.put(`/policies/${documentId}/sections/reorder`, { sectionOrders });
}

// Definitions
export async function getDefinitions(documentId: string) {
  return api.get<DocumentDefinition[]>(`/policies/${documentId}/definitions`);
}

export async function createDefinition(documentId: string, data: {
  term: string;
  definition: string;
  source?: string;
  order?: number;
}) {
  return api.post<DocumentDefinition>(`/policies/${documentId}/definitions`, data);
}

export async function updateDefinition(id: string, data: {
  term?: string;
  definition?: string;
  source?: string;
  order?: number;
}) {
  return api.put<DocumentDefinition>(`/policies/definitions/${id}`, data);
}

export async function deleteDefinition(id: string) {
  return api.delete(`/policies/definitions/${id}`);
}

export async function bulkCreateDefinitions(documentId: string, definitions: Array<{
  term: string;
  definition: string;
  source?: string;
  order?: number;
}>) {
  return api.post(`/policies/${documentId}/definitions/bulk`, { definitions });
}

// Process Steps
export async function getProcessSteps(documentId: string) {
  return api.get<DocumentProcessStep[]>(`/policies/${documentId}/process-steps`);
}

export async function createProcessStep(documentId: string, data: {
  stepNumber: string;
  title: string;
  description: string;
  order?: number;
  responsible?: string;
  accountable?: string;
  consulted?: string[];
  informed?: string[];
  estimatedDuration?: string;
  inputs?: string[];
  outputs?: string[];
  isDecisionPoint?: boolean;
  decisionOptions?: Record<string, unknown>;
}) {
  return api.post<DocumentProcessStep>(`/policies/${documentId}/process-steps`, data);
}

export async function updateProcessStep(id: string, data: {
  stepNumber?: string;
  title?: string;
  description?: string;
  order?: number;
  responsible?: string;
  accountable?: string;
  consulted?: string[];
  informed?: string[];
  estimatedDuration?: string;
  inputs?: string[];
  outputs?: string[];
  isDecisionPoint?: boolean;
  decisionOptions?: Record<string, unknown>;
}) {
  return api.put<DocumentProcessStep>(`/policies/process-steps/${id}`, data);
}

export async function deleteProcessStep(id: string) {
  return api.delete(`/policies/process-steps/${id}`);
}

// Prerequisites
export async function getPrerequisites(documentId: string) {
  return api.get<DocumentPrerequisite[]>(`/policies/${documentId}/prerequisites`);
}

export async function createPrerequisite(documentId: string, data: {
  item: string;
  category?: string;
  isMandatory?: boolean;
  order?: number;
}) {
  return api.post<DocumentPrerequisite>(`/policies/${documentId}/prerequisites`, data);
}

export async function updatePrerequisite(id: string, data: {
  item?: string;
  category?: string;
  isMandatory?: boolean;
  order?: number;
}) {
  return api.put<DocumentPrerequisite>(`/policies/prerequisites/${id}`, data);
}

export async function deletePrerequisite(id: string) {
  return api.delete(`/policies/prerequisites/${id}`);
}

// Roles
export async function getDocumentRoles(documentId: string) {
  return api.get<DocumentRole[]>(`/policies/${documentId}/roles`);
}

export async function createDocumentRole(documentId: string, data: {
  role: string;
  responsibilities?: string[];
  raciMatrix?: Record<string, string>;
  order?: number;
}) {
  return api.post<DocumentRole>(`/policies/${documentId}/roles`, data);
}

export async function updateDocumentRole(id: string, data: {
  role?: string;
  responsibilities?: string[];
  raciMatrix?: Record<string, string>;
  order?: number;
}) {
  return api.put<DocumentRole>(`/policies/roles/${id}`, data);
}

export async function deleteDocumentRole(id: string) {
  return api.delete(`/policies/roles/${id}`);
}

// Revisions
export async function getDocumentRevisions(documentId: string) {
  return api.get<DocumentRevision[]>(`/policies/${documentId}/revisions`);
}

export async function createDocumentRevision(documentId: string, data: {
  version: string;
  date: string;
  author: string;
  description: string;
  approvedBy?: string;
  order?: number;
}) {
  return api.post<DocumentRevision>(`/policies/${documentId}/revisions`, data);
}

export async function updateDocumentRevision(id: string, data: {
  version?: string;
  date?: string;
  author?: string;
  description?: string;
  approvedBy?: string;
  order?: number;
}) {
  return api.put<DocumentRevision>(`/policies/revisions/${id}`, data);
}

export async function deleteDocumentRevision(id: string) {
  return api.delete(`/policies/revisions/${id}`);
}

// Section Templates
export async function getSectionTemplates(organisationId?: string) {
  const params = organisationId ? `?organisationId=${organisationId}` : '';
  return api.get<DocumentSectionTemplate[]>(`/policies/section-templates${params}`);
}

export async function createSectionTemplate(data: {
  name: string;
  sectionType: DocumentSectionType;
  applicableTypes?: DocumentType[];
  isRequired?: boolean;
  defaultOrder?: number;
  defaultTitle?: string;
  defaultContent?: string;
  schema?: Record<string, unknown>;
  description?: string;
  helpText?: string;
  organisationId?: string;
}) {
  return api.post<DocumentSectionTemplate>('/policies/section-templates', data);
}

export async function updateSectionTemplate(id: string, data: {
  name?: string;
  applicableTypes?: DocumentType[];
  isRequired?: boolean;
  defaultOrder?: number;
  defaultTitle?: string;
  defaultContent?: string;
  schema?: Record<string, unknown>;
  description?: string;
  helpText?: string;
}) {
  return api.put<DocumentSectionTemplate>(`/policies/section-templates/${id}`, data);
}

export async function deleteSectionTemplate(id: string) {
  return api.delete(`/policies/section-templates/${id}`);
}

// Document Structure
export async function getDocumentStructure(documentId: string) {
  return api.get<DocumentStructure>(`/policies/${documentId}/structure`);
}

export async function cloneDocumentStructure(targetDocumentId: string, sourceDocumentId: string, createdById?: string) {
  return api.post(`/policies/${targetDocumentId}/structure/clone`, { sourceDocumentId, createdById });
}

export async function deleteDocumentStructure(documentId: string) {
  return api.delete(`/policies/${documentId}/structure`);
}

// =============================================
// ATTACHMENTS
// =============================================

export type AttachmentType = 'APPENDIX' | 'FORM' | 'TEMPLATE' | 'DIAGRAM' | 'REFERENCE' | 'EVIDENCE' | 'SIGNATURE';

export interface DocumentAttachment {
  id: string;
  documentId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  attachmentType: AttachmentType;
  description?: string;
  storagePath: string;
  checksum: string;
  isEncrypted: boolean;
  uploadedAt: string;
  uploadedBy?: User;
}

export interface AttachmentStats {
  count: number;
  totalSize: number;
  totalSizeMB: number;
  byType: Partial<Record<AttachmentType, number>>;
  byMimeType: Record<string, number>;
}

export async function getAttachments(documentId: string) {
  return api.get<DocumentAttachment[]>(`/policies/${documentId}/attachments`);
}

export async function getAttachment(id: string) {
  return api.get<DocumentAttachment>(`/policies/attachments/${id}`);
}

export async function getAttachmentsByType(documentId: string, attachmentType: AttachmentType) {
  return api.get<DocumentAttachment[]>(`/policies/${documentId}/attachments/by-type/${attachmentType}`);
}

export async function uploadAttachment(documentId: string, file: File, data: {
  attachmentType: AttachmentType;
  description?: string;
  uploadedById?: string;
}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('attachmentType', data.attachmentType);
  if (data.description) formData.append('description', data.description);
  if (data.uploadedById) formData.append('uploadedById', data.uploadedById);

  return api.postForm<DocumentAttachment>(`/policies/${documentId}/attachments`, formData);
}

export async function createAttachmentMetadata(documentId: string, data: {
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  attachmentType: AttachmentType;
  description?: string;
  storagePath: string;
  checksum: string;
  isEncrypted?: boolean;
  uploadedById?: string;
}) {
  return api.post<DocumentAttachment>(`/policies/${documentId}/attachments/metadata`, data);
}

export async function updateAttachment(id: string, data: {
  filename?: string;
  attachmentType?: AttachmentType;
  description?: string;
}) {
  return api.put<DocumentAttachment>(`/policies/attachments/${id}`, data);
}

export async function deleteAttachment(id: string) {
  return api.delete(`/policies/attachments/${id}`);
}

export async function downloadAttachment(id: string): Promise<Blob> {
  const response = await fetch(`${api.baseUrl}/policies/attachments/${id}/download`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Download failed');
  }
  return response.blob();
}

export async function verifyAttachment(id: string) {
  return api.get<{ valid: boolean; attachmentId: string; storedChecksum?: string; error?: string }>(
    `/policies/attachments/${id}/verify`
  );
}

export async function getAttachmentStats(documentId: string) {
  return api.get<AttachmentStats>(`/policies/${documentId}/attachments/stats`);
}

export async function getDocumentStorageSize(documentId: string) {
  return api.get<{ documentId: string; sizeBytes: number; sizeMB: number }>(
    `/policies/${documentId}/attachments/storage-size`
  );
}

export async function checkAttachmentDuplicate(documentId: string, checksum: string) {
  return api.post<{ isDuplicate: boolean; existingAttachment?: DocumentAttachment }>(
    `/policies/${documentId}/attachments/check-duplicate`,
    { checksum }
  );
}

// Dashboard
export async function getDashboardStats() {
  return api.get<DashboardStats>(`/policies/dashboard/stats?organisationId=${ORG_ID()}`);
}

export async function getComplianceStatus() {
  return api.get<ComplianceStatus>(`/policies/dashboard/compliance?organisationId=${ORG_ID()}`);
}

export interface OverdueReview {
  id: string;
  documentId: string;
  title: string;
}

export interface PendingApproval {
  id: string;
  stepName: string;
  workflow?: {
    document?: {
      id: string;
      documentId: string;
    };
  };
}

export interface ExpiringException {
  id: string;
  exceptionId: string;
  title: string;
}

export interface ActionsNeeded {
  overdueReviews: OverdueReview[];
  pendingApprovals: PendingApproval[];
  expiringExceptions: ExpiringException[];
}

export interface RecentActivityItem {
  id: string;
  action: string;
  description: string;
  performedBy?: {
    firstName?: string;
    lastName?: string;
  };
  performedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  description?: string;
  performedBy?: {
    firstName?: string;
    lastName?: string;
  };
  performedAt: string;
  [key: string]: unknown;
}

export async function getActionsNeeded() {
  return api.get<ActionsNeeded>(`/policies/dashboard/actions-needed?organisationId=${ORG_ID()}`);
}

export async function getRecentActivity(limit = 10) {
  return api.get<RecentActivityItem[]>(`/policies/dashboard/recent-activity?organisationId=${ORG_ID()}&limit=${limit}`);
}

export async function getAuditLog(params?: {
  documentId?: string;
  skip?: number;
  take?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}) {
  const queryParams = new URLSearchParams();
  queryParams.set('organisationId', ORG_ID());
  if (params?.documentId) queryParams.set('documentId', params.documentId);
  if (params?.skip) queryParams.set('skip', params.skip.toString());
  if (params?.take) queryParams.set('take', params.take.toString());
  if (params?.action) queryParams.set('action', params.action);
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.userId) queryParams.set('userId', params.userId);

  return api.get<{ results: AuditLogEntry[]; count: number }>(`/policies/dashboard/audit-log?${queryParams}`);
}
