// Audits Module API Service

import { fetchWithAuth } from './fetch-with-auth';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(path, init);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }

  const text = await res.text();
  if (!text) {
    throw new Error('Empty response from server');
  }
  
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

// ============================================
// Types
// ============================================

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

export interface UserBasic {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export type NonconformitySource = 
  | 'TEST'
  | 'INTERNAL_AUDIT'
  | 'EXTERNAL_AUDIT'
  | 'CERTIFICATION_AUDIT'
  | 'INCIDENT'
  | 'SELF_ASSESSMENT'
  | 'MANAGEMENT_REVIEW'
  | 'SURVEILLANCE_AUDIT';

export type NCSeverity = 'MAJOR' | 'MINOR' | 'OBSERVATION';
export type NCCategory = 
  | 'CONTROL_FAILURE'
  | 'DOCUMENTATION'
  | 'PROCESS'
  | 'TECHNICAL'
  | 'ORGANIZATIONAL'
  | 'TRAINING'
  | 'RESOURCE';

export type NCStatus =
  | 'DRAFT'                  // Auto-created, pending manual review
  | 'OPEN'                   // Reviewed and confirmed
  | 'IN_PROGRESS'
  | 'AWAITING_VERIFICATION'
  | 'VERIFIED_EFFECTIVE'
  | 'VERIFIED_INEFFECTIVE'
  | 'CLOSED'
  | 'REJECTED';

export type CAPStatus =
  | 'NOT_REQUIRED'           // Observation - no formal CAP needed
  | 'NOT_DEFINED'            // NC opened but CAP not yet defined
  | 'DRAFT'                  // CAP being written, can be edited freely
  | 'PENDING_APPROVAL'       // CAP submitted, awaiting manager review
  | 'APPROVED'               // CAP approved, work can begin
  | 'REJECTED';              // CAP rejected, needs revision

export interface ControlBasic {
  id: string;
  controlId: string;
  name: string;
}

export interface CapabilityBasic {
  id: string;
  capabilityId: string;
  name: string;
  control?: ControlBasic;
}

export interface TestBasic {
  id: string;
  testType: string;
  testResult: string;
}

export interface RiskBasic {
  id: string;
  riskId: string;
  title: string;
  status: string;
  likelihood?: string;
  impact?: string;
}

export interface Nonconformity {
  id: string;
  ncId: string;
  dateRaised: string;
  source: NonconformitySource;
  sourceReferenceId?: string;
  isoClause?: string;
  severity: NCSeverity;
  category: NCCategory;
  title: string;
  description: string;
  findings?: string;
  rootCause?: string;
  impact?: string;
  controlId?: string;
  control?: ControlBasic;
  capabilityId?: string;
  capability?: CapabilityBasic;
  testId?: string;
  test?: TestBasic;
  risks?: RiskBasic[];
  correctiveAction?: string;
  responsibleUserId?: string;
  responsibleUser?: UserBasic;
  targetClosureDate?: string;
  status: NCStatus;
  
  // CAP Workflow Fields
  capStatus: CAPStatus;
  capDraftedAt?: string;
  capDraftedById?: string;
  capDraftedBy?: UserBasic;
  capSubmittedAt?: string;
  capApprovedAt?: string;
  capApprovedById?: string;
  capApprovedBy?: UserBasic;
  capApprovalComments?: string;
  capRejectedAt?: string;
  capRejectedById?: string;
  capRejectedBy?: UserBasic;
  capRejectionReason?: string;
  
  // Verification
  verificationMethod?: string;
  verificationDate?: string;
  verifiedById?: string;
  verifiedBy?: UserBasic;
  verificationResult?: string;
  verificationNotes?: string;
  
  // Audit Trail
  raisedById: string;
  raisedBy: UserBasic;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedById?: string;
  closedBy?: UserBasic;
}

export interface NonconformityStats {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  byCapStatus: Record<string, number>;
  overdue: number;
  pendingReview: number; // DRAFT status NCs needing manual review
  pendingCapApproval: number; // CAPs awaiting approval
}

export interface CreateNonconformityInput {
  source: NonconformitySource;
  severity: NCSeverity;
  category: NCCategory;
  title: string;
  description: string;
  findings?: string;
  rootCause?: string;
  impact?: string;
  isoClause?: string;
  sourceReferenceId?: string;
  controlId?: string;
  capabilityId?: string;
  testId?: string;
  correctiveAction?: string;
  responsibleUserId?: string;
  targetClosureDate?: string;
  raisedById: string;
}

export interface UpdateNonconformityInput {
  title?: string;
  description?: string;
  findings?: string;
  rootCause?: string;
  impact?: string;
  severity?: NCSeverity;
  category?: NCCategory;
  status?: NCStatus;
  correctiveAction?: string;
  responsibleUserId?: string;
  targetClosureDate?: string;
  verificationMethod?: string;
  verificationDate?: string;
  verifiedById?: string;
  verificationResult?: string;
  verificationNotes?: string;
}

// ============================================
// API Functions
// ============================================

const API_BASE = '/api';

export async function getNonconformities(params?: {
  skip?: number;
  take?: number;
  source?: NonconformitySource;
  severity?: NCSeverity;
  status?: NCStatus;
  responsibleUserId?: string;
  controlId?: string;
  capabilityId?: string;
}): Promise<PaginatedResponse<Nonconformity>> {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) queryParams.set('skip', params.skip.toString());
  if (params?.take !== undefined) queryParams.set('take', params.take.toString());
  if (params?.source) queryParams.set('source', params.source);
  if (params?.severity) queryParams.set('severity', params.severity);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.responsibleUserId) queryParams.set('responsibleUserId', params.responsibleUserId);
  if (params?.controlId) queryParams.set('controlId', params.controlId);
  if (params?.capabilityId) queryParams.set('capabilityId', params.capabilityId);

  const query = queryParams.toString();
  return request<PaginatedResponse<Nonconformity>>(
    `${API_BASE}/nonconformities${query ? `?${query}` : ''}`
  );
}

export async function getNonconformityStats(): Promise<NonconformityStats> {
  return request<NonconformityStats>(`${API_BASE}/nonconformities/stats`);
}

export async function getNonconformity(id: string): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}`);
}

export async function createNonconformity(data: CreateNonconformityInput): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNonconformity(
  id: string,
  data: UpdateNonconformityInput
): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function closeNonconformity(id: string, closedById: string): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}/close`, {
    method: 'PUT',
    body: JSON.stringify({ closedById }),
  });
}

export async function linkRisksToNonconformity(id: string, riskIds: string[]): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}/link-risks`, {
    method: 'PUT',
    body: JSON.stringify({ riskIds }),
  });
}

export async function deleteNonconformity(id: string): Promise<void> {
  return request<void>(`${API_BASE}/nonconformities/${id}`, {
    method: 'DELETE',
  });
}

// Get users for responsible person dropdown
export async function getUsers(): Promise<UserBasic[]> {
  const response = await request<PaginatedResponse<UserBasic>>('/api/auth/users');
  return response.results;
}

// ============================================
// CAP Workflow API Functions
// ============================================

export interface SaveCapDraftInput {
  correctiveAction: string;
  rootCause?: string;
  responsibleUserId: string;
  targetClosureDate: string;
  draftedById: string;
}

/**
 * Save or update CAP as draft
 * Can be called multiple times while CAP is in DRAFT or NOT_DEFINED status
 */
export async function saveCapDraft(id: string, data: SaveCapDraftInput): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}/cap/draft`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Submit CAP for approval
 * Moves CAP from DRAFT to PENDING_APPROVAL
 */
export async function submitCapForApproval(id: string, submittedById: string): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}/cap/submit`, {
    method: 'POST',
    body: JSON.stringify({ submittedById }),
  });
}

/**
 * Approve CAP
 * Moves CAP from PENDING_APPROVAL to APPROVED
 * Also moves NC status to IN_PROGRESS
 */
export async function approveCap(
  id: string, 
  approvedById: string, 
  approvalComments?: string
): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}/cap/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvedById, approvalComments }),
  });
}

/**
 * Reject CAP
 * Moves CAP from PENDING_APPROVAL to REJECTED
 * Reason is required
 */
export async function rejectCap(
  id: string, 
  rejectedById: string, 
  rejectionReason: string
): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}/cap/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectedById, rejectionReason }),
  });
}

/**
 * Mark CAP as not required (for Observations only)
 * Moves NC directly to IN_PROGRESS without CAP approval
 */
export async function markCapNotRequired(id: string, userId: string): Promise<Nonconformity> {
  return request<Nonconformity>(`${API_BASE}/nonconformities/${id}/cap/skip`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
