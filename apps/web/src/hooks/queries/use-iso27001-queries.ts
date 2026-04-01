import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { policyKeys } from './use-policies-queries';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Iso27001DocumentStatus {
  documentId: string;
  title: string;
  wave: number;
  status: string;
}

export interface Iso27001Status {
  documents: Iso27001DocumentStatus[];
  total: number;
  completed: number;
  completionPercentage: number;
}

export interface GenerationResult {
  wave: number;
  generated: { documentId: string; title: string; pendingActionId: string }[];
  skipped: { documentId: string; title: string; reason: string }[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const iso27001Keys = {
  all: ['iso27001'] as const,
  status: () => [...iso27001Keys.all, 'status'] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useIso27001Status() {
  return useQuery({
    queryKey: iso27001Keys.status(),
    queryFn: () => api.get<Iso27001Status>('/policies/iso27001-status'),
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useGenerateIso27001() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { wave: number }) =>
      api.post<GenerationResult>('/policies/generate-iso27001', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iso27001Keys.status() });
      queryClient.invalidateQueries({ queryKey: policyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: policyKeys.stats() });
      queryClient.invalidateQueries({ queryKey: policyKeys.dashboardStats() });
    },
  });
}
