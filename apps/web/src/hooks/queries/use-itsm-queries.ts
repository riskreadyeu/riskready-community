import { useQuery } from '@tanstack/react-query';
import {
  getAssets,
  getAsset,
  getAssetSummary,
  getAssetImpact,
  getAssetRelationships,
  getAssetRisksByAsset,
  getAssetVulnerabilities,
  getChanges,
  getChange,
  getChangeSummary,
  getChangeHistory,
  getChangeCalendar,
  getCabDashboard,
  getChangeTemplates,
  getChangeTemplate,
  getCapacityPlans,
  getCapacityPlan,
  getCapacitySummary,
  getCapacityHistory,
  getAssetsAtRisk,
  getITSMDashboard,
  getPendingApprovals,
  getApprovalsByChange,
  getDataQuality,
  type AssetType,
  type AssetStatus,
  type BusinessCriticality,
  type CapacityStatus,
  type ChangeStatus,
  type ITSMChangeType,
  type ChangeCategory,
  type ChangePriority,
  type SecurityImpact,
} from '@/lib/itsm-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  summary: () => [...assetKeys.all, 'summary'] as const,
  impact: (id: string) => [...assetKeys.detail(id), 'impact'] as const,
  relationships: (id: string, direction?: string) => [...assetKeys.detail(id), 'relationships', direction] as const,
  risks: (id: string) => [...assetKeys.detail(id), 'risks'] as const,
  vulnerabilities: (id: string) => [...assetKeys.detail(id), 'vulnerabilities'] as const,
  dataQuality: () => [...assetKeys.all, 'dataQuality'] as const,
};

export const changeKeys = {
  all: ['changes'] as const,
  lists: () => [...changeKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...changeKeys.lists(), params] as const,
  details: () => [...changeKeys.all, 'detail'] as const,
  detail: (id: string) => [...changeKeys.details(), id] as const,
  summary: () => [...changeKeys.all, 'summary'] as const,
  history: (id: string) => [...changeKeys.detail(id), 'history'] as const,
  calendar: (startDate?: string, endDate?: string) => [...changeKeys.all, 'calendar', startDate, endDate] as const,
  cabDashboard: () => [...changeKeys.all, 'cabDashboard'] as const,
  approvals: (changeId: string) => [...changeKeys.detail(changeId), 'approvals'] as const,
  pendingApprovals: () => [...changeKeys.all, 'pendingApprovals'] as const,
};

export const changeTemplateKeys = {
  all: ['changeTemplates'] as const,
  lists: () => [...changeTemplateKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...changeTemplateKeys.lists(), params] as const,
  details: () => [...changeTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...changeTemplateKeys.details(), id] as const,
};

export const capacityKeys = {
  all: ['capacity'] as const,
  summary: () => [...capacityKeys.all, 'summary'] as const,
  atRisk: () => [...capacityKeys.all, 'atRisk'] as const,
  history: (assetId: string, days?: number) => [...capacityKeys.all, 'history', assetId, days] as const,
  plans: () => [...capacityKeys.all, 'plans'] as const,
  planList: (params: Record<string, unknown>) => [...capacityKeys.plans(), 'list', params] as const,
  planDetail: (id: string) => [...capacityKeys.plans(), 'detail', id] as const,
};

export const itsmKeys = {
  dashboard: () => ['itsm', 'dashboard'] as const,
};

// ---------------------------------------------------------------------------
// Asset hooks
// ---------------------------------------------------------------------------

export function useAssets(params?: {
  skip?: number;
  take?: number;
  assetType?: AssetType;
  status?: AssetStatus;
  businessCriticality?: BusinessCriticality;
  capacityStatus?: CapacityStatus;
  search?: string;
  departmentId?: string;
  locationId?: string;
  ownerId?: string;
}) {
  return useQuery({
    queryKey: assetKeys.list(params ?? {}),
    queryFn: () => getAssets(params),
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => getAsset(id),
    enabled: !!id,
  });
}

export function useAssetSummary() {
  return useQuery({
    queryKey: assetKeys.summary(),
    queryFn: () => getAssetSummary(),
  });
}

export function useAssetImpact(id: string) {
  return useQuery({
    queryKey: assetKeys.impact(id),
    queryFn: () => getAssetImpact(id),
    enabled: !!id,
  });
}

export function useAssetRelationships(assetId: string, direction?: 'outgoing' | 'incoming' | 'all') {
  return useQuery({
    queryKey: assetKeys.relationships(assetId, direction),
    queryFn: () => getAssetRelationships(assetId, direction),
    enabled: !!assetId,
  });
}

export function useAssetRisks(assetId: string) {
  return useQuery({
    queryKey: assetKeys.risks(assetId),
    queryFn: () => getAssetRisksByAsset(assetId),
    enabled: !!assetId,
  });
}

export function useAssetVulnerabilities(assetId: string) {
  return useQuery({
    queryKey: assetKeys.vulnerabilities(assetId),
    queryFn: () => getAssetVulnerabilities(assetId),
    enabled: !!assetId,
  });
}

export function useDataQuality() {
  return useQuery({
    queryKey: assetKeys.dataQuality(),
    queryFn: () => getDataQuality(),
  });
}

// ---------------------------------------------------------------------------
// Change hooks
// ---------------------------------------------------------------------------

export function useChanges(params?: {
  skip?: number;
  take?: number;
  status?: ChangeStatus;
  changeType?: ITSMChangeType;
  category?: ChangeCategory;
  priority?: ChangePriority;
  securityImpact?: SecurityImpact;
  requesterId?: string;
  departmentId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: changeKeys.list(params ?? {}),
    queryFn: () => getChanges(params),
  });
}

export function useChange(id: string) {
  return useQuery({
    queryKey: changeKeys.detail(id),
    queryFn: () => getChange(id),
    enabled: !!id,
  });
}

export function useChangeSummary() {
  return useQuery({
    queryKey: changeKeys.summary(),
    queryFn: () => getChangeSummary(),
  });
}

export function useChangeHistory(id: string) {
  return useQuery({
    queryKey: changeKeys.history(id),
    queryFn: () => getChangeHistory(id),
    enabled: !!id,
  });
}

export function useChangeCalendar(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: changeKeys.calendar(startDate, endDate),
    queryFn: () => getChangeCalendar(startDate, endDate),
  });
}

export function useCabDashboard() {
  return useQuery({
    queryKey: changeKeys.cabDashboard(),
    queryFn: () => getCabDashboard(),
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: changeKeys.pendingApprovals(),
    queryFn: () => getPendingApprovals(),
  });
}

export function useApprovalsByChange(changeId: string) {
  return useQuery({
    queryKey: changeKeys.approvals(changeId),
    queryFn: () => getApprovalsByChange(changeId),
    enabled: !!changeId,
  });
}

// ---------------------------------------------------------------------------
// Change template hooks
// ---------------------------------------------------------------------------

export function useChangeTemplates(params?: {
  skip?: number;
  take?: number;
  isActive?: boolean;
  category?: ChangeCategory;
  search?: string;
}) {
  return useQuery({
    queryKey: changeTemplateKeys.list(params ?? {}),
    queryFn: () => getChangeTemplates(params),
  });
}

export function useChangeTemplate(id: string) {
  return useQuery({
    queryKey: changeTemplateKeys.detail(id),
    queryFn: () => getChangeTemplate(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Capacity hooks
// ---------------------------------------------------------------------------

export function useCapacitySummary() {
  return useQuery({
    queryKey: capacityKeys.summary(),
    queryFn: () => getCapacitySummary(),
  });
}

export function useAssetsAtRisk() {
  return useQuery({
    queryKey: capacityKeys.atRisk(),
    queryFn: () => getAssetsAtRisk(),
  });
}

export function useCapacityHistory(assetId: string, days?: number) {
  return useQuery({
    queryKey: capacityKeys.history(assetId, days),
    queryFn: () => getCapacityHistory(assetId, days),
    enabled: !!assetId,
  });
}

export function useCapacityPlans(params?: { skip?: number; take?: number; status?: string; assetId?: string }) {
  return useQuery({
    queryKey: capacityKeys.planList(params ?? {}),
    queryFn: () => getCapacityPlans(params),
  });
}

export function useCapacityPlan(id: string) {
  return useQuery({
    queryKey: capacityKeys.planDetail(id),
    queryFn: () => getCapacityPlan(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Dashboard hook
// ---------------------------------------------------------------------------

export function useITSMDashboard() {
  return useQuery({
    queryKey: itsmKeys.dashboard(),
    queryFn: () => getITSMDashboard(),
  });
}
