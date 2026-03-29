import { useQuery } from '@tanstack/react-query';
import {
  getEvidenceList,
  getEvidence,
  getEvidenceStats,
  getExpiringEvidence,
  getEvidenceRequests,
  getEvidenceRequest,
  getEvidenceRequestStats,
  getMyEvidenceRequests,
  getEvidenceForEntity,
  type EvidenceType,
  type EvidenceStatus,
  type EvidenceClassification,
  type EvidenceSourceType,
  type EvidenceRequestStatus,
  type EvidenceRequestPriority,
  type LinkEntityType,
} from '@/lib/evidence-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const evidenceKeys = {
  all: ['evidence'] as const,
  lists: () => [...evidenceKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...evidenceKeys.lists(), params] as const,
  details: () => [...evidenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...evidenceKeys.details(), id] as const,
  stats: () => [...evidenceKeys.all, 'stats'] as const,
  expiring: (days?: number) => [...evidenceKeys.all, 'expiring', days] as const,
  forEntity: (entityType: string, entityId: string) => [...evidenceKeys.all, 'forEntity', entityType, entityId] as const,
};

export const evidenceRequestKeys = {
  all: ['evidenceRequests'] as const,
  lists: () => [...evidenceRequestKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...evidenceRequestKeys.lists(), params] as const,
  details: () => [...evidenceRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...evidenceRequestKeys.details(), id] as const,
  stats: () => [...evidenceRequestKeys.all, 'stats'] as const,
  my: (userId: string) => [...evidenceRequestKeys.all, 'my', userId] as const,
};

// ---------------------------------------------------------------------------
// Evidence hooks
// ---------------------------------------------------------------------------

export function useEvidenceList(params?: {
  skip?: number;
  take?: number;
  evidenceType?: EvidenceType;
  status?: EvidenceStatus;
  classification?: EvidenceClassification;
  sourceType?: EvidenceSourceType;
  category?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: evidenceKeys.list(params ?? {}),
    queryFn: () => getEvidenceList(params),
  });
}

export function useEvidence(id: string) {
  return useQuery({
    queryKey: evidenceKeys.detail(id),
    queryFn: () => getEvidence(id),
    enabled: !!id,
  });
}

export function useEvidenceStats() {
  return useQuery({
    queryKey: evidenceKeys.stats(),
    queryFn: () => getEvidenceStats(),
  });
}

export function useExpiringEvidence(days?: number) {
  return useQuery({
    queryKey: evidenceKeys.expiring(days),
    queryFn: () => getExpiringEvidence(days),
  });
}

export function useEvidenceForEntity(entityType: LinkEntityType, entityId: string) {
  return useQuery({
    queryKey: evidenceKeys.forEntity(entityType, entityId),
    queryFn: () => getEvidenceForEntity(entityType, entityId),
    enabled: !!entityId,
  });
}

// ---------------------------------------------------------------------------
// Evidence request hooks
// ---------------------------------------------------------------------------

export function useEvidenceRequests(params?: {
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
}) {
  return useQuery({
    queryKey: evidenceRequestKeys.list(params ?? {}),
    queryFn: () => getEvidenceRequests(params),
  });
}

export function useEvidenceRequest(id: string) {
  return useQuery({
    queryKey: evidenceRequestKeys.detail(id),
    queryFn: () => getEvidenceRequest(id),
    enabled: !!id,
  });
}

export function useEvidenceRequestStats() {
  return useQuery({
    queryKey: evidenceRequestKeys.stats(),
    queryFn: () => getEvidenceRequestStats(),
  });
}

export function useMyEvidenceRequests(userId: string) {
  return useQuery({
    queryKey: evidenceRequestKeys.my(userId),
    queryFn: () => getMyEvidenceRequests(userId),
    enabled: !!userId,
  });
}
