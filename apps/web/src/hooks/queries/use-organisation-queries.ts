import { useQuery } from '@tanstack/react-query';
import {
  getDashboardOverview,
  getDashboardInsights,
  getDepartments,
  getDepartment,
  getDepartmentSummary,
  getLocations,
  getLocation,
  getBusinessProcesses,
  getBusinessProcess,
  getExternalDependencies,
  getExternalDependency,
  getSecurityCommittees,
  getSecurityCommittee,
  getCommitteeMeetings,
  getCommitteeMeeting,
  getExecutivePositions,
  getExecutivePosition,
  getOrganisationProfiles,
  getOrganisationProfile,
  getKeyPersonnel,
  getKeyPerson,
  getApplicableFrameworks,
  getApplicableFramework,
  getContextIssues,
  getContextIssue,
  getInterestedParties,
  getInterestedParty,
  getRegulators,
  getRegulator,
  getProductsServices,
  getProductService,
  getTechnologyPlatforms,
  getTechnologyPlatform,
  getMeetingActionItems,
  getOrganisationalUnits,
  getOrganisationalUnit,
} from '@/lib/organisation-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const orgKeys = {
  all: ['organisation'] as const,
  dashboard: () => [...orgKeys.all, 'dashboard'] as const,
  insights: () => [...orgKeys.all, 'insights'] as const,
  profiles: () => [...orgKeys.all, 'profiles'] as const,
  profile: (id: string) => [...orgKeys.profiles(), id] as const,

  departments: () => [...orgKeys.all, 'departments'] as const,
  departmentList: (params: Record<string, unknown>) => [...orgKeys.departments(), 'list', params] as const,
  department: (id: string) => [...orgKeys.departments(), id] as const,
  departmentSummary: () => [...orgKeys.departments(), 'summary'] as const,

  locations: () => [...orgKeys.all, 'locations'] as const,
  locationList: (params: Record<string, unknown>) => [...orgKeys.locations(), 'list', params] as const,
  location: (id: string) => [...orgKeys.locations(), id] as const,

  businessProcesses: () => [...orgKeys.all, 'businessProcesses'] as const,
  businessProcessList: (params: Record<string, unknown>) => [...orgKeys.businessProcesses(), 'list', params] as const,
  businessProcess: (id: string) => [...orgKeys.businessProcesses(), id] as const,

  externalDependencies: () => [...orgKeys.all, 'externalDependencies'] as const,
  externalDependencyList: (params: Record<string, unknown>) => [...orgKeys.externalDependencies(), 'list', params] as const,
  externalDependency: (id: string) => [...orgKeys.externalDependencies(), id] as const,

  committees: () => [...orgKeys.all, 'committees'] as const,
  committeeList: (params: Record<string, unknown>) => [...orgKeys.committees(), 'list', params] as const,
  committee: (id: string) => [...orgKeys.committees(), id] as const,

  meetings: () => [...orgKeys.all, 'meetings'] as const,
  meetingList: (params: Record<string, unknown>) => [...orgKeys.meetings(), 'list', params] as const,
  meeting: (id: string) => [...orgKeys.meetings(), id] as const,

  actionItems: () => [...orgKeys.all, 'actionItems'] as const,
  actionItemList: (params: Record<string, unknown>) => [...orgKeys.actionItems(), 'list', params] as const,

  executives: () => [...orgKeys.all, 'executives'] as const,
  executiveList: (params: Record<string, unknown>) => [...orgKeys.executives(), 'list', params] as const,
  executive: (id: string) => [...orgKeys.executives(), id] as const,

  keyPersonnel: () => [...orgKeys.all, 'keyPersonnel'] as const,
  keyPersonnelList: (params: Record<string, unknown>) => [...orgKeys.keyPersonnel(), 'list', params] as const,
  keyPerson: (id: string) => [...orgKeys.keyPersonnel(), id] as const,

  frameworks: () => [...orgKeys.all, 'frameworks'] as const,
  frameworkList: (params: Record<string, unknown>) => [...orgKeys.frameworks(), 'list', params] as const,
  framework: (id: string) => [...orgKeys.frameworks(), id] as const,

  contextIssues: () => [...orgKeys.all, 'contextIssues'] as const,
  contextIssue: (id: string) => [...orgKeys.contextIssues(), id] as const,

  interestedParties: () => [...orgKeys.all, 'interestedParties'] as const,
  interestedParty: (id: string) => [...orgKeys.interestedParties(), id] as const,

  regulators: () => [...orgKeys.all, 'regulators'] as const,
  regulatorList: (params: Record<string, unknown>) => [...orgKeys.regulators(), 'list', params] as const,
  regulator: (id: string) => [...orgKeys.regulators(), id] as const,

  productsServices: () => [...orgKeys.all, 'productsServices'] as const,
  productService: (id: string) => [...orgKeys.productsServices(), id] as const,

  technologyPlatforms: () => [...orgKeys.all, 'technologyPlatforms'] as const,
  technologyPlatform: (id: string) => [...orgKeys.technologyPlatforms(), id] as const,

  organisationalUnits: () => [...orgKeys.all, 'organisationalUnits'] as const,
  organisationalUnitList: (params: Record<string, unknown>) => [...orgKeys.organisationalUnits(), 'list', params] as const,
  organisationalUnit: (id: string) => [...orgKeys.organisationalUnits(), id] as const,
};

// ---------------------------------------------------------------------------
// Dashboard hooks
// ---------------------------------------------------------------------------

export function useOrgDashboard() {
  return useQuery({
    queryKey: orgKeys.dashboard(),
    queryFn: () => getDashboardOverview(),
  });
}

export function useOrgInsights() {
  return useQuery({
    queryKey: orgKeys.insights(),
    queryFn: () => getDashboardInsights(),
  });
}

// ---------------------------------------------------------------------------
// Department hooks
// ---------------------------------------------------------------------------

export function useDepartments(params?: { skip?: number; take?: number; isActive?: boolean; criticalityLevel?: string }) {
  return useQuery({
    queryKey: orgKeys.departmentList(params ?? {}),
    queryFn: () => getDepartments(params),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: orgKeys.department(id),
    queryFn: () => getDepartment(id),
    enabled: !!id,
  });
}

export function useDepartmentSummary() {
  return useQuery({
    queryKey: orgKeys.departmentSummary(),
    queryFn: () => getDepartmentSummary(),
  });
}

// ---------------------------------------------------------------------------
// Location hooks
// ---------------------------------------------------------------------------

export function useLocations(params?: { skip?: number; take?: number; country?: string }) {
  return useQuery({
    queryKey: orgKeys.locationList(params ?? {}),
    queryFn: () => getLocations(params),
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: orgKeys.location(id),
    queryFn: () => getLocation(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Business process hooks
// ---------------------------------------------------------------------------

export function useBusinessProcesses(params?: { skip?: number; take?: number; processType?: string; criticalityLevel?: string; bcpEnabled?: boolean }) {
  return useQuery({
    queryKey: orgKeys.businessProcessList(params ?? {}),
    queryFn: () => getBusinessProcesses(params),
  });
}

export function useBusinessProcess(id: string) {
  return useQuery({
    queryKey: orgKeys.businessProcess(id),
    queryFn: () => getBusinessProcess(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// External dependency hooks
// ---------------------------------------------------------------------------

export function useExternalDependencies(params?: { skip?: number; take?: number; dependencyType?: string; criticalityLevel?: string }) {
  return useQuery({
    queryKey: orgKeys.externalDependencyList(params ?? {}),
    queryFn: () => getExternalDependencies(params),
  });
}

export function useExternalDependency(id: string) {
  return useQuery({
    queryKey: orgKeys.externalDependency(id),
    queryFn: () => getExternalDependency(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Committee hooks
// ---------------------------------------------------------------------------

export function useSecurityCommittees(params?: { skip?: number; take?: number; committeeType?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: orgKeys.committeeList(params ?? {}),
    queryFn: () => getSecurityCommittees(params),
  });
}

export function useSecurityCommittee(id: string) {
  return useQuery({
    queryKey: orgKeys.committee(id),
    queryFn: () => getSecurityCommittee(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Meeting hooks
// ---------------------------------------------------------------------------

export function useCommitteeMeetings(params?: { skip?: number; take?: number; committeeId?: string; status?: string }) {
  return useQuery({
    queryKey: orgKeys.meetingList(params ?? {}),
    queryFn: () => getCommitteeMeetings(params),
  });
}

export function useCommitteeMeeting(id: string) {
  return useQuery({
    queryKey: orgKeys.meeting(id),
    queryFn: () => getCommitteeMeeting(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Meeting action items
// ---------------------------------------------------------------------------

export function useMeetingActionItems(params?: { skip?: number; take?: number; status?: string; priority?: string; assignedToId?: string }) {
  return useQuery({
    queryKey: orgKeys.actionItemList(params ?? {}),
    queryFn: () => getMeetingActionItems(params),
  });
}

// ---------------------------------------------------------------------------
// Executive hooks
// ---------------------------------------------------------------------------

export function useExecutivePositions(params?: { skip?: number; take?: number; isActive?: boolean }) {
  return useQuery({
    queryKey: orgKeys.executiveList(params ?? {}),
    queryFn: () => getExecutivePositions(params),
  });
}

export function useExecutivePosition(id: string) {
  return useQuery({
    queryKey: orgKeys.executive(id),
    queryFn: () => getExecutivePosition(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Organisation profile hooks
// ---------------------------------------------------------------------------

export function useOrganisationProfiles() {
  return useQuery({
    queryKey: orgKeys.profiles(),
    queryFn: () => getOrganisationProfiles(),
  });
}

export function useOrganisationProfile(id: string) {
  return useQuery({
    queryKey: orgKeys.profile(id),
    queryFn: () => getOrganisationProfile(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Key personnel hooks
// ---------------------------------------------------------------------------

export function useKeyPersonnel(params?: { skip?: number; take?: number; ismsRole?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: orgKeys.keyPersonnelList(params ?? {}),
    queryFn: () => getKeyPersonnel(params),
  });
}

export function useKeyPerson(id: string) {
  return useQuery({
    queryKey: orgKeys.keyPerson(id),
    queryFn: () => getKeyPerson(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Framework hooks
// ---------------------------------------------------------------------------

export function useApplicableFrameworks(params?: { skip?: number; take?: number; frameworkType?: string; isApplicable?: boolean }) {
  return useQuery({
    queryKey: orgKeys.frameworkList(params ?? {}),
    queryFn: () => getApplicableFrameworks(params),
  });
}

export function useApplicableFramework(id: string) {
  return useQuery({
    queryKey: orgKeys.framework(id),
    queryFn: () => getApplicableFramework(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Context issues hooks
// ---------------------------------------------------------------------------

export function useContextIssues() {
  return useQuery({
    queryKey: orgKeys.contextIssues(),
    queryFn: () => getContextIssues(),
  });
}

export function useContextIssue(id: string) {
  return useQuery({
    queryKey: orgKeys.contextIssue(id),
    queryFn: () => getContextIssue(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Interested parties hooks
// ---------------------------------------------------------------------------

export function useInterestedParties() {
  return useQuery({
    queryKey: orgKeys.interestedParties(),
    queryFn: () => getInterestedParties(),
  });
}

export function useInterestedParty(id: string) {
  return useQuery({
    queryKey: orgKeys.interestedParty(id),
    queryFn: () => getInterestedParty(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Regulator hooks
// ---------------------------------------------------------------------------

export function useRegulators(params?: { skip?: number; take?: number; regulatorType?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: orgKeys.regulatorList(params ?? {}),
    queryFn: () => getRegulators(params),
  });
}

export function useRegulator(id: string) {
  return useQuery({
    queryKey: orgKeys.regulator(id),
    queryFn: () => getRegulator(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Products & services hooks
// ---------------------------------------------------------------------------

export function useProductsServices() {
  return useQuery({
    queryKey: orgKeys.productsServices(),
    queryFn: () => getProductsServices(),
  });
}

export function useProductService(id: string) {
  return useQuery({
    queryKey: orgKeys.productService(id),
    queryFn: () => getProductService(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Technology platforms hooks
// ---------------------------------------------------------------------------

export function useTechnologyPlatforms() {
  return useQuery({
    queryKey: orgKeys.technologyPlatforms(),
    queryFn: () => getTechnologyPlatforms(),
  });
}

export function useTechnologyPlatform(id: string) {
  return useQuery({
    queryKey: orgKeys.technologyPlatform(id),
    queryFn: () => getTechnologyPlatform(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Organisational unit hooks
// ---------------------------------------------------------------------------

export function useOrganisationalUnits(params?: { skip?: number; take?: number; unitType?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: orgKeys.organisationalUnitList(params ?? {}),
    queryFn: () => getOrganisationalUnits(params),
  });
}

export function useOrganisationalUnit(id: string) {
  return useQuery({
    queryKey: orgKeys.organisationalUnit(id),
    queryFn: () => getOrganisationalUnit(id),
    enabled: !!id,
  });
}
