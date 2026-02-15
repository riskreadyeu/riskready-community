import { Injectable, Logger } from '@nestjs/common';
import { McpActionType } from '@prisma/client';
import { ControlService } from '../controls/services/control.service';
import { AssessmentService } from '../controls/services/assessment.service';
import { AssessmentTestService } from '../controls/services/assessment-test.service';
import { SOAService } from '../controls/services/soa.service';
import { SOAEntryService } from '../controls/services/soa-entry.service';
import { ScopeItemService } from '../controls/services/scope-item.service';

// Payload is dynamically typed from MCP action requests - use `any` to allow property access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExecutorPayload = any;
type Executor = (payload: ExecutorPayload, reviewedById: string) => Promise<unknown>;

@Injectable()
export class McpApprovalExecutorService {
  private readonly logger = new Logger(McpApprovalExecutorService.name);
  private readonly executors = new Map<McpActionType, Executor>();

  constructor(
    private controlService: ControlService,
    private assessmentService: AssessmentService,
    private assessmentTestService: AssessmentTestService,
    private soaService: SOAService,
    private soaEntryService: SOAEntryService,
    private scopeItemService: ScopeItemService,
  ) {
    this.registerControlExecutors();
    this.registerAssessmentExecutors();
    this.registerTestExecutors();
    this.registerSOAExecutors();
    this.registerScopeExecutors();
  }

  canExecute(actionType: McpActionType): boolean {
    return this.executors.has(actionType);
  }

  async execute(actionType: McpActionType, payload: ExecutorPayload, reviewedById: string): Promise<unknown> {
    const executor = this.executors.get(actionType);
    if (!executor) {
      this.logger.warn(`No executor registered for action type: ${actionType}`);
      return null;
    }

    this.logger.log(`Executing action type: ${actionType}`);
    return executor(payload, reviewedById);
  }

  private registerControlExecutors() {
    this.executors.set('CREATE_CONTROL', (p, userId) =>
      this.controlService.create({ ...p, createdById: userId }),
    );

    this.executors.set('UPDATE_CONTROL', (p) => {
      const { controlId, ...data } = p;
      return this.controlService.update(controlId, data);
    });

    this.executors.set('UPDATE_CONTROL_STATUS', (p) => {
      const { controlId, ...data } = p;
      return this.controlService.update(controlId, data);
    });

    this.executors.set('DISABLE_CONTROL', (p, userId) =>
      this.controlService.disableControl(p.controlId, p.disableReason || p.reason || '', userId),
    );

    this.executors.set('ENABLE_CONTROL', (p, userId) =>
      this.controlService.enableControl(p.controlId, userId),
    );
  }

  private registerAssessmentExecutors() {
    this.executors.set('CREATE_ASSESSMENT', (p, userId) =>
      this.assessmentService.create({
        organisationId: p.organisationId,
        title: p.title,
        description: p.description,
        assessmentRef: p.assessmentRef,
        leadTesterId: p.leadTesterId,
        reviewerId: p.reviewerId,
        plannedStartDate: p.plannedStartDate ? new Date(p.plannedStartDate) : undefined,
        plannedEndDate: p.plannedEndDate ? new Date(p.plannedEndDate) : undefined,
        dueDate: p.dueDate ? new Date(p.dueDate) : undefined,
        periodStart: p.periodStart ? new Date(p.periodStart) : undefined,
        periodEnd: p.periodEnd ? new Date(p.periodEnd) : undefined,
        controlIds: p.controlIds,
        scopeItemIds: p.scopeItemIds,
      }, userId),
    );

    this.executors.set('UPDATE_ASSESSMENT', (p) => {
      const { assessmentId, ...data } = p;
      return this.assessmentService.update(assessmentId, {
        ...data,
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : undefined,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        periodStart: data.periodStart ? new Date(data.periodStart) : undefined,
        periodEnd: data.periodEnd ? new Date(data.periodEnd) : undefined,
      });
    });

    this.executors.set('DELETE_ASSESSMENT', (p) =>
      this.assessmentService.delete(p.assessmentId),
    );

    this.executors.set('START_ASSESSMENT', (p) =>
      this.assessmentService.startAssessment(p.assessmentId),
    );

    this.executors.set('SUBMIT_ASSESSMENT_REVIEW', (p) =>
      this.assessmentService.submitForReview(p.assessmentId),
    );

    this.executors.set('COMPLETE_ASSESSMENT', (p) =>
      this.assessmentService.completeAssessment(p.assessmentId, p.reviewNotes),
    );

    this.executors.set('CANCEL_ASSESSMENT', (p) =>
      this.assessmentService.cancelAssessment(p.assessmentId, p.cancelReason || p.reason),
    );

    this.executors.set('ADD_ASSESSMENT_CONTROLS', (p) =>
      this.assessmentService.addControls(p.assessmentId, p.controlIds),
    );

    this.executors.set('REMOVE_ASSESSMENT_CONTROL', (p) =>
      this.assessmentService.removeControl(p.assessmentId, p.controlId),
    );

    this.executors.set('ADD_ASSESSMENT_SCOPE_ITEMS', (p) =>
      this.assessmentService.addScopeItems(p.assessmentId, p.scopeItemIds),
    );

    this.executors.set('REMOVE_ASSESSMENT_SCOPE_ITEM', (p) =>
      this.assessmentService.removeScopeItem(p.assessmentId, p.scopeItemId),
    );

    this.executors.set('POPULATE_ASSESSMENT_TESTS', (p) =>
      this.assessmentService.populateTests(p.assessmentId),
    );
  }

  private registerTestExecutors() {
    this.executors.set('RECORD_TEST_RESULT', (p, userId) =>
      this.assessmentTestService.executeTest(
        p.assessmentTestId,
        {
          result: p.result,
          findings: p.findings,
          recommendations: p.recommendations,
        },
        p.assignedTesterId || userId,
      ),
    );

    this.executors.set('BULK_ASSIGN_TESTS', (p) =>
      this.assessmentTestService.bulkAssign(p.testIds, {
        assignedTesterId: p.assignedTesterId,
        ownerId: p.ownerId,
        assessorId: p.assessorId,
        testMethod: p.testMethod,
      }),
    );

    this.executors.set('UPDATE_TEST', (p) =>
      this.assessmentTestService.updateTest(p.assessmentTestId, {
        testMethod: p.testMethod,
        ownerId: p.ownerId,
        assessorId: p.assessorId,
        assignedTesterId: p.assignedTesterId,
      }),
    );

    this.executors.set('ASSIGN_TESTER', (p) =>
      this.assessmentTestService.assignTester(p.assessmentTestId, p.testerId),
    );

    this.executors.set('UPDATE_ROOT_CAUSE', (p) =>
      this.assessmentTestService.updateRootCause(p.assessmentTestId, {
        rootCause: p.rootCause,
        rootCauseNotes: p.rootCauseNotes,
        remediationEffort: p.remediationEffort,
        estimatedHours: p.estimatedHours,
        estimatedCost: p.estimatedCost,
      }),
    );

    this.executors.set('SKIP_TEST', (p) =>
      this.assessmentTestService.skipTest(p.assessmentTestId, p.justification),
    );
  }

  private registerSOAExecutors() {
    this.executors.set('CREATE_SOA', (p, userId) =>
      this.soaService.create({
        version: p.version,
        name: p.name,
        notes: p.notes,
        organisationId: p.organisationId,
        createdById: userId,
      }),
    );

    this.executors.set('CREATE_SOA_FROM_CONTROLS', (p, userId) =>
      this.soaService.createFromControls({
        version: p.version,
        name: p.name,
        notes: p.notes,
        organisationId: p.organisationId,
        createdById: userId,
      }),
    );

    this.executors.set('CREATE_SOA_VERSION', (p, userId) =>
      this.soaService.createNewVersion(p.sourceSoaId, {
        version: p.newVersion || p.version,
        name: p.name,
        notes: p.notes,
        createdById: userId,
      }),
    );

    this.executors.set('UPDATE_SOA', (p, userId) =>
      this.soaService.update(p.soaId, {
        name: p.name,
        notes: p.notes,
        updatedById: userId,
      }),
    );

    this.executors.set('SUBMIT_SOA_REVIEW', (p, userId) =>
      this.soaService.submitForReview(p.soaId, userId),
    );

    this.executors.set('APPROVE_SOA', (p, userId) =>
      this.soaService.approve(p.soaId, userId),
    );

    this.executors.set('DELETE_SOA', (p) =>
      this.soaService.delete(p.soaId),
    );

    this.executors.set('UPDATE_SOA_ENTRY', (p) =>
      this.soaEntryService.updateEntry(p.soaEntryId, {
        applicable: p.applicable,
        justificationIfNa: p.justificationIfNa,
        implementationStatus: p.implementationStatus,
        implementationDesc: p.implementationDesc,
        parentRiskId: p.parentRiskId,
        scenarioIds: p.scenarioIds,
      }),
    );
  }

  private registerScopeExecutors() {
    this.executors.set('CREATE_SCOPE_ITEM', (p, userId) =>
      this.scopeItemService.create(p, userId),
    );

    this.executors.set('UPDATE_SCOPE_ITEM', (p) => {
      const { scopeItemId, ...data } = p;
      return this.scopeItemService.update(scopeItemId, data);
    });

    this.executors.set('DELETE_SCOPE_ITEM', (p) =>
      this.scopeItemService.delete(p.scopeItemId),
    );
  }
}
