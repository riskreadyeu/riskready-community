import { useQuery } from '@tanstack/react-query';
import {
  getPolicies,
  getPolicy,
  getPolicyStats,
  getPolicyHierarchy,
  searchPolicies,
  getVersions,
  getReviews,
  getUpcomingReviews,
  getOverdueReviews,
  getReviewStats,
  getWorkflows,
  getCurrentWorkflow,
  getChangeRequests,
  getChangeRequest,
  getChangeRequestStats,
  getExceptions,
  getException,
  getExceptionStats,
  getExpiringExceptions,
  getAcknowledgments,
  getPendingAcknowledgments,
  getOverdueAcknowledgments,
  getAcknowledgmentStats,
  getControlMappings,
  getRiskMappings,
  getControlCoverageReport,
  getGapAnalysis,
  getDocumentRelations,
  getDashboardStats,
  getComplianceStatus,
  getActionsNeeded,
  getRecentActivity,
  getSections,
  getAttachments,
  getAttachmentStats,
  type DocumentType,
  type DocumentStatus,
} from '@/lib/policies-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const policyKeys = {
  all: ['policies'] as const,
  lists: () => [...policyKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...policyKeys.lists(), params] as const,
  details: () => [...policyKeys.all, 'detail'] as const,
  detail: (id: string) => [...policyKeys.details(), id] as const,
  stats: () => [...policyKeys.all, 'stats'] as const,
  hierarchy: () => [...policyKeys.all, 'hierarchy'] as const,
  dashboardStats: () => [...policyKeys.all, 'dashboardStats'] as const,
  complianceStatus: () => [...policyKeys.all, 'complianceStatus'] as const,
  actionsNeeded: () => [...policyKeys.all, 'actionsNeeded'] as const,
  recentActivity: (limit?: number) => [...policyKeys.all, 'recentActivity', limit] as const,
  versions: (documentId: string) => [...policyKeys.detail(documentId), 'versions'] as const,
  reviews: (documentId: string) => [...policyKeys.detail(documentId), 'reviews'] as const,
  workflows: (documentId: string) => [...policyKeys.detail(documentId), 'workflows'] as const,
  currentWorkflow: (documentId: string) => [...policyKeys.detail(documentId), 'currentWorkflow'] as const,
  controlMappings: (documentId: string) => [...policyKeys.detail(documentId), 'controlMappings'] as const,
  riskMappings: (documentId: string) => [...policyKeys.detail(documentId), 'riskMappings'] as const,
  relations: (documentId: string) => [...policyKeys.detail(documentId), 'relations'] as const,
  sections: (documentId: string) => [...policyKeys.detail(documentId), 'sections'] as const,
  attachments: (documentId: string) => [...policyKeys.detail(documentId), 'attachments'] as const,
  attachmentStats: (documentId: string) => [...policyKeys.detail(documentId), 'attachmentStats'] as const,
};

export const reviewKeys = {
  upcoming: (days?: number) => ['policyReviews', 'upcoming', days] as const,
  overdue: () => ['policyReviews', 'overdue'] as const,
  stats: () => ['policyReviews', 'stats'] as const,
};

export const changeRequestKeys = {
  all: ['policyChangeRequests'] as const,
  lists: () => [...changeRequestKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...changeRequestKeys.lists(), params] as const,
  details: () => [...changeRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...changeRequestKeys.details(), id] as const,
  stats: () => [...changeRequestKeys.all, 'stats'] as const,
};

export const exceptionKeys = {
  all: ['policyExceptions'] as const,
  lists: () => [...exceptionKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...exceptionKeys.lists(), params] as const,
  details: () => [...exceptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...exceptionKeys.details(), id] as const,
  stats: () => [...exceptionKeys.all, 'stats'] as const,
  expiring: (days?: number) => [...exceptionKeys.all, 'expiring', days] as const,
};

export const acknowledgmentKeys = {
  all: ['policyAcknowledgments'] as const,
  list: (params: Record<string, unknown>) => [...acknowledgmentKeys.all, 'list', params] as const,
  pending: (userId: string) => [...acknowledgmentKeys.all, 'pending', userId] as const,
  overdue: () => [...acknowledgmentKeys.all, 'overdue'] as const,
  stats: () => [...acknowledgmentKeys.all, 'stats'] as const,
};

// ---------------------------------------------------------------------------
// Policy document hooks
// ---------------------------------------------------------------------------

export function usePolicies(params?: {
  skip?: number;
  take?: number;
  search?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  ownerId?: string;
}) {
  return useQuery({
    queryKey: policyKeys.list(params ?? {}),
    queryFn: () => getPolicies(params),
  });
}

export function usePolicy(id: string) {
  return useQuery({
    queryKey: policyKeys.detail(id),
    queryFn: () => getPolicy(id),
    enabled: !!id,
  });
}

export function usePolicyStats() {
  return useQuery({
    queryKey: policyKeys.stats(),
    queryFn: () => getPolicyStats(),
  });
}

export function usePolicyHierarchy() {
  return useQuery({
    queryKey: policyKeys.hierarchy(),
    queryFn: () => getPolicyHierarchy(),
  });
}

export function usePolicySearch(params: { query: string; documentType?: DocumentType; status?: DocumentStatus }) {
  return useQuery({
    queryKey: [...policyKeys.all, 'search', params],
    queryFn: () => searchPolicies(params),
    enabled: !!params.query,
  });
}

// ---------------------------------------------------------------------------
// Version hooks
// ---------------------------------------------------------------------------

export function usePolicyVersions(documentId: string) {
  return useQuery({
    queryKey: policyKeys.versions(documentId),
    queryFn: () => getVersions(documentId),
    enabled: !!documentId,
  });
}

// ---------------------------------------------------------------------------
// Review hooks
// ---------------------------------------------------------------------------

export function usePolicyReviews(documentId: string) {
  return useQuery({
    queryKey: policyKeys.reviews(documentId),
    queryFn: () => getReviews(documentId),
    enabled: !!documentId,
  });
}

export function useUpcomingReviews(days = 30) {
  return useQuery({
    queryKey: reviewKeys.upcoming(days),
    queryFn: () => getUpcomingReviews(days),
  });
}

export function useOverdueReviews() {
  return useQuery({
    queryKey: reviewKeys.overdue(),
    queryFn: () => getOverdueReviews(),
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: reviewKeys.stats(),
    queryFn: () => getReviewStats(),
  });
}

// ---------------------------------------------------------------------------
// Workflow hooks
// ---------------------------------------------------------------------------

export function usePolicyWorkflows(documentId: string) {
  return useQuery({
    queryKey: policyKeys.workflows(documentId),
    queryFn: () => getWorkflows(documentId),
    enabled: !!documentId,
  });
}

export function useCurrentWorkflow(documentId: string) {
  return useQuery({
    queryKey: policyKeys.currentWorkflow(documentId),
    queryFn: () => getCurrentWorkflow(documentId),
    enabled: !!documentId,
  });
}

// ---------------------------------------------------------------------------
// Change request hooks
// ---------------------------------------------------------------------------

export function useChangeRequests(params?: Parameters<typeof getChangeRequests>[0]) {
  return useQuery({
    queryKey: changeRequestKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => getChangeRequests(params),
  });
}

export function useChangeRequest(id: string) {
  return useQuery({
    queryKey: changeRequestKeys.detail(id),
    queryFn: () => getChangeRequest(id),
    enabled: !!id,
  });
}

export function useChangeRequestStats() {
  return useQuery({
    queryKey: changeRequestKeys.stats(),
    queryFn: () => getChangeRequestStats(),
  });
}

// ---------------------------------------------------------------------------
// Exception hooks
// ---------------------------------------------------------------------------

export function usePolicyExceptions(params?: Parameters<typeof getExceptions>[0]) {
  return useQuery({
    queryKey: exceptionKeys.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => getExceptions(params),
  });
}

export function usePolicyException(id: string) {
  return useQuery({
    queryKey: exceptionKeys.detail(id),
    queryFn: () => getException(id),
    enabled: !!id,
  });
}

export function usePolicyExceptionStats() {
  return useQuery({
    queryKey: exceptionKeys.stats(),
    queryFn: () => getExceptionStats(),
  });
}

export function useExpiringExceptions(days = 30) {
  return useQuery({
    queryKey: exceptionKeys.expiring(days),
    queryFn: () => getExpiringExceptions(days),
  });
}

// ---------------------------------------------------------------------------
// Acknowledgment hooks
// ---------------------------------------------------------------------------

export function useAcknowledgments(params?: { skip?: number; take?: number; documentId?: string; status?: string }) {
  return useQuery({
    queryKey: acknowledgmentKeys.list(params ?? {}),
    queryFn: () => getAcknowledgments(params),
  });
}

export function usePendingAcknowledgments(userId: string) {
  return useQuery({
    queryKey: acknowledgmentKeys.pending(userId),
    queryFn: () => getPendingAcknowledgments(userId),
    enabled: !!userId,
  });
}

export function useOverdueAcknowledgments() {
  return useQuery({
    queryKey: acknowledgmentKeys.overdue(),
    queryFn: () => getOverdueAcknowledgments(),
  });
}

export function useAcknowledgmentStats() {
  return useQuery({
    queryKey: acknowledgmentKeys.stats(),
    queryFn: () => getAcknowledgmentStats(),
  });
}

// ---------------------------------------------------------------------------
// Mapping hooks
// ---------------------------------------------------------------------------

export function useControlMappings(documentId: string) {
  return useQuery({
    queryKey: policyKeys.controlMappings(documentId),
    queryFn: () => getControlMappings(documentId),
    enabled: !!documentId,
  });
}

export function useRiskMappings(documentId: string) {
  return useQuery({
    queryKey: policyKeys.riskMappings(documentId),
    queryFn: () => getRiskMappings(documentId),
    enabled: !!documentId,
  });
}

export function useControlCoverageReport() {
  return useQuery({
    queryKey: [...policyKeys.all, 'controlCoverage'],
    queryFn: () => getControlCoverageReport(),
  });
}

export function usePolicyGapAnalysis() {
  return useQuery({
    queryKey: [...policyKeys.all, 'gapAnalysis'],
    queryFn: () => getGapAnalysis(),
  });
}

export function useDocumentRelations(documentId: string) {
  return useQuery({
    queryKey: policyKeys.relations(documentId),
    queryFn: () => getDocumentRelations(documentId),
    enabled: !!documentId,
  });
}

// ---------------------------------------------------------------------------
// Dashboard hooks
// ---------------------------------------------------------------------------

export function usePolicyDashboardStats() {
  return useQuery({
    queryKey: policyKeys.dashboardStats(),
    queryFn: () => getDashboardStats(),
  });
}

export function usePolicyComplianceStatus() {
  return useQuery({
    queryKey: policyKeys.complianceStatus(),
    queryFn: () => getComplianceStatus(),
  });
}

export function usePolicyActionsNeeded() {
  return useQuery({
    queryKey: policyKeys.actionsNeeded(),
    queryFn: () => getActionsNeeded(),
  });
}

export function usePolicyRecentActivity(limit = 10) {
  return useQuery({
    queryKey: policyKeys.recentActivity(limit),
    queryFn: () => getRecentActivity(limit),
  });
}

// ---------------------------------------------------------------------------
// Structure hooks
// ---------------------------------------------------------------------------

export function usePolicySections(documentId: string) {
  return useQuery({
    queryKey: policyKeys.sections(documentId),
    queryFn: () => getSections(documentId),
    enabled: !!documentId,
  });
}

export function usePolicyAttachments(documentId: string) {
  return useQuery({
    queryKey: policyKeys.attachments(documentId),
    queryFn: () => getAttachments(documentId),
    enabled: !!documentId,
  });
}

export function usePolicyAttachmentStats(documentId: string) {
  return useQuery({
    queryKey: policyKeys.attachmentStats(documentId),
    queryFn: () => getAttachmentStats(documentId),
    enabled: !!documentId,
  });
}
