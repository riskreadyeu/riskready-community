import { ControlService } from '../../controls/services/control.service';
import { AssessmentService } from '../../controls/services/assessment.service';
import { AssessmentTestService } from '../../controls/services/assessment-test.service';
import { SOAService } from '../../controls/services/soa.service';
import { SOAEntryService } from '../../controls/services/soa-entry.service';
import { ScopeItemService } from '../../controls/services/scope-item.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TreatmentPlanService } from '../../risks/services/treatment-plan.service';
import { ExecutorMap, stripMcpMeta } from './types';

export interface ControlExecutorServices {
  controlService: ControlService;
  assessmentService: AssessmentService;
  assessmentTestService: AssessmentTestService;
  soaService: SOAService;
  soaEntryService: SOAEntryService;
  scopeItemService: ScopeItemService;
  prismaService: PrismaService;
  treatmentPlanService: TreatmentPlanService;
}

export function registerControlExecutors(executors: ExecutorMap, services: ControlExecutorServices): void {
  const {
    controlService,
    assessmentService,
    assessmentTestService,
    soaService,
    soaEntryService,
    scopeItemService,
    prismaService,
    treatmentPlanService,
  } = services;

  // --- Control executors ---
  // Note: payload `p` is Record<string, any> from MCP actions.
  // Service methods have strict signatures, so we cast where needed.

  executors.set('CREATE_CONTROL', (p, userId) =>
    controlService.create({ ...p, createdById: userId } as any),
  );

  executors.set('UPDATE_CONTROL', (p) => {
    const { controlId, ...data } = p as { controlId: string; [k: string]: any };
    return controlService.update(controlId, stripMcpMeta(data));
  });

  executors.set('UPDATE_CONTROL_STATUS', (p) => {
    const { controlId, ...data } = p as { controlId: string; [k: string]: any };
    return controlService.update(controlId, stripMcpMeta(data));
  });

  executors.set('DISABLE_CONTROL', (p, userId) =>
    controlService.disableControl(p['controlId'], p['disableReason'] || p['reason'] || '', userId),
  );

  executors.set('ENABLE_CONTROL', (p, userId) =>
    controlService.enableControl(p['controlId'], userId),
  );

  // --- Assessment executors ---

  executors.set('CREATE_ASSESSMENT', (p, userId) =>
    assessmentService.create({
      organisationId: p['organisationId'],
      title: p['title'],
      description: p['description'],
      assessmentRef: p['assessmentRef'],
      leadTesterId: p['leadTesterId'],
      reviewerId: p['reviewerId'],
      plannedStartDate: p['plannedStartDate'] ? new Date(p['plannedStartDate']) : undefined,
      plannedEndDate: p['plannedEndDate'] ? new Date(p['plannedEndDate']) : undefined,
      dueDate: p['dueDate'] ? new Date(p['dueDate']) : undefined,
      periodStart: p['periodStart'] ? new Date(p['periodStart']) : undefined,
      periodEnd: p['periodEnd'] ? new Date(p['periodEnd']) : undefined,
      controlIds: p['controlIds'],
      scopeItemIds: p['scopeItemIds'],
    }, userId),
  );

  executors.set('UPDATE_ASSESSMENT', (p) => {
    const { assessmentId, ...data } = p as { assessmentId: string; [k: string]: any };
    const cleanData = stripMcpMeta(data);
    return assessmentService.update(assessmentId, {
      ...cleanData,
      plannedStartDate: data['plannedStartDate'] ? new Date(data['plannedStartDate']) : undefined,
      plannedEndDate: data['plannedEndDate'] ? new Date(data['plannedEndDate']) : undefined,
      dueDate: data['dueDate'] ? new Date(data['dueDate']) : undefined,
      periodStart: data['periodStart'] ? new Date(data['periodStart']) : undefined,
      periodEnd: data['periodEnd'] ? new Date(data['periodEnd']) : undefined,
    });
  });

  executors.set('DELETE_ASSESSMENT', (p) =>
    assessmentService.delete(p['assessmentId']),
  );

  executors.set('START_ASSESSMENT', (p) =>
    assessmentService.startAssessment(p['assessmentId']),
  );

  executors.set('SUBMIT_ASSESSMENT_REVIEW', (p) =>
    assessmentService.submitForReview(p['assessmentId']),
  );

  executors.set('COMPLETE_ASSESSMENT', (p) =>
    assessmentService.completeAssessment(p['assessmentId'], p['reviewNotes']),
  );

  executors.set('CANCEL_ASSESSMENT', (p) =>
    assessmentService.cancelAssessment(p['assessmentId'], p['cancelReason'] || p['reason']),
  );

  executors.set('ADD_ASSESSMENT_CONTROLS', (p) =>
    assessmentService.addControls(p['assessmentId'], p['controlIds']),
  );

  executors.set('REMOVE_ASSESSMENT_CONTROL', (p) =>
    assessmentService.removeControl(p['assessmentId'], p['controlId']),
  );

  executors.set('ADD_ASSESSMENT_SCOPE_ITEMS', (p) =>
    assessmentService.addScopeItems(p['assessmentId'], p['scopeItemIds']),
  );

  executors.set('REMOVE_ASSESSMENT_SCOPE_ITEM', (p) =>
    assessmentService.removeScopeItem(p['assessmentId'], p['scopeItemId']),
  );

  executors.set('POPULATE_ASSESSMENT_TESTS', (p) =>
    assessmentService.populateTests(p['assessmentId']),
  );

  // --- Test executors ---

  executors.set('RECORD_TEST_RESULT', (p, userId) =>
    assessmentTestService.executeTest(
      p['assessmentTestId'],
      {
        result: p['result'],
        findings: p['findings'],
        recommendations: p['recommendations'],
      },
      p['assignedTesterId'] || userId,
    ),
  );

  executors.set('BULK_ASSIGN_TESTS', (p) =>
    assessmentTestService.bulkAssign(p['testIds'], {
      assignedTesterId: p['assignedTesterId'],
      ownerId: p['ownerId'],
      assessorId: p['assessorId'],
      testMethod: p['testMethod'],
    }),
  );

  executors.set('UPDATE_TEST', (p) =>
    assessmentTestService.updateTest(p['assessmentTestId'], {
      testMethod: p['testMethod'],
      ownerId: p['ownerId'],
      assessorId: p['assessorId'],
      assignedTesterId: p['assignedTesterId'],
    }),
  );

  executors.set('ASSIGN_TESTER', (p) =>
    assessmentTestService.assignTester(p['assessmentTestId'], p['testerId']),
  );

  executors.set('UPDATE_ROOT_CAUSE', (p) =>
    assessmentTestService.updateRootCause(p['assessmentTestId'], {
      rootCause: p['rootCause'],
      rootCauseNotes: p['rootCauseNotes'],
      remediationEffort: p['remediationEffort'],
      estimatedHours: p['estimatedHours'],
      estimatedCost: p['estimatedCost'],
    }),
  );

  executors.set('SKIP_TEST', (p) =>
    assessmentTestService.skipTest(p['assessmentTestId'], p['justification']),
  );

  // --- SOA executors ---

  executors.set('CREATE_SOA', (p, userId) =>
    soaService.create({
      version: p['version'],
      name: p['name'],
      notes: p['notes'],
      organisationId: p['organisationId'],
      createdById: userId,
    }),
  );

  executors.set('CREATE_SOA_FROM_CONTROLS', (p, userId) =>
    soaService.createFromControls({
      version: p['version'],
      name: p['name'],
      notes: p['notes'],
      organisationId: p['organisationId'],
      createdById: userId,
    }),
  );

  executors.set('CREATE_SOA_VERSION', (p, userId) =>
    soaService.createNewVersion(p['sourceSoaId'], {
      version: p['newVersion'] || p['version'],
      name: p['name'],
      notes: p['notes'],
      createdById: userId,
    }),
  );

  executors.set('UPDATE_SOA', (p, userId) =>
    soaService.update(p['soaId'], {
      name: p['name'],
      notes: p['notes'],
      updatedById: userId,
    }),
  );

  executors.set('SUBMIT_SOA_REVIEW', (p, userId) =>
    soaService.submitForReview(p['soaId'], userId),
  );

  executors.set('APPROVE_SOA', (p, userId) =>
    soaService.approve(p['soaId'], userId),
  );

  executors.set('DELETE_SOA', (p) =>
    soaService.delete(p['soaId']),
  );

  executors.set('UPDATE_SOA_ENTRY', (p) =>
    soaEntryService.updateEntry(p['soaEntryId'], {
      applicable: p['applicable'],
      justificationIfNa: p['justificationIfNa'],
      implementationStatus: p['implementationStatus'],
      implementationDesc: p['implementationDesc'],
      parentRiskId: p['parentRiskId'],
      scenarioIds: p['scenarioIds'],
    }),
  );

  // --- Scope executors ---

  executors.set('CREATE_SCOPE_ITEM', (p, userId) =>
    scopeItemService.create(p as any, userId),
  );

  executors.set('UPDATE_SCOPE_ITEM', (p) => {
    const { scopeItemId, ...data } = p as { scopeItemId: string; [k: string]: any };
    return scopeItemService.update(scopeItemId, stripMcpMeta(data));
  });

  executors.set('DELETE_SCOPE_ITEM', (p) =>
    scopeItemService.delete(p['scopeItemId']),
  );

  // --- Remediation executors ---

  executors.set('CREATE_REMEDIATION', (p, userId) =>
    treatmentPlanService.createAction({
      ...p,
      createdById: userId,
    } as any),
  );

  // --- Metric executors ---

  executors.set('UPDATE_METRIC_VALUE', (p, userId) =>
    prismaService.$transaction(async (tx) => {
      // Record the history entry
      await tx.controlMetricHistory.create({
        data: {
          metricId: p['metricId'],
          value: p['value'],
          status: p['status'],
          measuredAt: new Date(),
          measuredBy: userId,
          notes: p['notes'],
        },
      });
      // Update the metric's current value
      return tx.controlMetric.update({
        where: { id: p['metricId'] },
        data: {
          currentValue: p['value'],
          status: p['status'],
          lastMeasured: new Date(),
        },
      });
    }),
  );
}
