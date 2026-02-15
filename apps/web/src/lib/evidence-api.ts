// Evidence Module API Service

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }

  const text = await res.text();
  if (!text) {
    return {} as T;
  }
  
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}

const API_BASE = '/api';

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

export interface DepartmentBasic {
  id: string;
  name: string;
  departmentCode: string;
}

// ============================================
// Evidence Types
// ============================================

export type EvidenceType =
  | 'DOCUMENT'
  | 'CERTIFICATE'
  | 'REPORT'
  | 'POLICY'
  | 'PROCEDURE'
  | 'SCREENSHOT'
  | 'LOG'
  | 'CONFIGURATION'
  | 'NETWORK_CAPTURE'
  | 'MEMORY_DUMP'
  | 'DISK_IMAGE'
  | 'MALWARE_SAMPLE'
  | 'EMAIL'
  | 'MEETING_NOTES'
  | 'APPROVAL_RECORD'
  | 'AUDIT_REPORT'
  | 'ASSESSMENT_RESULT'
  | 'TEST_RESULT'
  | 'SCAN_RESULT'
  | 'VIDEO'
  | 'AUDIO'
  | 'OTHER';

export type EvidenceStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ARCHIVED';

export type EvidenceClassification =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED';

export type EvidenceSourceType =
  | 'MANUAL_UPLOAD'
  | 'AUTOMATED'
  | 'EXTERNAL_SYSTEM'
  | 'VENDOR_PROVIDED';

export type EvidenceRequestStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'OVERDUE';

export type EvidenceRequestPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type LinkEntityType =
  | 'control'
  | 'capability'
  | 'test'
  | 'nonconformity'
  | 'incident'
  | 'risk'
  | 'treatment'
  | 'policy'
  | 'vendor'
  | 'assessment'
  | 'contract'
  | 'asset'
  | 'change'
  | 'application'
  | 'isra';

// ============================================
// Evidence Interface
// ============================================

export interface Evidence {
  id: string;
  evidenceRef: string;
  title: string;
  description?: string;
  evidenceType: EvidenceType;
  status: EvidenceStatus;
  classification: EvidenceClassification;
  tags?: string[];
  category?: string;
  subcategory?: string;
  
  // File info
  fileName?: string;
  originalFileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  storagePath?: string;
  storageProvider?: string;
  isEncrypted?: boolean;
  
  // Integrity
  hashSha256?: string;
  hashMd5?: string;
  isForensicallySound?: boolean;
  chainOfCustodyNotes?: string;
  
  // Source
  sourceType: EvidenceSourceType;
  sourceSystem?: string;
  sourceReference?: string;
  collectedAt: string;
  collectedById?: string;
  collectedBy?: UserBasic;
  collectionMethod?: string;
  
  // Validity
  validFrom?: string;
  validUntil?: string;
  retainUntil?: string;
  renewalRequired?: boolean;
  renewalReminderDays?: number;
  
  // Review
  reviewedAt?: string;
  reviewedById?: string;
  reviewedBy?: UserBasic;
  reviewNotes?: string;
  
  // Approval
  approvedAt?: string;
  approvedById?: string;
  approvedBy?: UserBasic;
  approvalNotes?: string;
  
  // Rejection
  rejectedAt?: string;
  rejectedById?: string;
  rejectedBy?: UserBasic;
  rejectionReason?: string;
  
  // Versioning
  version: number;
  previousVersionId?: string;
  previousVersion?: { id: string; evidenceRef: string; title: string; version: number };
  newerVersions?: { id: string; evidenceRef: string; title: string; version: number }[];
  
  // Metadata
  metadata?: Record<string, unknown>;
  notes?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  createdBy?: UserBasic;
  updatedById?: string;
  updatedBy?: UserBasic;
  
  // Link counts (for list view)
  _count?: {
    controlLinks: number;
    capabilityLinks: number;
    testLinks: number;
    nonconformityLinks: number;
    incidentLinks: number;
    riskLinks: number;
    vendorLinks: number;
    assetLinks: number;
  };
  
  // Linked entities (for detail view)
  controlLinks?: EvidenceControlLink[];
  capabilityLinks?: EvidenceCapabilityLink[];
  testLinks?: EvidenceTestLink[];
  nonconformityLinks?: EvidenceNonconformityLink[];
  incidentLinks?: EvidenceIncidentLink[];
  riskLinks?: EvidenceRiskLink[];
  vendorLinks?: EvidenceVendorLink[];
  assetLinks?: EvidenceAssetLink[];
  applicationLinks?: EvidenceApplicationLink[];
  requestFulfillments?: EvidenceRequestFulfillment[];
}

// Link interfaces
export interface EvidenceControlLink {
  id: string;
  linkType?: string;
  notes?: string;
  control: { id: string; controlId: string; name: string };
}

export interface EvidenceCapabilityLink {
  id: string;
  linkType?: string;
  maturityLevel?: number;
  notes?: string;
  capability: {
    id: string;
    capabilityId: string;
    name: string;
    control: { id: string; controlId: string; name: string };
  };
}

export interface EvidenceTestLink {
  id: string;
  notes?: string;
  test: {
    id: string;
    testType: string;
    testResult: string;
    capability: {
      id: string;
      capabilityId: string;
      name: string;
      control: { id: string; controlId: string; name: string };
    };
  };
}

export interface EvidenceNonconformityLink {
  id: string;
  linkType?: string;
  notes?: string;
  nonconformity: { id: string; ncId: string; title: string; status: string; severity: string };
}

export interface EvidenceIncidentLink {
  id: string;
  linkType?: string;
  notes?: string;
  incident: { id: string; referenceNumber: string; title: string; status: string; severity: string };
}

export interface EvidenceRiskLink {
  id: string;
  linkType?: string;
  notes?: string;
  risk: { id: string; riskId: string; title: string; status: string };
}

export interface EvidenceVendorLink {
  id: string;
  linkType?: string;
  notes?: string;
  vendor: { id: string; vendorCode: string; name: string; tier: string; status: string };
}

export interface EvidenceAssetLink {
  id: string;
  linkType?: string;
  notes?: string;
  asset: { id: string; assetTag: string; name: string; assetType: string; status: string };
}

export interface EvidenceApplicationLink {
  id: string;
  linkType?: string;
  notes?: string;
  application: { id: string; appId: string; name: string; criticality: string };
}

export interface EvidenceRequestFulfillment {
  id: string;
  notes?: string;
  request: { id: string; requestRef: string; title: string; status: string };
}

// ============================================
// Evidence Request Interface
// ============================================

export interface EvidenceRequest {
  id: string;
  requestRef: string;
  title: string;
  description: string;
  evidenceType?: EvidenceType;
  requiredFormat?: string;
  acceptanceCriteria?: string;
  priority: EvidenceRequestPriority;
  status: EvidenceRequestStatus;
  dueDate: string;
  
  // Assignment
  requestedById?: string;
  requestedBy?: UserBasic;
  assignedToId?: string;
  assignedTo?: UserBasic;
  assignedDepartmentId?: string;
  assignedDepartment?: DepartmentBasic;
  
  // Context
  contextType?: string;
  contextId?: string;
  contextRef?: string;
  
  // Dates
  submittedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  
  // Response
  rejectionReason?: string;
  notes?: string;
  
  // Fulfillments
  fulfillments?: {
    id: string;
    notes?: string;
    evidence: {
      id: string;
      evidenceRef: string;
      title: string;
      status: EvidenceStatus;
      evidenceType: EvidenceType;
      fileName?: string;
      createdAt: string;
    };
    submittedBy?: UserBasic;
  }[];
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  createdBy?: UserBasic;
}

// ============================================
// Stats Interfaces
// ============================================

export interface EvidenceStats {
  total: number;
  byStatus: Record<EvidenceStatus, number>;
  byType: Record<EvidenceType, number>;
  byClassification: Record<EvidenceClassification, number>;
  expiringSoon: number;
  recentlyAdded: number;
}

export interface EvidenceRequestStats {
  total: number;
  byStatus: Record<EvidenceRequestStatus, number>;
  byPriority: Record<EvidenceRequestPriority, number>;
  overdue: number;
}

// ============================================
// Input Types
// ============================================

export interface CreateEvidenceInput {
  title: string;
  description?: string;
  evidenceType: EvidenceType;
  classification?: EvidenceClassification;
  tags?: string[];
  category?: string;
  subcategory?: string;
  fileName?: string;
  originalFileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  storagePath?: string;
  storageProvider?: string;
  isEncrypted?: boolean;
  hashSha256?: string;
  hashMd5?: string;
  isForensicallySound?: boolean;
  chainOfCustodyNotes?: string;
  sourceType?: EvidenceSourceType;
  sourceSystem?: string;
  sourceReference?: string;
  collectedAt?: string;
  collectedById?: string;
  collectionMethod?: string;
  validFrom?: string;
  validUntil?: string;
  retainUntil?: string;
  renewalRequired?: boolean;
  renewalReminderDays?: number;
  metadata?: Record<string, unknown>;
  notes?: string;
  createdById: string;
}

export interface UpdateEvidenceInput {
  title?: string;
  description?: string;
  evidenceType?: EvidenceType;
  classification?: EvidenceClassification;
  tags?: string[];
  category?: string;
  subcategory?: string;
  fileName?: string;
  originalFileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  storagePath?: string;
  storageProvider?: string;
  isEncrypted?: boolean;
  hashSha256?: string;
  hashMd5?: string;
  isForensicallySound?: boolean;
  chainOfCustodyNotes?: string;
  sourceType?: EvidenceSourceType;
  sourceSystem?: string;
  sourceReference?: string;
  collectionMethod?: string;
  validFrom?: string;
  validUntil?: string;
  retainUntil?: string;
  renewalRequired?: boolean;
  renewalReminderDays?: number;
  metadata?: Record<string, unknown>;
  notes?: string;
  updatedById: string;
}

export interface CreateEvidenceRequestInput {
  title: string;
  description: string;
  evidenceType?: EvidenceType;
  requiredFormat?: string;
  acceptanceCriteria?: string;
  priority?: EvidenceRequestPriority;
  dueDate: string;
  assignedToId?: string;
  assignedDepartmentId?: string;
  contextType?: string;
  contextId?: string;
  contextRef?: string;
  requestedById: string;
  createdById: string;
}

export interface UpdateEvidenceRequestInput {
  title?: string;
  description?: string;
  evidenceType?: EvidenceType;
  requiredFormat?: string;
  acceptanceCriteria?: string;
  priority?: EvidenceRequestPriority;
  dueDate?: string;
  assignedToId?: string;
  assignedDepartmentId?: string;
  notes?: string;
}

// ============================================
// Evidence API Functions
// ============================================

export async function getEvidenceList(params?: {
  skip?: number;
  take?: number;
  evidenceType?: EvidenceType;
  status?: EvidenceStatus;
  classification?: EvidenceClassification;
  sourceType?: EvidenceSourceType;
  category?: string;
  search?: string;
  collectedById?: string;
  validUntilBefore?: string;
  validUntilAfter?: string;
}): Promise<PaginatedResponse<Evidence>> {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) queryParams.set('skip', params.skip.toString());
  if (params?.take !== undefined) queryParams.set('take', params.take.toString());
  if (params?.evidenceType) queryParams.set('evidenceType', params.evidenceType);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.classification) queryParams.set('classification', params.classification);
  if (params?.sourceType) queryParams.set('sourceType', params.sourceType);
  if (params?.category) queryParams.set('category', params.category);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.collectedById) queryParams.set('collectedById', params.collectedById);
  if (params?.validUntilBefore) queryParams.set('validUntilBefore', params.validUntilBefore);
  if (params?.validUntilAfter) queryParams.set('validUntilAfter', params.validUntilAfter);

  const query = queryParams.toString();
  return request<PaginatedResponse<Evidence>>(
    `${API_BASE}/evidence${query ? `?${query}` : ''}`
  );
}

export async function getEvidenceStats(): Promise<EvidenceStats> {
  return request<EvidenceStats>(`${API_BASE}/evidence/stats`);
}

export async function getExpiringEvidence(days?: number): Promise<Evidence[]> {
  const query = days ? `?days=${days}` : '';
  return request<Evidence[]>(`${API_BASE}/evidence/expiring${query}`);
}

export async function getEvidence(id: string): Promise<Evidence> {
  return request<Evidence>(`${API_BASE}/evidence/${id}`);
}

export async function createEvidence(data: CreateEvidenceInput): Promise<Evidence> {
  return request<Evidence>(`${API_BASE}/evidence`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvidence(id: string, data: UpdateEvidenceInput): Promise<Evidence> {
  return request<Evidence>(`${API_BASE}/evidence/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEvidence(id: string): Promise<void> {
  return request<void>(`${API_BASE}/evidence/${id}`, {
    method: 'DELETE',
  });
}

// Workflow actions
export async function submitEvidenceForReview(id: string, userId: string): Promise<Evidence> {
  return request<Evidence>(`${API_BASE}/evidence/${id}/submit-for-review`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function approveEvidence(id: string, userId: string, notes?: string): Promise<Evidence> {
  return request<Evidence>(`${API_BASE}/evidence/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ userId, notes }),
  });
}

export async function rejectEvidence(id: string, userId: string, reason: string): Promise<Evidence> {
  return request<Evidence>(`${API_BASE}/evidence/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ userId, reason }),
  });
}

export async function archiveEvidence(id: string, userId: string): Promise<Evidence> {
  return request<Evidence>(`${API_BASE}/evidence/${id}/archive`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function createEvidenceNewVersion(
  previousId: string,
  data: {
    title: string;
    description?: string;
    evidenceType: EvidenceType;
    classification?: EvidenceClassification;
    fileName?: string;
    fileUrl?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    hashSha256?: string;
    hashMd5?: string;
    validFrom?: string;
    validUntil?: string;
    notes?: string;
    createdById: string;
  }
): Promise<Evidence> {
  return request<Evidence>(`${API_BASE}/evidence/${previousId}/new-version`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// Evidence Request API Functions
// ============================================

export async function getEvidenceRequests(params?: {
  skip?: number;
  take?: number;
  status?: EvidenceRequestStatus;
  priority?: EvidenceRequestPriority;
  assignedToId?: string;
  assignedDepartmentId?: string;
  requestedById?: string;
  contextType?: string;
  contextId?: string;
  overdue?: boolean;
}): Promise<PaginatedResponse<EvidenceRequest>> {
  const queryParams = new URLSearchParams();
  if (params?.skip !== undefined) queryParams.set('skip', params.skip.toString());
  if (params?.take !== undefined) queryParams.set('take', params.take.toString());
  if (params?.status) queryParams.set('status', params.status);
  if (params?.priority) queryParams.set('priority', params.priority);
  if (params?.assignedToId) queryParams.set('assignedToId', params.assignedToId);
  if (params?.assignedDepartmentId) queryParams.set('assignedDepartmentId', params.assignedDepartmentId);
  if (params?.requestedById) queryParams.set('requestedById', params.requestedById);
  if (params?.contextType) queryParams.set('contextType', params.contextType);
  if (params?.contextId) queryParams.set('contextId', params.contextId);
  if (params?.overdue) queryParams.set('overdue', 'true');

  const query = queryParams.toString();
  return request<PaginatedResponse<EvidenceRequest>>(
    `${API_BASE}/evidence-requests${query ? `?${query}` : ''}`
  );
}

export async function getEvidenceRequestStats(): Promise<EvidenceRequestStats> {
  return request<EvidenceRequestStats>(`${API_BASE}/evidence-requests/stats`);
}

export async function getMyEvidenceRequests(userId: string): Promise<EvidenceRequest[]> {
  return request<EvidenceRequest[]>(`${API_BASE}/evidence-requests/my-requests/${userId}`);
}

export async function getEvidenceRequest(id: string): Promise<EvidenceRequest> {
  return request<EvidenceRequest>(`${API_BASE}/evidence-requests/${id}`);
}

export async function createEvidenceRequest(data: CreateEvidenceRequestInput): Promise<EvidenceRequest> {
  return request<EvidenceRequest>(`${API_BASE}/evidence-requests`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvidenceRequest(
  id: string,
  data: UpdateEvidenceRequestInput
): Promise<EvidenceRequest> {
  return request<EvidenceRequest>(`${API_BASE}/evidence-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEvidenceRequest(id: string): Promise<void> {
  return request<void>(`${API_BASE}/evidence-requests/${id}`, {
    method: 'DELETE',
  });
}

// Workflow actions
export async function startEvidenceRequestProgress(id: string): Promise<EvidenceRequest> {
  return request<EvidenceRequest>(`${API_BASE}/evidence-requests/${id}/start-progress`, {
    method: 'POST',
  });
}

export async function submitEvidenceToRequest(
  requestId: string,
  evidenceId: string,
  userId: string,
  notes?: string
): Promise<EvidenceRequest> {
  return request<EvidenceRequest>(`${API_BASE}/evidence-requests/${requestId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ evidenceId, userId, notes }),
  });
}

export async function acceptEvidenceRequest(id: string): Promise<EvidenceRequest> {
  return request<EvidenceRequest>(`${API_BASE}/evidence-requests/${id}/accept`, {
    method: 'POST',
  });
}

export async function rejectEvidenceRequest(id: string, reason: string): Promise<EvidenceRequest> {
  return request<EvidenceRequest>(`${API_BASE}/evidence-requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function cancelEvidenceRequest(id: string): Promise<EvidenceRequest> {
  return request<EvidenceRequest>(`${API_BASE}/evidence-requests/${id}/cancel`, {
    method: 'POST',
  });
}

// ============================================
// Evidence Link API Functions
// ============================================

export async function linkEvidenceToEntity(
  evidenceId: string,
  entityType: LinkEntityType,
  entityId: string,
  linkType?: string,
  notes?: string,
  createdById?: string
): Promise<unknown> {
  return request(`${API_BASE}/evidence-links`, {
    method: 'POST',
    body: JSON.stringify({ evidenceId, entityType, entityId, linkType, notes, createdById }),
  });
}

export async function unlinkEvidenceFromEntity(
  evidenceId: string,
  entityType: LinkEntityType,
  entityId: string
): Promise<void> {
  const params = new URLSearchParams({
    evidenceId,
    entityType,
    entityId,
  });
  return request<void>(`${API_BASE}/evidence-links?${params}`, {
    method: 'DELETE',
  });
}

export async function getEvidenceForEntity(
  entityType: LinkEntityType,
  entityId: string
): Promise<unknown[]> {
  return request<unknown[]>(`${API_BASE}/evidence-links/entity/${entityType}/${entityId}`);
}

export async function bulkLinkEvidence(
  evidenceIds: string[],
  entityType: LinkEntityType,
  entityId: string,
  linkType?: string,
  createdById?: string
): Promise<unknown[]> {
  return request<unknown[]>(`${API_BASE}/evidence-links/bulk`, {
    method: 'POST',
    body: JSON.stringify({ evidenceIds, entityType, entityId, linkType, createdById }),
  });
}

