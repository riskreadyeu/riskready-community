import { useQuery } from '@tanstack/react-query';
import {
  getRisks,
  getRisk,
  getRiskStats,
  getRiskScenarios,
  getRiskScenario,
  getScenariosByRisk,
  getKRIs,
  getKRI,
  getKRIsByRisk,
  getKRIDashboard,
  getRTSList,
  getRTS,
  getRTSStats,
  getRTSByRisk,
  getTreatmentPlans,
  getTreatmentPlan,
  getTreatmentPlansByRisk,
  getTreatmentPlanStats,
  getControlEffectivenessForRisk,
  getControlEffectivenessForScenario,
  getScenarioLinkedControls,
} from '@/lib/risks-api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const riskKeys = {
  all: ['risks'] as const,
  lists: () => [...riskKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...riskKeys.lists(), params] as const,
  details: () => [...riskKeys.all, 'detail'] as const,
  detail: (id: string) => [...riskKeys.details(), id] as const,
  stats: (organisationId?: string) => [...riskKeys.all, 'stats', organisationId] as const,
};

export const scenarioKeys = {
  all: ['scenarios'] as const,
  lists: () => [...scenarioKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...scenarioKeys.lists(), params] as const,
  details: () => [...scenarioKeys.all, 'detail'] as const,
  detail: (id: string) => [...scenarioKeys.details(), id] as const,
  byRisk: (riskId: string) => [...scenarioKeys.all, 'byRisk', riskId] as const,
  linkedControls: (scenarioId: string) => [...scenarioKeys.all, 'linkedControls', scenarioId] as const,
  controlEffectiveness: (scenarioId: string) => [...scenarioKeys.all, 'controlEffectiveness', scenarioId] as const,
};

export const kriKeys = {
  all: ['kris'] as const,
  lists: () => [...kriKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...kriKeys.lists(), params] as const,
  details: () => [...kriKeys.all, 'detail'] as const,
  detail: (id: string) => [...kriKeys.details(), id] as const,
  byRisk: (riskId: string) => [...kriKeys.all, 'byRisk', riskId] as const,
  dashboard: (organisationId?: string) => [...kriKeys.all, 'dashboard', organisationId] as const,
};

export const rtsKeys = {
  all: ['rts'] as const,
  lists: () => [...rtsKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...rtsKeys.lists(), params] as const,
  details: () => [...rtsKeys.all, 'detail'] as const,
  detail: (id: string) => [...rtsKeys.details(), id] as const,
  stats: (organisationId?: string) => [...rtsKeys.all, 'stats', organisationId] as const,
  byRisk: (riskId: string) => [...rtsKeys.all, 'byRisk', riskId] as const,
};

export const treatmentKeys = {
  all: ['treatments'] as const,
  lists: () => [...treatmentKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...treatmentKeys.lists(), params] as const,
  details: () => [...treatmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...treatmentKeys.details(), id] as const,
  byRisk: (riskId: string) => [...treatmentKeys.all, 'byRisk', riskId] as const,
  stats: (organisationId?: string) => [...treatmentKeys.all, 'stats', organisationId] as const,
};

// ---------------------------------------------------------------------------
// Risk hooks
// ---------------------------------------------------------------------------

export function useRisks(params?: { skip?: number; take?: number; tier?: string; status?: string; framework?: string }) {
  return useQuery({
    queryKey: riskKeys.list(params ?? {}),
    queryFn: () => getRisks(params),
  });
}

export function useRisk(id: string) {
  return useQuery({
    queryKey: riskKeys.detail(id),
    queryFn: () => getRisk(id),
    enabled: !!id,
  });
}

export function useRiskStats(organisationId?: string) {
  return useQuery({
    queryKey: riskKeys.stats(organisationId),
    queryFn: () => getRiskStats(organisationId),
  });
}

// ---------------------------------------------------------------------------
// Scenario hooks
// ---------------------------------------------------------------------------

export function useRiskScenarios(params?: { skip?: number; take?: number; riskId?: string; status?: string }) {
  return useQuery({
    queryKey: scenarioKeys.list(params ?? {}),
    queryFn: () => getRiskScenarios(params),
  });
}

export function useRiskScenario(id: string) {
  return useQuery({
    queryKey: scenarioKeys.detail(id),
    queryFn: () => getRiskScenario(id),
    enabled: !!id,
  });
}

export function useScenariosByRisk(riskId: string) {
  return useQuery({
    queryKey: scenarioKeys.byRisk(riskId),
    queryFn: () => getScenariosByRisk(riskId),
    enabled: !!riskId,
  });
}

export function useScenarioLinkedControls(scenarioId: string) {
  return useQuery({
    queryKey: scenarioKeys.linkedControls(scenarioId),
    queryFn: () => getScenarioLinkedControls(scenarioId),
    enabled: !!scenarioId,
  });
}

export function useControlEffectivenessForRisk(riskId: string) {
  return useQuery({
    queryKey: [...riskKeys.detail(riskId), 'controlEffectiveness'],
    queryFn: () => getControlEffectivenessForRisk(riskId),
    enabled: !!riskId,
  });
}

export function useControlEffectivenessForScenario(scenarioId: string) {
  return useQuery({
    queryKey: scenarioKeys.controlEffectiveness(scenarioId),
    queryFn: () => getControlEffectivenessForScenario(scenarioId),
    enabled: !!scenarioId,
  });
}

// ---------------------------------------------------------------------------
// KRI hooks
// ---------------------------------------------------------------------------

export function useKRIs(params?: { skip?: number; take?: number; riskId?: string }) {
  return useQuery({
    queryKey: kriKeys.list(params ?? {}),
    queryFn: () => getKRIs(params),
  });
}

export function useKRI(id: string) {
  return useQuery({
    queryKey: kriKeys.detail(id),
    queryFn: () => getKRI(id),
    enabled: !!id,
  });
}

export function useKRIsByRisk(riskId: string) {
  return useQuery({
    queryKey: kriKeys.byRisk(riskId),
    queryFn: () => getKRIsByRisk(riskId),
    enabled: !!riskId,
  });
}

export function useKRIDashboard(organisationId?: string) {
  return useQuery({
    queryKey: kriKeys.dashboard(organisationId),
    queryFn: () => getKRIDashboard(organisationId),
  });
}

// ---------------------------------------------------------------------------
// RTS hooks
// ---------------------------------------------------------------------------

export function useRTSList(params?: { skip?: number; take?: number; status?: string }) {
  return useQuery({
    queryKey: rtsKeys.list(params ?? {}),
    queryFn: () => getRTSList(params),
  });
}

export function useRTS(id: string) {
  return useQuery({
    queryKey: rtsKeys.detail(id),
    queryFn: () => getRTS(id),
    enabled: !!id,
  });
}

export function useRTSStats(organisationId?: string) {
  return useQuery({
    queryKey: rtsKeys.stats(organisationId),
    queryFn: () => getRTSStats(organisationId),
  });
}

export function useRTSByRisk(riskId: string) {
  return useQuery({
    queryKey: rtsKeys.byRisk(riskId),
    queryFn: () => getRTSByRisk(riskId),
    enabled: !!riskId,
  });
}

// ---------------------------------------------------------------------------
// Treatment plan hooks
// ---------------------------------------------------------------------------

export function useTreatmentPlans(params?: { skip?: number; take?: number; riskId?: string; status?: string }) {
  return useQuery({
    queryKey: treatmentKeys.list(params ?? {}),
    queryFn: () => getTreatmentPlans(params),
  });
}

export function useTreatmentPlan(id: string) {
  return useQuery({
    queryKey: treatmentKeys.detail(id),
    queryFn: () => getTreatmentPlan(id),
    enabled: !!id,
  });
}

export function useTreatmentPlansByRisk(riskId: string) {
  return useQuery({
    queryKey: treatmentKeys.byRisk(riskId),
    queryFn: () => getTreatmentPlansByRisk(riskId),
    enabled: !!riskId,
  });
}

export function useTreatmentPlanStats(organisationId?: string) {
  return useQuery({
    queryKey: treatmentKeys.stats(organisationId),
    queryFn: () => getTreatmentPlanStats(organisationId),
  });
}
