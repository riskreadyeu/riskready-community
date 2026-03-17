// Incidents Module API Service

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

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'DETECTED' | 'TRIAGED' | 'INVESTIGATING' | 'CONTAINING' | 'ERADICATING' | 'RECOVERING' | 'POST_INCIDENT' | 'CLOSED';
export type IncidentCategory = 'MALWARE' | 'PHISHING' | 'DENIAL_OF_SERVICE' | 'DATA_BREACH' | 'UNAUTHORIZED_ACCESS' | 'INSIDER_THREAT' | 'PHYSICAL' | 'SUPPLY_CHAIN' | 'SYSTEM_FAILURE' | 'CONFIGURATION_ERROR' | 'OTHER';
export type IncidentSource = 'SIEM' | 'USER_REPORT' | 'THREAT_INTEL' | 'AUTOMATED' | 'THIRD_PARTY' | 'REGULATOR' | 'VULNERABILITY_SCAN' | 'PENETRATION_TEST' | 'OTHER';
export type IncidentResolutionType = 'RESOLVED' | 'FALSE_POSITIVE' | 'ACCEPTED_RISK' | 'DUPLICATE' | 'TRANSFERRED';
export type IncidentImpactType = 'COMPROMISED' | 'AFFECTED' | 'AT_RISK';
export type IncidentEvidenceType = 'LOG' | 'SCREENSHOT' | 'MEMORY_DUMP' | 'DISK_IMAGE' | 'NETWORK_CAPTURE' | 'MALWARE_SAMPLE' | 'EMAIL' | 'DOCUMENT' | 'OTHER';
export type IncidentTimelineEntryType = 'STATUS_CHANGE' | 'ACTION_TAKEN' | 'COMMUNICATION' | 'EVIDENCE_COLLECTED' | 'ESCALATION' | 'FINDING' | 'CLASSIFICATION_CHANGE' | 'NOTIFICATION_SENT' | 'OTHER';
export type IncidentVisibility = 'INTERNAL' | 'MANAGEMENT' | 'REGULATOR' | 'PUBLIC';
export type IncidentCommunicationType = 'INTERNAL' | 'CUSTOMER' | 'VENDOR' | 'REGULATOR' | 'LAW_ENFORCEMENT' | 'MEDIA' | 'BOARD' | 'INSURER';
export type IncidentCommunicationDirection = 'INBOUND' | 'OUTBOUND';
export type IncidentCommunicationChannel = 'EMAIL' | 'PHONE' | 'PORTAL' | 'MEETING' | 'LETTER' | 'SECURE_MESSAGE';
export type LessonsLearnedCategory = 'DETECTION' | 'RESPONSE' | 'COMMUNICATION' | 'TOOLING' | 'TRAINING' | 'PROCESS' | 'THIRD_PARTY' | 'DOCUMENTATION';
export type LessonsLearnedStatus = 'IDENTIFIED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'VALIDATED';
export type RegulatoryFramework = 'ISO27001' | 'NIS2' | 'DORA' | 'GDPR' | 'LOCAL_REGULATION';
export type NotificationType = 'EARLY_WARNING' | 'INITIAL' | 'INTERMEDIATE' | 'FINAL' | 'VOLUNTARY' | 'UPDATE';
export type NotificationStatus = 'PENDING' | 'PENDING_APPROVAL' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'ADDITIONAL_INFO_REQUESTED' | 'CLOSED' | 'OVERDUE';

export interface UserBasic {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface IncidentType {
  id: string;
  name: string;
  description?: string;
  category: IncidentCategory;
  defaultSeverity: IncidentSeverity;
  typicalConfidentialityImpact: boolean;
  typicalIntegrityImpact: boolean;
  typicalAvailabilityImpact: boolean;
  requiresLawEnforcement: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface AttackVector {
  id: string;
  name: string;
  description?: string;
  mitreAttackId?: string;
  mitreAttackName?: string;
  mitreTactics?: string[];
  isActive: boolean;
}

export interface RegulatoryAuthority {
  id: string;
  name: string;
  shortName?: string;
  countryCode: string;
  authorityType: 'CSIRT' | 'COMPETENT_AUTHORITY' | 'FINANCIAL_SUPERVISOR' | 'DATA_PROTECTION_AUTHORITY';
  frameworks?: string[];
  submissionPortalUrl?: string;
  submissionEmail?: string;
  timezone?: string;
  isActive: boolean;
}

export interface Incident {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  
  // Detection & Timeline
  detectedAt: string;
  occurredAt?: string;
  reportedAt?: string;
  classifiedAt?: string;
  containedAt?: string;
  eradicatedAt?: string;
  recoveredAt?: string;
  closedAt?: string;
  
  // Classification
  severity: IncidentSeverity;
  category: IncidentCategory;
  isConfirmed: boolean;
  
  incidentTypeId?: string;
  incidentType?: IncidentType;
  attackVectorId?: string;
  attackVector?: AttackVector;
  
  // Ownership
  reporterId?: string;
  reporter?: UserBasic;
  handlerId?: string;
  handler?: UserBasic;
  incidentManagerId?: string;
  incidentManager?: UserBasic;
  
  // Status & Resolution
  status: IncidentStatus;
  resolutionType?: IncidentResolutionType;
  
  // CIA Impact
  confidentialityBreach: boolean;
  integrityBreach: boolean;
  availabilityBreach: boolean;
  
  // ISO 27001 Compliance
  evidencePreserved: boolean;
  chainOfCustodyMaintained: boolean;
  rootCauseIdentified: boolean;
  lessonsLearnedCompleted: boolean;
  correctiveActionsIdentified: boolean;
  
  // Source
  source: IncidentSource;
  sourceRef?: string;
  
  // Organisation
  organisationId?: string;
  
  // Assessments
  nis2Assessment?: IncidentNIS2Assessment;
  doraAssessment?: IncidentDORAAssessment;
  
  // Counts
  _count?: {
    affectedAssets: number;
    evidence: number;
    timeline: number;
    communications: number;
    lessonsLearned: number;
    notifications: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface IncidentNIS2Assessment {
  id: string;
  incidentId: string;
  applies: boolean;
  entityType?: 'ESSENTIAL' | 'IMPORTANT';
  sector?: string;
  
  // Significant Incident Criteria
  causedSevereOperationalDisruption: boolean;
  causedFinancialLoss: boolean;
  financialLossAmount?: number;
  affectedOtherPersons: boolean;
  affectedPersonsCount?: number;
  causedMaterialDamage: boolean;
  
  // Cross-Border
  hasCrossBorderImpact: boolean;
  affectedMemberStates?: string[];
  
  // Service Impact
  serviceAvailabilityImpactPercent?: number;
  serviceDegradationDurationHours?: number;
  
  // Classification Result
  isSignificantIncident: boolean;
  significanceDeterminationRationale?: string;
  manuallyOverridden: boolean;
  
  // Reporting Deadlines
  earlyWarningRequiredBy?: string;
  earlyWarningSubmittedAt?: string;
  notificationRequiredBy?: string;
  notificationSubmittedAt?: string;
  finalReportRequiredBy?: string;
  finalReportSubmittedAt?: string;
}

export interface IncidentDORAAssessment {
  id: string;
  incidentId: string;
  applies: boolean;
  financialEntityType?: string;
  
  // ICT Service Context
  thirdPartyProviderInvolved: boolean;
  affectsCriticalFunction: boolean;
  
  // Classification Criteria
  criterion1ThresholdBreached: boolean;
  criterion2ThresholdBreached: boolean;
  criterion3ThresholdBreached: boolean;
  criterion4ThresholdBreached: boolean;
  criterion5ThresholdBreached: boolean;
  criterion6ThresholdBreached: boolean;
  criterion7ThresholdBreached: boolean;
  
  // Classification Result
  isMajorIncident: boolean;
  majorClassificationScore: number;
  classificationRationale?: string;
  manuallyOverridden: boolean;
  
  // Reporting Status
  initialNotificationRequiredBy?: string;
  initialNotificationSubmittedAt?: string;
  intermediateReportRequiredBy?: string;
  intermediateReportSubmittedAt?: string;
  finalReportRequiredBy?: string;
  finalReportSubmittedAt?: string;
}

export interface IncidentAsset {
  id: string;
  incidentId: string;
  assetId: string;
  asset?: {
    id: string;
    assetTag: string;
    name: string;
    assetType: string;
    businessCriticality: string;
  };
  impactType: IncidentImpactType;
  confirmedAt?: string;
  notes?: string;
}

export interface IncidentEvidence {
  id: string;
  incidentId: string;
  evidenceType: IncidentEvidenceType;
  title: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  hashSha256?: string;
  collectedAt: string;
  collectedById: string;
  collectedBy?: UserBasic;
  isForensicallySound: boolean;
  storageLocation?: string;
  retainUntil?: string;
  createdAt: string;
}

export interface IncidentTimelineEntry {
  id: string;
  incidentId: string;
  timestamp: string;
  entryType: IncidentTimelineEntryType;
  title: string;
  description?: string;
  visibility: IncidentVisibility;
  isAutomated: boolean;
  sourceSystem?: string;
  createdById: string;
  createdBy?: UserBasic;
  createdAt: string;
}

export interface IncidentCommunication {
  id: string;
  incidentId: string;
  communicationType: IncidentCommunicationType;
  direction: IncidentCommunicationDirection;
  channel: IncidentCommunicationChannel;
  subject: string;
  content: string;
  summary?: string;
  senderName?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  occurredAt: string;
  requiresFollowUp: boolean;
  followUpDueAt?: string;
  followUpCompleted: boolean;
  createdById: string;
  createdBy?: UserBasic;
  createdAt: string;
}

export interface IncidentLessonsLearned {
  id: string;
  incidentId: string;
  category: LessonsLearnedCategory;
  observation: string;
  recommendation: string;
  status: LessonsLearnedStatus;
  priority: number;
  targetDate?: string;
  completedDate?: string;
  assignedToId?: string;
  assignedTo?: UserBasic;
  createdById: string;
  createdBy?: UserBasic;
  createdAt: string;
}

export interface IncidentNotification {
  id: string;
  incidentId: string;
  framework: RegulatoryFramework;
  notificationType: NotificationType;
  authorityId: string;
  authority?: RegulatoryAuthority;
  dueAt?: string;
  submittedAt?: string;
  status: NotificationStatus;
  externalReference?: string;
  followUpRequired: boolean;
  followUpDueAt?: string;
  createdAt: string;
}

export interface IncidentStats {
  total: number;
  open: number;
  closed: number;
  bySeverity: Record<IncidentSeverity, number>;
  byStatus: Record<IncidentStatus, number>;
  byCategory: Record<IncidentCategory, number>;
  avgMTTD?: number; // Mean Time to Detect (hours)
  avgMTTR?: number; // Mean Time to Resolve (hours)
  avgMTTC?: number; // Mean Time to Contain (hours)
  nis2Significant: number;
  doraMajor: number;
  overdueNotifications: number;
}

// ============================================
// API Functions - Incidents
// ============================================

export interface GetIncidentsParams {
  skip?: number;
  take?: number;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  search?: string;
  organisationId?: string;
}

export async function getIncidents(params?: GetIncidentsParams): Promise<PaginatedResponse<Incident>> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.set('skip', String(params.skip));
  if (params?.take) searchParams.set('take', String(params.take));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.severity) searchParams.set('severity', params.severity);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.organisationId) searchParams.set('organisationId', params.organisationId);
  
  const query = searchParams.toString();
  return request<PaginatedResponse<Incident>>(`/api/incidents${query ? `?${query}` : ''}`);
}

export async function getIncident(id: string): Promise<Incident> {
  return request<Incident>(`/api/incidents/${id}`);
}

export interface CreateIncidentDto {
  title: string;
  description: string;
  severity: IncidentSeverity;
  category?: IncidentCategory;
  source: IncidentSource;
  sourceRef?: string;
  detectedAt: string;
  occurredAt?: string;
  reporterId?: string;
  handlerId?: string;
  incidentManagerId?: string;
  incidentTypeId?: string;
  attackVectorId?: string;
  organisationId?: string;
  confidentialityBreach?: boolean;
  integrityBreach?: boolean;
  availabilityBreach?: boolean;
}

export async function createIncident(data: CreateIncidentDto): Promise<Incident> {
  return request<Incident>('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface UpdateIncidentDto extends Partial<CreateIncidentDto> {
  status?: IncidentStatus;
  resolutionType?: IncidentResolutionType;
  isConfirmed?: boolean;
  reportedAt?: string;
  classifiedAt?: string;
  containedAt?: string;
  eradicatedAt?: string;
  recoveredAt?: string;
  closedAt?: string;
  evidencePreserved?: boolean;
  chainOfCustodyMaintained?: boolean;
  rootCauseIdentified?: boolean;
  lessonsLearnedCompleted?: boolean;
  correctiveActionsIdentified?: boolean;
}

export async function updateIncident(id: string, data: UpdateIncidentDto): Promise<Incident> {
  return request<Incident>(`/api/incidents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteIncident(id: string): Promise<void> {
  await request<void>(`/api/incidents/${id}`, { method: 'DELETE' });
}

export async function getIncidentStats(): Promise<IncidentStats> {
  return request<IncidentStats>('/api/incidents/stats');
}

// ============================================
// API Functions - Timeline
// ============================================

export async function getIncidentTimeline(incidentId: string): Promise<IncidentTimelineEntry[]> {
  const data = await request<{ results: IncidentTimelineEntry[]; count: number } | IncidentTimelineEntry[]>(`/api/incidents/${incidentId}/timeline`);
  return Array.isArray(data) ? data : data.results;
}

export interface CreateTimelineEntryDto {
  timestamp: string;
  entryType: IncidentTimelineEntryType;
  title: string;
  description?: string;
  visibility?: IncidentVisibility;
}

export async function createTimelineEntry(incidentId: string, data: CreateTimelineEntryDto): Promise<IncidentTimelineEntry> {
  return request<IncidentTimelineEntry>(`/api/incidents/${incidentId}/timeline`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// API Functions - Evidence
// ============================================

export async function getIncidentEvidence(incidentId: string): Promise<IncidentEvidence[]> {
  const data = await request<{ results: IncidentEvidence[]; count: number } | IncidentEvidence[]>(`/api/incidents/${incidentId}/evidence`);
  return Array.isArray(data) ? data : data.results;
}

export interface CreateEvidenceDto {
  evidenceType: IncidentEvidenceType;
  title: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  hashSha256?: string;
  collectedAt: string;
  collectedById: string;
  collectionMethod?: string;
  chainOfCustodyNotes?: string;
  isForensicallySound?: boolean;
  storageLocation?: string;
  retainUntil?: string;
}

export async function createEvidence(incidentId: string, data: CreateEvidenceDto): Promise<IncidentEvidence> {
  return request<IncidentEvidence>(`/api/incidents/${incidentId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// API Functions - Communications
// ============================================

export async function getIncidentCommunications(incidentId: string): Promise<IncidentCommunication[]> {
  return request<IncidentCommunication[]>(`/api/incidents/${incidentId}/communications`);
}

export interface CreateCommunicationDto {
  communicationType: IncidentCommunicationType;
  direction: IncidentCommunicationDirection;
  channel: IncidentCommunicationChannel;
  subject: string;
  content: string;
  summary?: string;
  senderName?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  occurredAt: string;
  requiresFollowUp?: boolean;
  followUpDueAt?: string;
}

export async function createCommunication(incidentId: string, data: CreateCommunicationDto): Promise<IncidentCommunication> {
  return request<IncidentCommunication>(`/api/incidents/${incidentId}/communications`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// API Functions - Lessons Learned
// ============================================

export async function getIncidentLessonsLearned(incidentId: string): Promise<IncidentLessonsLearned[]> {
  const data = await request<{ results: IncidentLessonsLearned[]; count: number } | IncidentLessonsLearned[]>(`/api/incidents/${incidentId}/lessons-learned`);
  return Array.isArray(data) ? data : data.results;
}

export interface CreateLessonsLearnedDto {
  category: LessonsLearnedCategory;
  observation: string;
  recommendation: string;
  priority?: number;
  targetDate?: string;
  assignedToId?: string;
}

export async function createLessonsLearned(incidentId: string, data: CreateLessonsLearnedDto): Promise<IncidentLessonsLearned> {
  return request<IncidentLessonsLearned>(`/api/incidents/${incidentId}/lessons-learned`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// API Functions - Notifications
// ============================================

export async function getIncidentNotifications(incidentId: string): Promise<IncidentNotification[]> {
  return request<IncidentNotification[]>(`/api/incidents/${incidentId}/notifications`);
}

export async function getOverdueNotifications(): Promise<IncidentNotification[]> {
  return request<IncidentNotification[]>('/api/incidents/notifications/overdue');
}

// ============================================
// API Functions - Reference Data
// ============================================

export async function getIncidentTypes(): Promise<IncidentType[]> {
  return request<IncidentType[]>('/api/incidents/types');
}

export async function getAttackVectors(): Promise<AttackVector[]> {
  return request<AttackVector[]>('/api/incidents/attack-vectors');
}

export async function getRegulatoryAuthorities(): Promise<RegulatoryAuthority[]> {
  return request<RegulatoryAuthority[]>('/api/incidents/regulatory-authorities');
}

// ============================================
// Helper Functions
// ============================================

export const severityLabels: Record<IncidentSeverity, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const severityColors: Record<IncidentSeverity, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
};

export const statusLabels: Record<IncidentStatus, string> = {
  DETECTED: 'Detected',
  TRIAGED: 'Triaged',
  INVESTIGATING: 'Investigating',
  CONTAINING: 'Containing',
  ERADICATING: 'Eradicating',
  RECOVERING: 'Recovering',
  POST_INCIDENT: 'Post-Incident',
  CLOSED: 'Closed',
};

export const categoryLabels: Record<IncidentCategory, string> = {
  MALWARE: 'Malware',
  PHISHING: 'Phishing',
  DENIAL_OF_SERVICE: 'Denial of Service',
  DATA_BREACH: 'Data Breach',
  UNAUTHORIZED_ACCESS: 'Unauthorized Access',
  INSIDER_THREAT: 'Insider Threat',
  PHYSICAL: 'Physical',
  SUPPLY_CHAIN: 'Supply Chain',
  SYSTEM_FAILURE: 'System Failure',
  CONFIGURATION_ERROR: 'Configuration Error',
  OTHER: 'Other',
};

export const sourceLabels: Record<IncidentSource, string> = {
  SIEM: 'SIEM',
  USER_REPORT: 'User Report',
  THREAT_INTEL: 'Threat Intelligence',
  AUTOMATED: 'Automated Detection',
  THIRD_PARTY: 'Third Party',
  REGULATOR: 'Regulator',
  VULNERABILITY_SCAN: 'Vulnerability Scan',
  PENETRATION_TEST: 'Penetration Test',
  OTHER: 'Other',
};
