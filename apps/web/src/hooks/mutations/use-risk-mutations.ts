import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRisk,
  updateRisk,
  disableRisk,
  enableRisk,
} from '@/lib/risks-api';
import { riskKeys } from '../queries/use-risks-queries';

/**
 * Mutation hook for creating a new risk.
 * Automatically invalidates the risk list cache on success.
 */
export function useCreateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRisk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: riskKeys.stats() });
    },
  });
}

/**
 * Mutation hook for updating an existing risk.
 * Invalidates both the specific risk detail and all list queries.
 */
export function useUpdateRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateRisk>[1] }) =>
      updateRisk(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: riskKeys.stats() });
    },
  });
}

/**
 * Mutation hook for disabling a risk.
 * Invalidates the risk detail and list caches.
 */
export function useDisableRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      disableRisk(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: riskKeys.stats() });
    },
  });
}

/**
 * Mutation hook for enabling a risk.
 * Invalidates the risk detail and list caches.
 */
export function useEnableRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => enableRisk(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: riskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: riskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: riskKeys.stats() });
    },
  });
}
