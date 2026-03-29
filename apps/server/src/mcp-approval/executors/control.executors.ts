import { ControlService } from '../../controls/services/control.service';
import { AssessmentService } from '../../controls/services/assessment.service';
import { AssessmentTestService } from '../../controls/services/assessment-test.service';
import { SOAService } from '../../controls/services/soa.service';
import { SOAEntryService } from '../../controls/services/soa-entry.service';
import { ScopeItemService } from '../../controls/services/scope-item.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TreatmentPlanService } from '../../risks/services/treatment-plan.service';
import { ExecutorMap, prepareCreatePayload, stripMcpMeta } from './types';
import {
  validatePayload,
  CreateControlPayload,
  UpdateControlPayload,
  UpdateControlStatusPayload,
  DisableControlPayload,
  EnableControlPayload,
  CreateAssessmentPayload,
  UpdateAssessmentPayload,
  AssessmentIdPayload,
  CompleteAssessmentPayload,
  CancelAssessmentPayload,
  AssessmentControlsPayload,
  RemoveAssessmentControlPayload,
  AssessmentScopeItemsPayload,
  RemoveAssessmentScopeItemPayload,
  RecordTestResultPayload,
  BulkAssignTestsPayload,
  UpdateTestPayload,
  AssignTesterPayload,
  UpdateRootCausePayload,
  SkipTestPayload,
  CreateSOAPayload,
  CreateSOAVersionPayload,
  UpdateSOAPayload,
  SOAIdPayload,
  UpdateSOAEntryPayload,
  CreateScopeItemPayload,
  UpdateScopeItemPayload,
  DeleteScopeItemPayload,
  CreateRemediationPayload,
  UpdateMetricValuePayload,
} from './payload-schemas';

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

  executors.set('CREATE_CONTROL', (p, userId) => {
    const validated = validatePayload(CreateControlPayload, p, 'CREATE_CONTROL');
    return controlService.create({ ...prepareCreatePayload(validated), createdById: userId } as any);
  });

  executors.set('UPDATE_CONTROL', (p) => {
    const { controlId, ...data } = validatePayload(UpdateControlPayload, p, 'UPDATE_CONTROL');
    return controlService.update(controlId, stripMcpMeta(data));
  });

  executors.set('UPDATE_CONTROL_STATUS', (p) => {
    const { controlId, ...data } = validatePayload(UpdateControlStatusPayload, p, 'UPDATE_CONTROL_STATUS');
    return controlService.update(controlId, stripMcpMeta(data));
  });

  executors.set('DISABLE_CONTROL', (p, userId) => {
    const validated = validatePayload(DisableControlPayload, p, 'DISABLE_CONTROL');
    return controlService.disableControl(
      validated.controlId,
      validated.disableReason || validated.reason || '',
      userId,
    );
  });

  executors.set('ENABLE_CONTROL', (p, userId) => {
    const validated = validatePayload(EnableControlPayload, p, 'ENABLE_CONTROL');
    return controlService.enableControl(validated.controlId, userId);
  });

  // --- Assessment executors ---

  executors.set('CREATE_ASSESSMENT', (p, userId) => {
    const v = validatePayload(CreateAssessmentPayload, p, 'CREATE_ASSESSMENT');
    return assessmentService.create({
      organisationId: v.organisationId,
      title: v.title,
      description: v.description,
      assessmentRef: v.assessmentRef,
      leadTesterId: v.leadTesterId,
      reviewerId: v.reviewerId,
      plannedStartDate: v.plannedStartDate ? new Date(v.plannedStartDate) : undefined,
      plannedEndDate: v.plannedEndDate ? new Date(v.plannedEndDate) : undefined,
      dueDate: v.dueDate ? new Date(v.dueDate) : undefined,
      periodStart: v.periodStart ? new Date(v.periodStart) : undefined,
      periodEnd: v.periodEnd ? new Date(v.periodEnd) : undefined,
      controlIds: v.controlIds,
      scopeItemIds: v.scopeItemIds,
    }, userId);
  });

  executors.set('UPDATE_ASSESSMENT', (p) => {
    const { assessmentId, ...data } = validatePayload(UpdateAssessmentPayload, p, 'UPDATE_ASSESSMENT');
    const cleanData = stripMcpMeta(data);
    return assessmentService.update(assessmentId, {
      ...cleanData,
      plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : undefined,
      plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      periodStart: data.periodStart ? new Date(data.periodStart) : undefined,
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : undefined,
    });
  });

  executors.set('DELETE_ASSESSMENT', (p) => {
    const validated = validatePayload(AssessmentIdPayload, p, 'DELETE_ASSESSMENT');
    return assessmentService.delete(validated.assessmentId);
  });

  executors.set('START_ASSESSMENT', (p) => {
    const validated = validatePayload(AssessmentIdPayload, p, 'START_ASSESSMENT');
    return assessmentService.startAssessment(validated.assessmentId);
  });

  executors.set('SUBMIT_ASSESSMENT_REVIEW', (p) => {
    const validated = validatePayload(AssessmentIdPayload, p, 'SUBMIT_ASSESSMENT_REVIEW');
    return assessmentService.submitForReview(validated.assessmentId);
  });

  executors.set('COMPLETE_ASSESSMENT', (p) => {
    const validated = validatePayload(CompleteAssessmentPayload, p, 'COMPLETE_ASSESSMENT');
    return assessmentService.completeAssessment(validated.assessmentId, validated.reviewNotes);
  });

  executors.set('CANCEL_ASSESSMENT', (p) => {
    const validated = validatePayload(CancelAssessmentPayload, p, 'CANCEL_ASSESSMENT');
    return assessmentService.cancelAssessment(
      validated.assessmentId,
      validated.cancelReason || validated.reason,
    );
  });

  executors.set('ADD_ASSESSMENT_CONTROLS', (p) => {
    const validated = validatePayload(AssessmentControlsPayload, p, 'ADD_ASSESSMENT_CONTROLS');
    return assessmentService.addControls(validated.assessmentId, validated.controlIds);
  });

  executors.set('REMOVE_ASSESSMENT_CONTROL', (p) => {
    const validated = validatePayload(RemoveAssessmentControlPayload, p, 'REMOVE_ASSESSMENT_CONTROL');
    return assessmentService.removeControl(validated.assessmentId, validated.controlId);
  });

  executors.set('ADD_ASSESSMENT_SCOPE_ITEMS', (p) => {
    const validated = validatePayload(AssessmentScopeItemsPayload, p, 'ADD_ASSESSMENT_SCOPE_ITEMS');
    return assessmentService.addScopeItems(validated.assessmentId, validated.scopeItemIds);
  });

  executors.set('REMOVE_ASSESSMENT_SCOPE_ITEM', (p) => {
    const validated = validatePayload(RemoveAssessmentScopeItemPayload, p, 'REMOVE_ASSESSMENT_SCOPE_ITEM');
    return assessmentService.removeScopeItem(validated.assessmentId, validated.scopeItemId);
  });

  executors.set('POPULATE_ASSESSMENT_TESTS', (p) => {
    const validated = validatePayload(AssessmentIdPayload, p, 'POPULATE_ASSESSMENT_TESTS');
    return assessmentService.populateTests(validated.assessmentId);
  });

  // --- Test executors ---

  executors.set('RECORD_TEST_RESULT', (p, userId) => {
    const validated = validatePayload(RecordTestResultPayload, p, 'RECORD_TEST_RESULT');
    return assessmentTestService.executeTest(
      validated.assessmentTestId,
      {
        result: validated.result as any, // Prisma enum
        findings: validated.findings,
        recommendations: validated.recommendations,
      },
      validated.assignedTesterId || userId,
    );
  });

  executors.set('BULK_ASSIGN_TESTS', (p) => {
    const validated = validatePayload(BulkAssignTestsPayload, p, 'BULK_ASSIGN_TESTS');
    return assessmentTestService.bulkAssign(validated.testIds, {
      assignedTesterId: validated.assignedTesterId,
      ownerId: validated.ownerId,
      assessorId: validated.assessorId,
      testMethod: validated.testMethod as any, // Prisma enum
    });
  });

  executors.set('UPDATE_TEST', (p) => {
    const validated = validatePayload(UpdateTestPayload, p, 'UPDATE_TEST');
    return assessmentTestService.updateTest(validated.assessmentTestId, {
      testMethod: validated.testMethod as any, // Prisma enum
      ownerId: validated.ownerId,
      assessorId: validated.assessorId,
      assignedTesterId: validated.assignedTesterId,
    });
  });

  executors.set('ASSIGN_TESTER', (p) => {
    const validated = validatePayload(AssignTesterPayload, p, 'ASSIGN_TESTER');
    return assessmentTestService.assignTester(validated.assessmentTestId, validated.testerId);
  });

  executors.set('UPDATE_ROOT_CAUSE', (p) => {
    const validated = validatePayload(UpdateRootCausePayload, p, 'UPDATE_ROOT_CAUSE');
    return assessmentTestService.updateRootCause(validated.assessmentTestId, {
      rootCause: validated.rootCause as any, // Prisma enum
      rootCauseNotes: validated.rootCauseNotes,
      remediationEffort: validated.remediationEffort as any, // Prisma enum
      estimatedHours: validated.estimatedHours,
      estimatedCost: validated.estimatedCost,
    });
  });

  executors.set('SKIP_TEST', (p) => {
    const validated = validatePayload(SkipTestPayload, p, 'SKIP_TEST');
    return assessmentTestService.skipTest(validated.assessmentTestId, validated.justification as any);
  });

  // --- SOA executors ---

  executors.set('CREATE_SOA', (p, userId) => {
    const validated = validatePayload(CreateSOAPayload, p, 'CREATE_SOA');
    return soaService.create({
      version: validated.version as any,
      name: validated.name as any,
      notes: validated.notes,
      organisationId: validated.organisationId,
      createdById: userId,
    });
  });

  executors.set('CREATE_SOA_FROM_CONTROLS', (p, userId) => {
    const validated = validatePayload(CreateSOAPayload, p, 'CREATE_SOA_FROM_CONTROLS');
    return soaService.createFromControls({
      version: validated.version as any,
      name: validated.name as any,
      notes: validated.notes,
      organisationId: validated.organisationId,
      createdById: userId,
    });
  });

  executors.set('CREATE_SOA_VERSION', (p, userId) => {
    const validated = validatePayload(CreateSOAVersionPayload, p, 'CREATE_SOA_VERSION');
    return soaService.createNewVersion(validated.sourceSoaId, {
      version: (validated.newVersion || validated.version) as any,
      name: validated.name as any,
      notes: validated.notes,
      createdById: userId,
    });
  });

  executors.set('UPDATE_SOA', (p, userId) => {
    const validated = validatePayload(UpdateSOAPayload, p, 'UPDATE_SOA');
    return soaService.update(validated.soaId, {
      name: validated.name as any,
      notes: validated.notes,
      updatedById: userId,
    });
  });

  executors.set('SUBMIT_SOA_REVIEW', (p, userId) => {
    const validated = validatePayload(SOAIdPayload, p, 'SUBMIT_SOA_REVIEW');
    return soaService.submitForReview(validated.soaId, userId);
  });

  executors.set('APPROVE_SOA', (p, userId) => {
    const validated = validatePayload(SOAIdPayload, p, 'APPROVE_SOA');
    return soaService.approve(validated.soaId, userId);
  });

  executors.set('DELETE_SOA', (p) => {
    const validated = validatePayload(SOAIdPayload, p, 'DELETE_SOA');
    return soaService.delete(validated.soaId);
  });

  executors.set('UPDATE_SOA_ENTRY', (p) => {
    const validated = validatePayload(UpdateSOAEntryPayload, p, 'UPDATE_SOA_ENTRY');
    return soaEntryService.updateEntry(validated.soaEntryId, {
      applicable: validated.applicable,
      justificationIfNa: validated.justificationIfNa,
      implementationStatus: validated.implementationStatus as any, // Prisma enum
      implementationDesc: validated.implementationDesc,
      parentRiskId: validated.parentRiskId,
      scenarioIds: validated.scenarioIds as any,
    });
  });

  // --- Scope executors ---

  executors.set('CREATE_SCOPE_ITEM', (p, userId) => {
    const validated = validatePayload(CreateScopeItemPayload, p, 'CREATE_SCOPE_ITEM');
    return scopeItemService.create(prepareCreatePayload(validated) as any, userId);
  });

  executors.set('UPDATE_SCOPE_ITEM', (p) => {
    const { scopeItemId, ...data } = validatePayload(UpdateScopeItemPayload, p, 'UPDATE_SCOPE_ITEM');
    return scopeItemService.update(scopeItemId, stripMcpMeta(data));
  });

  executors.set('DELETE_SCOPE_ITEM', (p) => {
    const validated = validatePayload(DeleteScopeItemPayload, p, 'DELETE_SCOPE_ITEM');
    return scopeItemService.delete(validated.scopeItemId);
  });

  // --- Remediation executors ---

  executors.set('CREATE_REMEDIATION', (p, userId) => {
    const validated = validatePayload(CreateRemediationPayload, p, 'CREATE_REMEDIATION');
    return treatmentPlanService.createAction({
      ...prepareCreatePayload(validated),
      createdById: userId,
    } as any);
  });

  // --- Metric executors ---

  executors.set('UPDATE_METRIC_VALUE', (p, userId) => {
    const validated = validatePayload(UpdateMetricValuePayload, p, 'UPDATE_METRIC_VALUE');
    return prismaService.$transaction(async (tx) => {
      // Record the history entry
      await tx.controlMetricHistory.create({
        data: {
          metricId: validated.metricId,
          value: String(validated.value),
          status: validated.status as any, // Prisma enum
          measuredAt: new Date(),
          measuredBy: userId,
          notes: validated.notes,
        },
      });
      // Update the metric's current value
      return tx.controlMetric.update({
        where: { id: validated.metricId },
        data: {
          currentValue: String(validated.value),
          status: validated.status as any, // Prisma enum
          lastMeasured: new Date(),
        },
      });
    });
  });
}
