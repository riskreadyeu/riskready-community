import { useQuery } from '@tanstack/react-query';
import {
  getIncidents,
  getIncident,
  getIncidentStats,
  getIncidentTimeline,
  getIncidentEvidence,
  getIncidentCommunications,
  getIncidentLessonsLearned,
  getIncidentNotifications,
  getIncidentTypes,
  getAttackVectors,
  getRegulatoryAuthorities,
  getOverdueNotifications,
  type GetIncidentsParams,
} from '@/lib/incidents-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const incidentKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...incidentKeys.lists(), params] as const,
  details: () => [...incidentKeys.all, 'detail'] as const,
  detail: (id: string) => [...incidentKeys.details(), id] as const,
  stats: () => [...incidentKeys.all, 'stats'] as const,
  timeline: (id: string) => [...incidentKeys.detail(id), 'timeline'] as const,
  evidence: (id: string) => [...incidentKeys.detail(id), 'evidence'] as const,
  communications: (id: string) => [...incidentKeys.detail(id), 'communications'] as const,
  lessonsLearned: (id: string) => [...incidentKeys.detail(id), 'lessonsLearned'] as const,
  notifications: (id: string) => [...incidentKeys.detail(id), 'notifications'] as const,
  types: () => [...incidentKeys.all, 'types'] as const,
  attackVectors: () => [...incidentKeys.all, 'attackVectors'] as const,
  regulatoryAuthorities: () => [...incidentKeys.all, 'regulatoryAuthorities'] as const,
  overdueNotifications: () => [...incidentKeys.all, 'overdueNotifications'] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useIncidents(params?: GetIncidentsParams) {
  return useQuery({
    queryKey: incidentKeys.list(params ?? {}),
    queryFn: () => getIncidents(params),
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => getIncident(id),
    enabled: !!id,
  });
}

export function useIncidentStats() {
  return useQuery({
    queryKey: incidentKeys.stats(),
    queryFn: () => getIncidentStats(),
  });
}

export function useIncidentTimeline(incidentId: string) {
  return useQuery({
    queryKey: incidentKeys.timeline(incidentId),
    queryFn: () => getIncidentTimeline(incidentId),
    enabled: !!incidentId,
  });
}

export function useIncidentEvidence(incidentId: string) {
  return useQuery({
    queryKey: incidentKeys.evidence(incidentId),
    queryFn: () => getIncidentEvidence(incidentId),
    enabled: !!incidentId,
  });
}

export function useIncidentCommunications(incidentId: string) {
  return useQuery({
    queryKey: incidentKeys.communications(incidentId),
    queryFn: () => getIncidentCommunications(incidentId),
    enabled: !!incidentId,
  });
}

export function useIncidentLessonsLearned(incidentId: string) {
  return useQuery({
    queryKey: incidentKeys.lessonsLearned(incidentId),
    queryFn: () => getIncidentLessonsLearned(incidentId),
    enabled: !!incidentId,
  });
}

export function useIncidentNotifications(incidentId: string) {
  return useQuery({
    queryKey: incidentKeys.notifications(incidentId),
    queryFn: () => getIncidentNotifications(incidentId),
    enabled: !!incidentId,
  });
}

export function useIncidentTypes() {
  return useQuery({
    queryKey: incidentKeys.types(),
    queryFn: () => getIncidentTypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes — reference data changes rarely
  });
}

export function useAttackVectors() {
  return useQuery({
    queryKey: incidentKeys.attackVectors(),
    queryFn: () => getAttackVectors(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegulatoryAuthorities() {
  return useQuery({
    queryKey: incidentKeys.regulatoryAuthorities(),
    queryFn: () => getRegulatoryAuthorities(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOverdueNotifications() {
  return useQuery({
    queryKey: incidentKeys.overdueNotifications(),
    queryFn: () => getOverdueNotifications(),
  });
}
