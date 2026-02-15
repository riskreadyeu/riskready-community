// Organisation Module API Service

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

  return (await res.json()) as T;
}

// Types
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

export interface Department {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  name: string;
  departmentCode: string;
  description?: string;

  // Hierarchy
  parentId?: string;
  parent?: { id: string; name: string; departmentCode: string };
  children?: Department[];

  // Classification
  departmentCategory?: string;
  functionType?: string;
  criticalityLevel?: string;

  // Leadership
  departmentHeadId?: string;
  departmentHead?: UserBasic;
  deputyHeadId?: string;
  deputyHead?: UserBasic;

  // Resources
  headcount?: number;
  contractorCount?: number;

  // Responsibilities
  keyResponsibilities?: string[];
  regulatoryObligations?: string[];
  externalInterfaces?: string[];

  // Financial
  costCenter?: string;
  budget?: string;
  budgetCurrency: string;

  // Location and Operations
  location?: string;
  floorPlanReference?: string;
  businessHours?: Record<string, string>;

  // Contact Information
  contactEmail?: string;
  contactPhone?: string;
  emergencyContact?: { name?: string; phone?: string; email?: string };

  // Status
  isActive: boolean;
  establishedDate?: string;
  closureDate?: string;

  // Data Handling (for ISMS)
  handlesPersonalData?: boolean;
  handlesFinancialData?: boolean;

  _count?: { members: number; businessProcesses: number; securityChampions: number; externalDependencies?: number };
}

export interface Location {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  locationCode?: string;
  name: string;
  locationType?: string;

  // Address
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  region?: string;

  // Contact
  contactEmail?: string;
  contactPhone?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;

  // Capacity
  employeeCount?: number;
  maxCapacity?: number;
  floorSpace?: number;
  floorSpaceUnit?: string;

  // Physical Security
  physicalSecurityLevel?: string;
  accessControlType?: string;
  securityFeatures?: string[];

  // IT Infrastructure
  isDataCenter?: boolean;
  hasServerRoom?: boolean;
  networkType?: string;
  internetProvider?: string;
  backupPower?: boolean;

  // Compliance
  complianceCertifications?: string[];

  // ISMS Scope
  inIsmsScope?: boolean;
  scopeJustification?: string;

  // Status
  isActive: boolean;
  operationalSince?: string;
  closureDate?: string;
}

export interface OrganisationProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  name: string;
  legalName: string;
  description?: string;
  logoUrl?: string;

  // Industry Information
  industrySector?: string;
  industrySubsector?: string;
  industryCode?: string;
  marketPosition?: string;
  primaryCompetitors?: string[];

  // Financial Information
  annualRevenue?: string;
  revenueCurrency?: string;
  revenueStreams?: string[];
  revenueTrend?: string;
  fiscalYearStart?: string;
  fiscalYearEnd?: string;
  reportingCurrency?: string;

  // Employee Information
  employeeCount: number;
  employeeCategories?: Record<string, number>;
  employeeLocations?: Record<string, number>;
  employeeGrowthRate?: number;
  remoteWorkPercentage?: number;
  size?: string;

  // Corporate Structure
  parentOrganization?: string;
  subsidiaries?: string[];
  operatingCountries?: string[];

  // Contact Information
  headquartersAddress?: string;
  registeredAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;

  // Legal Information
  registrationNumber?: string;
  taxIdentification?: string;
  dunsNumber?: string;
  stockSymbol?: string;
  leiCode?: string;
  naceCode?: string;
  sicCode?: string;
  foundedYear?: number;

  // Strategic Information
  missionStatement?: string;
  visionStatement?: string;
  coreValues?: string[];
  strategicObjectives?: string[];
  businessModel?: string;
  valueProposition?: string;

  // ISMS Information
  ismsScope?: string;
  ismsPolicy?: string;
  ismsObjectives?: string[];
  productsServicesInScope?: string[];
  departmentsInScope?: string[];
  locationsInScope?: string[];
  processesInScope?: string[];
  systemsInScope?: string[];
  scopeExclusions?: string;
  exclusionJustification?: string;
  scopeBoundaries?: string;

  // ISO Certification
  isoCertificationStatus: string;
  certificationBody?: string;
  certificationDate?: string;
  certificationExpiry?: string;
  certificateNumber?: string;
  nextAuditDate?: string;

  // Risk Management
  riskAppetite?: string;
  riskTolerance?: Record<string, unknown>;

  // Digital Transformation
  digitalTransformationStage?: string;
  technologyAdoptionRate?: number;
  innovationFocus?: string[];

  // Sustainability
  sustainabilityGoals?: string[];
  esgRating?: string;

}

export interface BusinessProcess {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  name: string;
  processCode: string;
  description?: string;

  // Classification
  processType: string;
  criticalityLevel: string;

  // Ownership
  processOwnerId?: string;
  processOwner?: UserBasic;
  processManagerId?: string;
  processManager?: UserBasic;
  departmentId?: string;
  department?: { id: string; name: string; departmentCode: string };

  // Process Details
  inputs?: string[];
  outputs?: string[];
  keyActivities?: string[];
  stakeholders?: string[];
  kpis?: Array<{ name: string; target?: string; actual?: string }>;

  // Performance
  cycleTimeHours?: number;
  frequency?: string;
  automationLevel?: string;

  // Compliance and Risk
  complianceRequirements?: string[];
  riskRating?: string;

  // Review and Documentation
  lastReviewDate?: string;
  nextReviewDate?: string;
  sopReference?: string;
  processMapUrl?: string;
  documentation?: Array<{ name: string; url?: string; type?: string }>;
  improvementOpportunities?: string;

  // Status
  isActive: boolean;

  // BCP Fields
  bcpEnabled: boolean;
  bcpCriticality?: string;

  // Recovery Objectives
  recoveryTimeObjectiveMinutes?: number;
  recoveryPointObjectiveMinutes?: number;
  maximumTolerableDowntimeMinutes?: number;

  // Staffing
  minimumStaff?: number;
  backupOwnerId?: string;
  backupOwner?: UserBasic;

  // Operational Details
  operatingHours?: Record<string, string>;
  peakPeriods?: Record<string, string>;

  // Dependencies
  criticalRoles?: string[];
  requiredSkills?: string[];
  systemDependencies?: string[];
  supplierDependencies?: string[];

  // Recovery
  alternateProcesses?: string;
  workaroundProcedures?: string;
  manualProcedures?: string;
  recoveryStrategies?: string[];

  // Performance Metrics
  workRecoveryTimeMinutes?: number;
  minimumBusinessContinuityObjective?: string;
  volumeMetrics?: Record<string, number>;
  performanceIndicators?: Record<string, string>;
  seasonalVariations?: Record<string, string>;

  // Process Hierarchy
  parentProcessId?: string;
  parentProcess?: BusinessProcess;
  subProcesses?: BusinessProcess[];
  upstreamBias?: string;
  downstreamBias?: string;
}

export interface ExternalDependency {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  name: string;
  dependencyType: string;
  description: string;
  vendorWebsite?: string;

  // Risk Assessment
  criticalityLevel: string;
  businessImpact?: string;
  singlePointOfFailure: boolean;

  // Contract Information
  contractReference?: string;
  contractStart: string;
  contractEnd: string;
  annualCost?: string;
  paymentTerms?: string;

  // SLA
  slaDetails?: { availability?: string; responseTime?: string; resolutionTime?: string; penalties?: string };

  // Data Processing
  dataProcessed?: string[];
  dataLocation?: string;
  complianceCertifications?: string[];

  // Assessment
  lastAssessmentDate?: string;
  riskRating?: string;

  // Contact
  primaryContact?: string;
  contactEmail: string;
  contactPhone?: string;

  // Contingency
  alternativeProviders?: string[];
  exitStrategy?: string;
  dataRecoveryProcedure?: string;

  _count?: { departments: number; businessProcesses: number };
}

export interface Regulator {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  name: string;
  acronym?: string;
  regulatorType: string;
  jurisdiction: string;
  jurisdictionLevel: string;
  description?: string;

  // Contact
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;

  // Regulatory Framework
  keyRegulations?: string[];
  applicableStandards?: string[];

  // Registration
  registrationStatus: string;
  registrationNumber?: string;
  registrationDate?: string;
  renewalDate?: string;

  // Inspections
  lastInspectionDate?: string;
  nextInspectionDate?: string;

  // Reporting
  reportingFrequency?: string;
  lastReportDate?: string;
  nextReportDate?: string;

  // Compliance History
  penaltiesFines?: Array<{ date: string; amount: string; reason: string; status: string }>;
  complianceNotes?: string;

  // Status
  isActive: boolean;
}

export interface SecurityCommittee {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  name: string;
  committeeType: string;
  description?: string;

  // Governance
  chairId?: string;
  chair?: UserBasic;
  secretaryId?: string;
  secretary?: UserBasic;
  authorityLevel?: string;
  purpose?: string;
  mandate?: string;

  // Meeting Information
  meetingFrequency: string;
  nextMeetingDate?: string;

  // Status
  isActive: boolean;
  establishedDate: string;
  dissolvedDate?: string;

  // Relations
  memberships?: Array<{
    id: string;
    role: string;
    responsibilities?: string;
    votingRights?: boolean;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
    user?: UserBasic;
  }>;
  meetings?: CommitteeMeeting[];
  _count?: { memberships: number; meetings: number };
}

export interface CommitteeMeeting {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  committeeId: string;
  committee: { id: string; name: string; committeeType: string };
  meetingNumber?: string;
  title: string;
  meetingType: string;

  // Scheduling
  meetingDate: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;

  // Location
  locationType?: string;
  physicalLocation?: string;
  virtualMeetingLink?: string;
  virtualMeetingId?: string;

  // Content
  agenda?: string;
  objectives?: string;
  minutes?: string;

  // Participants
  chairId?: string;
  chair?: UserBasic;
  secretaryId?: string;
  secretary?: UserBasic;
  expectedAttendeesCount?: number;
  actualAttendeesCount?: number;

  // Status
  status: string;
  quorumAchieved?: boolean;
  quorumRequirement?: number;

  // Follow-up
  followUpRequired?: boolean;
  nextMeetingScheduled?: boolean;

  // Attachments
  attachments?: Array<{ name: string; url: string; type?: string }>;

  // Cancellation
  cancellationReason?: string;
  postponedToDate?: string;

  _count?: { attendances: number; decisions: number; actionItems: number };
}

export interface MeetingActionItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  meetingId: string;
  meeting: { id: string; title: string; meetingDate: string; committee: { id: string; name: string } };
  actionNumber?: string;
  title: string;
  description: string;

  // Assignment
  assignedToId?: string;
  assignedTo?: UserBasic;
  assignedById?: string;
  assignedBy?: UserBasic;

  // Priority & Timing
  priority: string;
  dueDate: string;
  estimatedHours?: number;

  // Status
  status: string;
  completionDate?: string;
  completionNotes?: string;

  // Progress
  progressPercentage: number;
  lastUpdateNotes?: string;

  // Dependencies
  dependsOnId?: string;
  blockingReason?: string;

  // Follow-up
  requiresCommitteeReview?: boolean;
  reviewed?: boolean;
  reviewDate?: string;
}

export interface ExecutivePosition {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  title: string;
  executiveLevel: string;
  personId?: string;
  person?: UserBasic;

  // Hierarchy
  reportsToId?: string;
  reportsTo?: ExecutivePosition;
  subordinates?: ExecutivePosition[];

  // Authority and Responsibilities
  authorityLevel?: string;
  securityResponsibilities?: string;
  riskAuthorityLevel?: string;
  budgetAuthority?: boolean;

  // Status
  isActive: boolean;
  isCeo: boolean;
  isSecurityCommitteeMember?: boolean;

  // Dates
  startDate: string;
  endDate?: string;

  // Aliases for frontend compatibility
  positionLevel?: string;
  holder?: UserBasic;
  responsibilities?: string;
  appointmentDate?: string;
}

export interface DashboardOverview {
  departments: number;
  users: number;
  processes: number;
  dependencies: number;
  committees: number;
  regulators: number;
  locations: number;
  products: number;
  platforms: number;
  contextIssues: number;
  companyName: string;
}

export interface DashboardInsight {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  link?: string;
}

export interface DashboardInsightsResponse {
  count: number;
  insights: DashboardInsight[];
}

// API Functions - Dashboard
export async function getDashboardOverview() {
  return request<DashboardOverview>('/api/organisation/dashboard/overview');
}

export async function getDashboardInsights() {
  return request<DashboardInsightsResponse>('/api/organisation/dashboard/insights');
}

export async function getDepartmentSummary() {
  return request<{
    total: number;
    active: number;
    totalHeadcount: number;
    totalBudget: string;
    byCriticality: Record<string, number>;
  }>('/api/organisation/dashboard/department-summary');
}

// API Functions - Departments
export async function getDepartments(params?: { skip?: number; take?: number; isActive?: boolean; criticalityLevel?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  if (params?.criticalityLevel) searchParams.set('criticalityLevel', params.criticalityLevel);
  const query = searchParams.toString();
  return request<PaginatedResponse<Department>>(`/api/organisation/departments${query ? `?${query}` : ''}`);
}

export async function getDepartment(id: string) {
  return request<Department>(`/api/organisation/departments/${id}`);
}

export async function getDepartmentHierarchy() {
  return request<Department[]>('/api/organisation/departments/hierarchy');
}

export interface CreateDepartmentDto {
  name: string;
  departmentCode: string;
  description?: string;
  parentId?: string;
  departmentCategory?: string;
  functionType?: string;
  criticalityLevel?: string;
  departmentHeadId?: string;
  deputyHeadId?: string;
  headcount?: number;
  contractorCount?: number;
  keyResponsibilities?: string[];
  regulatoryObligations?: string[];
  externalInterfaces?: string[];
  costCenter?: string;
  budget?: number;
  budgetCurrency?: string;
  location?: string;
  floorPlanReference?: string;
  businessHours?: Record<string, string>;
  contactEmail?: string;
  contactPhone?: string;
  emergencyContact?: Record<string, string>;
  isActive?: boolean;
  establishedDate?: string;
  handlesPersonalData?: boolean;
  handlesFinancialData?: boolean;
}

export async function createDepartment(data: CreateDepartmentDto) {
  return request<Department>('/api/organisation/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(id: string, data: Partial<CreateDepartmentDto>) {
  return request<Department>(`/api/organisation/departments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: string) {
  return request<void>(`/api/organisation/departments/${id}`, {
    method: 'DELETE',
  });
}

// API Functions - Locations
export async function getLocations(params?: { skip?: number; take?: number; country?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.country) searchParams.set('country', params.country);
  const query = searchParams.toString();
  return request<PaginatedResponse<Location>>(`/api/organisation/locations${query ? `?${query}` : ''}`);
}

export async function getLocation(id: string) {
  return request<Location>(`/api/organisation/locations/${id}`);
}

export interface CreateLocationDto {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  locationType?: string;
  isHeadquarters?: boolean;
  isActive?: boolean;
}

export async function createLocation(data: CreateLocationDto) {
  return request<Location>('/api/organisation/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLocation(id: string, data: Partial<CreateLocationDto>) {
  return request<Location>(`/api/organisation/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(id: string) {
  return request<void>(`/api/organisation/locations/${id}`, {
    method: 'DELETE',
  });
}

// API Functions - Business Processes
export async function getBusinessProcesses(params?: { skip?: number; take?: number; processType?: string; criticalityLevel?: string; bcpEnabled?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.processType) searchParams.set('processType', params.processType);
  if (params?.criticalityLevel) searchParams.set('criticalityLevel', params.criticalityLevel);
  if (params?.bcpEnabled !== undefined) searchParams.set('bcpEnabled', String(params.bcpEnabled));
  const query = searchParams.toString();
  return request<PaginatedResponse<BusinessProcess>>(`/api/organisation/processes${query ? `?${query}` : ''}`);
}

export async function getBusinessProcess(id: string) {
  return request<BusinessProcess>(`/api/organisation/processes/${id}`);
}

export async function getProcessMetrics() {
  return request<{ total: number; active: number; bcpEnabled: number; byCriticality: Record<string, number> }>('/api/organisation/processes/metrics');
}

// API Functions - External Dependencies
export async function getExternalDependencies(params?: { skip?: number; take?: number; dependencyType?: string; criticalityLevel?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.dependencyType) searchParams.set('dependencyType', params.dependencyType);
  if (params?.criticalityLevel) searchParams.set('criticalityLevel', params.criticalityLevel);
  const query = searchParams.toString();
  return request<PaginatedResponse<ExternalDependency>>(`/api/organisation/dependencies${query ? `?${query}` : ''}`);
}

export async function getExternalDependency(id: string) {
  return request<ExternalDependency>(`/api/organisation/dependencies/${id}`);
}

export async function getDependencyRiskAssessment() {
  return request<{ total: number; singlePointOfFailure: number; byCriticality: Record<string, number>; byType: Record<string, number> }>('/api/organisation/dependencies/risk-assessment');
}

// API Functions - Regulators
export async function getRegulators(params?: { skip?: number; take?: number; regulatorType?: string; isActive?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.regulatorType) searchParams.set('regulatorType', params.regulatorType);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  const query = searchParams.toString();
  return request<PaginatedResponse<Regulator>>(`/api/organisation/regulators${query ? `?${query}` : ''}`);
}

export async function getRegulator(id: string) {
  return request<Regulator>(`/api/organisation/regulators/${id}`);
}

export async function getComplianceDashboard() {
  return request<{ total: number; byType: Record<string, number>; byStatus: Record<string, number>; upcomingInspections: Array<{ id: string; name: string; acronym?: string; nextInspectionDate: string }> }>('/api/organisation/regulators/compliance-dashboard');
}

// API Functions - Security Committees
export async function getSecurityCommittees(params?: { skip?: number; take?: number; committeeType?: string; isActive?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.committeeType) searchParams.set('committeeType', params.committeeType);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  const query = searchParams.toString();
  return request<PaginatedResponse<SecurityCommittee>>(`/api/organisation/security-committees${query ? `?${query}` : ''}`);
}

export async function getSecurityCommittee(id: string) {
  return request<SecurityCommittee>(`/api/organisation/security-committees/${id}`);
}

// API Functions - Committee Meetings
export async function getCommitteeMeetings(params?: { skip?: number; take?: number; committeeId?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.committeeId) searchParams.set('committeeId', params.committeeId);
  if (params?.status) searchParams.set('status', params.status);
  const query = searchParams.toString();
  return request<PaginatedResponse<CommitteeMeeting>>(`/api/organisation/committee-meetings${query ? `?${query}` : ''}`);
}

export async function getCommitteeMeeting(id: string) {
  return request<CommitteeMeeting>(`/api/organisation/committee-meetings/${id}`);
}

export async function getUpcomingMeetings(days?: number) {
  const query = days ? `?days=${days}` : '';
  return request<CommitteeMeeting[]>(`/api/organisation/committee-meetings/upcoming${query}`);
}

// API Functions - Action Items
export async function getMeetingActionItems(params?: { skip?: number; take?: number; status?: string; priority?: string; assignedToId?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.assignedToId) searchParams.set('assignedToId', params.assignedToId);
  const query = searchParams.toString();
  return request<PaginatedResponse<MeetingActionItem>>(`/api/organisation/meeting-action-items${query ? `?${query}` : ''}`);
}

export async function getMeetingActionItem(id: string) {
  return request<MeetingActionItem>(`/api/organisation/meeting-action-items/${id}`);
}

export async function getActionItemsSummary() {
  return request<{ total: number; open: number; inProgress: number; completed: number; overdue: number; byPriority: Record<string, number> }>('/api/organisation/meeting-action-items/summary');
}

export async function getOverdueActionItems() {
  return request<MeetingActionItem[]>('/api/organisation/meeting-action-items/overdue');
}

// API Functions - Executive Positions
export async function getExecutivePositions(params?: { skip?: number; take?: number; isActive?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  const query = searchParams.toString();
  return request<PaginatedResponse<ExecutivePosition>>(`/api/organisation/executive-positions${query ? `?${query}` : ''}`);
}

export async function getExecutivePosition(id: string) {
  return request<ExecutivePosition>(`/api/organisation/executive-positions/${id}`);
}

export async function getOrgChart() {
  return request<ExecutivePosition[]>('/api/organisation/executive-positions/org-chart');
}

// API Functions - Organisation Profile
export async function getOrganisationProfiles() {
  return request<PaginatedResponse<OrganisationProfile>>('/api/organisation/profiles');
}

export async function getOrganisationProfile(id: string) {
  return request<OrganisationProfile>(`/api/organisation/profiles/${id}`);
}

export async function updateOrganisationProfile(id: string, data: Partial<OrganisationProfile>) {
  return request<OrganisationProfile>(`/api/organisation/profiles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getProfileDashboardSummary() {
  return request<OrganisationProfile | null>('/api/organisation/profiles/dashboard-summary');
}

// ============================================
// NEW ENTITIES FROM WORKBOOK ALIGNMENT
// ============================================

// Products & Services
export interface ProductService {
  id: string;
  productCode: string;
  name: string;
  productType: string;
  description?: string;
  category?: string;
  customerFacing: boolean;
  internalOnly: boolean;
  revenueContribution?: string;
  pricingModel?: string;
  targetMarket?: string;
  lifecycleStage?: string;
  launchDate?: string;
  sunsetDate?: string;
  productOwnerId?: string;
  departmentId?: string;
  dataClassification?: string;
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  complianceRequirements?: string[];
  inIsmsScope: boolean;
  scopeJustification?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getProductsServices() {
  return request<PaginatedResponse<ProductService>>('/api/organisation/products-services');
}

export async function getProductService(id: string) {
  return request<ProductService>(`/api/organisation/products-services/${id}`);
}

export async function createProductService(data: Partial<ProductService>) {
  return request<ProductService>('/api/organisation/products-services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProductService(id: string, data: Partial<ProductService>) {
  return request<ProductService>(`/api/organisation/products-services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProductService(id: string) {
  return request<void>(`/api/organisation/products-services/${id}`, {
    method: 'DELETE',
  });
}

// Technology Platforms
export interface TechnologyPlatform {
  id: string;
  platformCode: string;
  name: string;
  platformType: string;
  description?: string;
  vendor?: string;
  vendorWebsite?: string;
  supportContact?: string;
  licenseType?: string;
  hostingLocation?: string;
  cloudProvider?: string;
  deploymentModel?: string;
  version?: string;
  architecture?: string;
  integrations?: string[];
  dataStorageLocation?: string;
  criticalityLevel?: string;
  businessImpact?: string;
  riskRating?: string;
  implementationDate?: string;
  endOfLifeDate?: string;
  lastUpgradeDate?: string;
  nextUpgradeDate?: string;
  technicalOwnerId?: string;
  businessOwnerId?: string;
  departmentId?: string;
  complianceCertifications?: string[];
  dataClassification?: string;
  inIsmsScope: boolean;
  scopeJustification?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getTechnologyPlatforms() {
  return request<PaginatedResponse<TechnologyPlatform>>('/api/organisation/technology-platforms');
}

export async function getTechnologyPlatform(id: string) {
  return request<TechnologyPlatform>(`/api/organisation/technology-platforms/${id}`);
}

export async function createTechnologyPlatform(data: Partial<TechnologyPlatform>) {
  return request<TechnologyPlatform>('/api/organisation/technology-platforms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTechnologyPlatform(id: string, data: Partial<TechnologyPlatform>) {
  return request<TechnologyPlatform>(`/api/organisation/technology-platforms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTechnologyPlatform(id: string) {
  return request<void>(`/api/organisation/technology-platforms/${id}`, {
    method: 'DELETE',
  });
}

// Interested Parties (ISO 27001 Clause 4.2)
export interface InterestedParty {
  id: string;
  partyCode: string;
  name: string;
  partyType: string;
  description?: string;
  expectations?: string;
  requirements?: string;
  informationNeeds?: string[];
  powerLevel?: string;
  interestLevel?: string;
  influenceLevel?: string;
  engagementStrategy?: string;
  communicationMethod?: string;
  communicationFrequency?: string;
  primaryContact?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  ismsRelevance?: string;
  securityExpectations?: string;
  relationshipStatus?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getInterestedParties() {
  return request<PaginatedResponse<InterestedParty>>('/api/organisation/interested-parties');
}

export async function getInterestedParty(id: string) {
  return request<InterestedParty>(`/api/organisation/interested-parties/${id}`);
}

export async function createInterestedParty(data: Partial<InterestedParty>) {
  return request<InterestedParty>('/api/organisation/interested-parties', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInterestedParty(id: string, data: Partial<InterestedParty>) {
  return request<InterestedParty>(`/api/organisation/interested-parties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInterestedParty(id: string) {
  return request<void>(`/api/organisation/interested-parties/${id}`, {
    method: 'DELETE',
  });
}

// Context Issues (ISO 27001 Clause 4.1)
export interface ContextIssue {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information (ISO 27001 Clause 4.1)
  issueCode: string;
  issueType: string;
  category: string;
  title: string;
  description?: string;

  // Impact Assessment
  impactType?: string;
  impactLevel?: string;
  likelihood?: string;

  // ISMS Relevance
  ismsRelevance?: string;
  affectedAreas?: string[];
  controlImplications?: string;

  // Response
  responseStrategy?: string;
  mitigationActions?: string[];
  responsiblePartyId?: string;
  responsibleParty?: UserBasic;

  // Monitoring
  monitoringFrequency?: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
  trendDirection?: string;

  // Status
  status: string;
  isActive: boolean;

  // Risk Escalation
  escalatedToRisk?: boolean;
  linkedRiskId?: string;
}

export async function getContextIssues() {
  return request<PaginatedResponse<ContextIssue>>('/api/organisation/context-issues');
}

export async function getContextIssue(id: string) {
  return request<ContextIssue>(`/api/organisation/context-issues/${id}`);
}

export async function createContextIssue(data: Partial<ContextIssue>) {
  return request<ContextIssue>('/api/organisation/context-issues', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContextIssue(id: string, data: Partial<ContextIssue>) {
  return request<ContextIssue>(`/api/organisation/context-issues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContextIssue(id: string) {
  return request<void>(`/api/organisation/context-issues/${id}`, {
    method: 'DELETE',
  });
}

// Missing API functions for detail pages
export async function updateExecutivePosition(id: string, data: Partial<ExecutivePosition>) {
  return request<ExecutivePosition>(`/api/organisation/executive-positions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExecutivePosition(id: string) {
  return request<void>(`/api/organisation/executive-positions/${id}`, {
    method: 'DELETE',
  });
}

export async function updateExternalDependency(id: string, data: Partial<ExternalDependency>) {
  return request<ExternalDependency>(`/api/organisation/dependencies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExternalDependency(id: string) {
  return request<void>(`/api/organisation/dependencies/${id}`, {
    method: 'DELETE',
  });
}

export async function updateRegulator(id: string, data: Partial<Regulator>) {
  return request<Regulator>(`/api/organisation/regulators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRegulator(id: string) {
  return request<void>(`/api/organisation/regulators/${id}`, {
    method: 'DELETE',
  });
}

export interface SecurityChampion {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  userId: string;
  user?: UserBasic;
  departmentId: string;
  department?: { id: string; name: string; departmentCode: string };
  championLevel: string;

  // Responsibilities
  responsibilities?: string;
  trainingCompleted: boolean;
  lastTrainingDate?: string;

  // Status
  isActive: boolean;
  startDate: string;
  endDate?: string;

  // Extended fields for frontend compatibility
  championRole?: string;
  focusArea?: string;
  certifications?: string;
  certificationLevel?: string;
  specializations?: string[];
  appointmentDate?: string;
}

export async function getSecurityChampion(id: string) {
  return request<SecurityChampion>(`/api/organisation/security-champions/${id}`);
}

export async function updateSecurityChampion(id: string, data: Partial<SecurityChampion>) {
  return request<SecurityChampion>(`/api/organisation/security-champions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSecurityChampion(id: string) {
  return request<void>(`/api/organisation/security-champions/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// KEY PERSONNEL - 100% Coverage
// ============================================

export interface KeyPersonnel {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  personCode: string;
  userId?: string;
  user?: UserBasic;

  // If no user account, store name directly
  name: string;
  jobTitle: string;
  email?: string;
  phone?: string;

  // Department
  departmentId?: string;
  department?: Department;

  // ISMS Role
  ismsRole: string;
  securityResponsibilities?: string;
  authorityLevel?: string;

  // Backup
  backupPersonId?: string;
  backupPerson?: KeyPersonnel;

  // Training
  trainingCompleted: boolean;
  lastTrainingDate?: string;
  certifications?: string[];

  // Status
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export async function getKeyPersonnel(params?: { skip?: number; take?: number; ismsRole?: string; isActive?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.ismsRole) searchParams.set('ismsRole', params.ismsRole);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  const query = searchParams.toString();
  return request<PaginatedResponse<KeyPersonnel>>(`/api/organisation/key-personnel${query ? `?${query}` : ''}`);
}

export async function getKeyPerson(id: string) {
  return request<KeyPersonnel>(`/api/organisation/key-personnel/${id}`);
}

export async function createKeyPersonnel(data: Partial<KeyPersonnel>) {
  return request<KeyPersonnel>('/api/organisation/key-personnel', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateKeyPersonnel(id: string, data: Partial<KeyPersonnel>) {
  return request<KeyPersonnel>(`/api/organisation/key-personnel/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteKeyPersonnel(id: string) {
  return request<void>(`/api/organisation/key-personnel/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// APPLICABLE FRAMEWORK - 100% Coverage
// ============================================

export interface ApplicableFramework {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Framework Information
  frameworkCode: string;
  name: string;
  frameworkType: string;
  description?: string;
  version?: string;

  // Applicability
  isApplicable: boolean;
  applicabilityReason?: string;
  applicabilityDate?: string;
  assessedById?: string;
  assessedBy?: UserBasic;

  // Compliance Status
  complianceStatus: string;
  compliancePercentage?: number;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;

  // Supervisory Authority
  supervisoryAuthority?: string;
  authorityContact?: string;
  registrationNumber?: string;
  registrationDate?: string;

  // Certification (if applicable)
  isCertifiable: boolean;
  certificationStatus?: string;
  certificationBody?: string;
  certificateNumber?: string;
  certificationDate?: string;
  certificationExpiry?: string;

  // Requirements
  keyRequirements?: string[];
  applicableControls?: string[];

  // Notes
  notes?: string;
}

export async function getApplicableFrameworks(params?: { skip?: number; take?: number; frameworkType?: string; isApplicable?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.frameworkType) searchParams.set('frameworkType', params.frameworkType);
  if (params?.isApplicable !== undefined) searchParams.set('isApplicable', String(params.isApplicable));
  const query = searchParams.toString();
  return request<PaginatedResponse<ApplicableFramework>>(`/api/organisation/applicable-frameworks${query ? `?${query}` : ''}`);
}

export async function getApplicableFramework(id: string) {
  return request<ApplicableFramework>(`/api/organisation/applicable-frameworks/${id}`);
}

export async function createApplicableFramework(data: Partial<ApplicableFramework>) {
  return request<ApplicableFramework>('/api/organisation/applicable-frameworks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateApplicableFramework(id: string, data: Partial<ApplicableFramework>) {
  return request<ApplicableFramework>(`/api/organisation/applicable-frameworks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteApplicableFramework(id: string) {
  return request<void>(`/api/organisation/applicable-frameworks/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// REGULATORY ELIGIBILITY SURVEY - 100% Coverage
// ============================================

export interface RegulatoryEligibilitySurvey {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Survey Info
  surveyType: string;
  surveyVersion: string;

  // Status
  status: string;
  completedAt?: string;

  // Result
  isApplicable?: boolean;
  applicabilityReason?: string;
  entityClassification?: string;
  regulatoryRegime?: string;

  // Notes
  notes?: string;

  // Relations
  responses?: SurveyResponse[];
}

export interface SurveyQuestion {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Question Info
  surveyType: string;
  stepNumber: string;
  stepCategory: string;
  questionText: string;

  // Logic
  ifYes?: string;
  ifNo?: string;
  legalReference?: string;
  notes?: string;

  // Ordering
  sortOrder: number;
}

export interface SurveyResponse {
  id: string;
  createdAt: string;
  updatedAt: string;

  surveyId: string;
  questionId: string;

  // Response
  answer?: string;
  notes?: string;
}

export async function getRegulatoryEligibilitySurveys(params?: { skip?: number; take?: number; surveyType?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.surveyType) searchParams.set('surveyType', params.surveyType);
  if (params?.status) searchParams.set('status', params.status);
  const query = searchParams.toString();
  return request<PaginatedResponse<RegulatoryEligibilitySurvey>>(`/api/organisation/regulatory-surveys${query ? `?${query}` : ''}`);
}

export async function getRegulatoryEligibilitySurvey(id: string) {
  return request<RegulatoryEligibilitySurvey>(`/api/organisation/regulatory-surveys/${id}`);
}

export async function getSurveyQuestions(surveyType: string) {
  return request<SurveyQuestion[]>(`/api/organisation/survey-questions?surveyType=${surveyType}`);
}

// ============================================
// ORGANISATIONAL UNIT - 100% Coverage
// ============================================

export interface OrganisationalUnit {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  name: string;
  unitType: string;
  description?: string;
  code: string;

  // Hierarchy
  parentId?: string;
  parent?: OrganisationalUnit;
  children?: OrganisationalUnit[];

  // Leadership
  headId?: string;
  head?: UserBasic;

  // Financial
  budget?: string;
  budgetCurrency: string;
  costCenter?: string;

  // Status
  isActive: boolean;
  establishedDate?: string;
}

// ============================================
// MEETING ATTENDANCE - 100% Coverage
// ============================================

export interface MeetingAttendance {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  meetingId: string;
  memberId: string;
  member?: UserBasic;
  membershipId?: string;

  // Attendance Details
  attendanceStatus: string;
  arrivalTime?: string;
  departureTime?: string;

  // Participation
  participatedInVoting: boolean;
  contributedToDiscussion: boolean;

  // Notes
  absenceReason?: string;
  notes?: string;

  // Proxy
  proxyAttendeeId?: string;
  proxyAttendee?: UserBasic;
}

// ============================================
// MEETING DECISION - 100% Coverage
// ============================================

export interface MeetingDecision {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  meetingId: string;
  decisionNumber?: string;
  title: string;
  description: string;

  // Decision Details
  decisionType: string;
  rationale?: string;

  // Voting
  voteType: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;

  // Implementation
  responsiblePartyId?: string;
  responsibleParty?: UserBasic;
  effectiveDate?: string;
  reviewDate?: string;
  implementationDeadline?: string;

  // Status
  implemented: boolean;
  implementationDate?: string;
  implementationNotes?: string;

  // References
  relatedDocuments?: Array<{ name: string; url: string }>;
}

// ============================================
// DEPARTMENT MEMBER - 100% Coverage
// ============================================

export interface DepartmentMember {
  id: string;
  departmentId: string;
  userId: string;
  createdAt: string;
  department?: Department;
  user?: UserBasic;
}

// ============================================
// COMMITTEE MEMBERSHIP - 100% Coverage
// ============================================

export interface CommitteeMembership {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;

  // Basic Information
  userId: string;
  user?: UserBasic;
  committeeId: string;
  committee?: SecurityCommittee;
  role: string;

  // Responsibilities
  responsibilities?: string;
  votingRights: boolean;

  // Status
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

// ============================================
// API Functions - Organisational Units
// ============================================

export async function getOrganisationalUnits(params?: { skip?: number; take?: number; unitType?: string; isActive?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.unitType) searchParams.set('unitType', params.unitType);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  const query = searchParams.toString();
  return request<PaginatedResponse<OrganisationalUnit>>(`/api/organisation/organisational-units${query ? `?${query}` : ''}`);
}

export async function getOrganisationalUnit(id: string) {
  return request<OrganisationalUnit>(`/api/organisation/organisational-units/${id}`);
}

export async function createOrganisationalUnit(data: Partial<OrganisationalUnit>) {
  return request<OrganisationalUnit>('/api/organisation/organisational-units', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrganisationalUnit(id: string, data: Partial<OrganisationalUnit>) {
  return request<OrganisationalUnit>(`/api/organisation/organisational-units/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteOrganisationalUnit(id: string) {
  return request<void>(`/api/organisation/organisational-units/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// API Functions - Meeting Attendance
// ============================================

export async function getMeetingAttendances(params?: { skip?: number; take?: number; meetingId?: string; attendanceStatus?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params?.take !== undefined) searchParams.set('take', String(params.take));
  if (params?.meetingId) searchParams.set('meetingId', params.meetingId);
  if (params?.attendanceStatus) searchParams.set('attendanceStatus', params.attendanceStatus);
  const query = searchParams.toString();
  return request<PaginatedResponse<MeetingAttendance>>(`/api/organisation/meeting-attendances${query ? `?${query}` : ''}`);
}

export async function getMeetingAttendance(id: string) {
  return request<MeetingAttendance>(`/api/organisation/meeting-attendances/${id}`);
}
