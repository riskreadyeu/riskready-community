import { RiskService } from '../../risks/services/risk.service';
import { RiskScenarioService } from '../../risks/services/risk-scenario.service';
import { KRIService } from '../../risks/services/kri.service';
import { RiskToleranceStatementService } from '../../risks/services/rts.service';
import { TreatmentPlanService } from '../../risks/services/treatment-plan.service';
import { ExecutorMap } from './types';

export interface RiskExecutorServices {
  riskService: RiskService;
  scenarioService: RiskScenarioService;
  kriService: KRIService;
  rtsService: RiskToleranceStatementService;
  treatmentPlanService: TreatmentPlanService;
}

export function registerRiskExecutors(executors: ExecutorMap, services: RiskExecutorServices): void {
  const { riskService, scenarioService, kriService, rtsService, treatmentPlanService } = services;

  // --- Risk executors ---

  executors.set('CREATE_RISK', (p, userId) =>
    riskService.create({ ...p, createdById: userId } as any),
  );

  executors.set('UPDATE_RISK', (p) => {
    const { riskId, ...data } = p as { riskId: string; [k: string]: any };
    return riskService.update(riskId, data as any);
  });

  // --- Scenario executors ---

  executors.set('CREATE_SCENARIO', (p, userId) =>
    scenarioService.create({ ...p, createdById: userId } as any),
  );

  executors.set('TRANSITION_SCENARIO', (p) => {
    const { scenarioId, targetStatus } = p as { scenarioId: string; targetStatus: string; [k: string]: any };
    return scenarioService.update(scenarioId, { status: targetStatus } as any);
  });

  executors.set('ASSESS_SCENARIO', (p) => {
    const { scenarioId, assessmentType, likelihood, impact } = p as {
      scenarioId: string;
      assessmentType: string;
      likelihood: string;
      impact: string;
      [k: string]: any;
    };
    if (assessmentType === 'residual') {
      return scenarioService.update(scenarioId, {
        residualLikelihood: likelihood,
        residualImpact: impact,
      } as any);
    }
    return scenarioService.update(scenarioId, {
      likelihood,
      impact,
    } as any);
  });

  // --- KRI executors ---

  executors.set('CREATE_KRI', (p, userId) =>
    kriService.create({ ...p, createdById: userId } as any),
  );

  executors.set('RECORD_KRI_VALUE', (p, userId) =>
    kriService.recordMeasurement(p['kriId'], {
      value: p['value'],
      notes: p['notes'],
      measuredById: userId,
    }),
  );

  // --- RTS executors ---

  executors.set('CREATE_RTS', (p, userId) =>
    rtsService.create({ ...p, createdById: userId } as any),
  );

  executors.set('APPROVE_RTS', (p, userId) =>
    rtsService.approve(p['rtsId'], userId),
  );

  // --- Treatment executors ---

  executors.set('CREATE_TREATMENT_PLAN', (p, userId) =>
    treatmentPlanService.create({ ...p, createdById: userId } as any),
  );

  executors.set('CREATE_TREATMENT_ACTION', (p, userId) =>
    treatmentPlanService.createAction({ ...p, createdById: userId } as any),
  );
}
