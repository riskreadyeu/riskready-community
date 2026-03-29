import { RiskService } from '../../risks/services/risk.service';
import { RiskScenarioService } from '../../risks/services/risk-scenario.service';
import { KRIService } from '../../risks/services/kri.service';
import { RiskToleranceStatementService } from '../../risks/services/rts.service';
import { TreatmentPlanService } from '../../risks/services/treatment-plan.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';
import {
  validatePayload,
  CreateRiskPayload,
  UpdateRiskPayload,
  CreateScenarioPayload,
  TransitionScenarioPayload,
  AssessScenarioPayload,
  LinkScenarioControlPayload,
  CreateKRIPayload,
  RecordKRIValuePayload,
  CreateRTSPayload,
  ApproveRTSPayload,
  CreateTreatmentPlanPayload,
  CreateTreatmentActionPayload,
} from './payload-schemas';

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

  executors.set('CREATE_RISK', (p, userId) => {
    const validated = validatePayload(CreateRiskPayload, p, 'CREATE_RISK');
    return riskService.create({ ...prepareCreatePayload(validated), createdById: userId } as any);
  });

  executors.set('UPDATE_RISK', (p) => {
    const { riskId, ...data } = validatePayload(UpdateRiskPayload, p, 'UPDATE_RISK');
    return riskService.update(riskId, stripMcpMeta(data) as any);
  });

  // --- Scenario executors ---

  executors.set('CREATE_SCENARIO', (p, userId) => {
    const validated = validatePayload(CreateScenarioPayload, p, 'CREATE_SCENARIO');
    return scenarioService.create({ ...prepareCreatePayload(validated), createdById: userId } as any);
  });

  executors.set('TRANSITION_SCENARIO', (p) => {
    const { scenarioId, targetStatus } = validatePayload(TransitionScenarioPayload, p, 'TRANSITION_SCENARIO');
    return scenarioService.update(scenarioId, { status: targetStatus } as any);
  });

  executors.set('ASSESS_SCENARIO', (p) => {
    const { scenarioId, assessmentType, likelihood, impact } = validatePayload(
      AssessScenarioPayload,
      p,
      'ASSESS_SCENARIO',
    );
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

  // --- Scenario-Control link executors ---

  executors.set('LINK_SCENARIO_CONTROL', (p) => {
    const validated = validatePayload(LinkScenarioControlPayload, p, 'LINK_SCENARIO_CONTROL');
    return scenarioService.linkControl(validated.scenarioId, validated.controlId, {
      effectivenessWeight: validated.effectivenessWeight,
      isPrimaryControl: validated.isPrimaryControl,
      notes: validated.notes,
    });
  });

  // --- KRI executors ---

  executors.set('CREATE_KRI', (p, userId) => {
    const validated = validatePayload(CreateKRIPayload, p, 'CREATE_KRI');
    return kriService.create({ ...prepareCreatePayload(validated), createdById: userId } as any);
  });

  executors.set('RECORD_KRI_VALUE', (p, userId) => {
    const validated = validatePayload(RecordKRIValuePayload, p, 'RECORD_KRI_VALUE');
    return kriService.recordMeasurement(validated.kriId, {
      value: validated.value as any,
      notes: validated.notes,
      measuredById: userId,
    });
  });

  // --- RTS executors ---

  executors.set('CREATE_RTS', (p, userId) => {
    const validated = validatePayload(CreateRTSPayload, p, 'CREATE_RTS');
    return rtsService.create({ ...prepareCreatePayload(validated), createdById: userId } as any);
  });

  executors.set('APPROVE_RTS', (p, userId) => {
    const validated = validatePayload(ApproveRTSPayload, p, 'APPROVE_RTS');
    return rtsService.approve(validated.rtsId, userId);
  });

  // --- Treatment executors ---

  executors.set('CREATE_TREATMENT_PLAN', (p, userId) => {
    const validated = validatePayload(CreateTreatmentPlanPayload, p, 'CREATE_TREATMENT_PLAN');
    return treatmentPlanService.create({ ...prepareCreatePayload(validated), createdById: userId } as any);
  });

  executors.set('CREATE_TREATMENT_ACTION', (p, userId) => {
    const validated = validatePayload(CreateTreatmentActionPayload, p, 'CREATE_TREATMENT_ACTION');
    return treatmentPlanService.createAction({ ...prepareCreatePayload(validated), createdById: userId } as any);
  });
}
