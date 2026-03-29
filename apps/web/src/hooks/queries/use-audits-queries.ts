import { useQuery } from '@tanstack/react-query';
import {
  getNonconformities,
  getNonconformity,
  getNonconformityStats,
  getUsers,
  type NCStatus,
  type NCSeverity,
  type NonconformitySource,
} from '@/lib/audits-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const auditKeys = {
  all: ['audits'] as const,
  nonconformities: () => [...auditKeys.all, 'nonconformities'] as const,
  ncLists: () => [...auditKeys.nonconformities(), 'list'] as const,
  ncList: (params: Record<string, unknown>) => [...auditKeys.ncLists(), params] as const,
  ncDetails: () => [...auditKeys.nonconformities(), 'detail'] as const,
  ncDetail: (id: string) => [...auditKeys.ncDetails(), id] as const,
  ncStats: () => [...auditKeys.nonconformities(), 'stats'] as const,
  users: () => [...auditKeys.all, 'users'] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useNonconformities(params?: {
  skip?: number;
  take?: number;
  source?: NonconformitySource;
  severity?: NCSeverity;
  status?: NCStatus;
  responsibleUserId?: string;
  controlId?: string;
  capabilityId?: string;
}) {
  return useQuery({
    queryKey: auditKeys.ncList(params ?? {}),
    queryFn: () => getNonconformities(params),
  });
}

export function useNonconformity(id: string) {
  return useQuery({
    queryKey: auditKeys.ncDetail(id),
    queryFn: () => getNonconformity(id),
    enabled: !!id,
  });
}

export function useNonconformityStats() {
  return useQuery({
    queryKey: auditKeys.ncStats(),
    queryFn: () => getNonconformityStats(),
  });
}

export function useAuditUsers() {
  return useQuery({
    queryKey: auditKeys.users(),
    queryFn: () => getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
