import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

/**
 * Parse an untyped MCP executor payload against a Zod schema.
 * Throws a descriptive error on validation failure so the approval queue
 * surfaces the problem instead of silently passing bad data to Prisma.
 */
export function validatePayload<T>(
  schema: z.ZodType<T>,
  payload: Record<string, unknown>,
  actionType: string,
): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `Invalid payload for ${actionType}: ${result.error.message}`,
    );
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// Risk schemas
// ---------------------------------------------------------------------------

export const CreateRiskPayload = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    organisationId: z.string(),
    category: z.string().optional(),
    riskSource: z.string().optional(),
    owner: z.string().optional(),
    ownerId: z.string().optional(),
  })
  .passthrough();

export const UpdateRiskPayload = z
  .object({
    riskId: z.string(),
  })
  .passthrough();

export const CreateScenarioPayload = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    organisationId: z.string(),
    riskId: z.string().optional(),
  })
  .passthrough();

export const TransitionScenarioPayload = z
  .object({
    scenarioId: z.string(),
    targetStatus: z.string(),
  })
  .passthrough();

export const AssessScenarioPayload = z
  .object({
    scenarioId: z.string(),
    assessmentType: z.string(),
    likelihood: z.string(),
    impact: z.string(),
  })
  .passthrough();

export const LinkScenarioControlPayload = z
  .object({
    scenarioId: z.string(),
    controlId: z.string(),
    effectivenessWeight: z.number().optional(),
    isPrimaryControl: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const CreateKRIPayload = z
  .object({
    organisationId: z.string(),
  })
  .passthrough();

export const RecordKRIValuePayload = z
  .object({
    kriId: z.string(),
    value: z.number(),
    notes: z.string().optional(),
  })
  .passthrough();

export const CreateRTSPayload = z
  .object({
    organisationId: z.string(),
  })
  .passthrough();

export const ApproveRTSPayload = z
  .object({
    rtsId: z.string(),
  })
  .passthrough();

export const CreateTreatmentPlanPayload = z
  .object({
    organisationId: z.string(),
  })
  .passthrough();

export const CreateTreatmentActionPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Control schemas
// ---------------------------------------------------------------------------

export const CreateControlPayload = z
  .object({
    title: z.string().optional(),
    organisationId: z.string(),
  })
  .passthrough();

export const UpdateControlPayload = z
  .object({
    controlId: z.string(),
  })
  .passthrough();

export const UpdateControlStatusPayload = z
  .object({
    controlId: z.string(),
  })
  .passthrough();

export const DisableControlPayload = z
  .object({
    controlId: z.string(),
    disableReason: z.string().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

export const EnableControlPayload = z
  .object({
    controlId: z.string(),
  })
  .passthrough();

export const CreateAssessmentPayload = z
  .object({
    organisationId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    assessmentRef: z.string().optional(),
    leadTesterId: z.string().optional(),
    reviewerId: z.string().optional(),
    plannedStartDate: z.string().optional(),
    plannedEndDate: z.string().optional(),
    dueDate: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    controlIds: z.array(z.string()).optional(),
    scopeItemIds: z.array(z.string()).optional(),
  })
  .passthrough();

export const UpdateAssessmentPayload = z
  .object({
    assessmentId: z.string(),
    plannedStartDate: z.string().optional(),
    plannedEndDate: z.string().optional(),
    dueDate: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
  })
  .passthrough();

export const AssessmentIdPayload = z
  .object({
    assessmentId: z.string(),
  })
  .passthrough();

export const CompleteAssessmentPayload = z
  .object({
    assessmentId: z.string(),
    reviewNotes: z.string().optional(),
  })
  .passthrough();

export const CancelAssessmentPayload = z
  .object({
    assessmentId: z.string(),
    cancelReason: z.string().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

export const AssessmentControlsPayload = z
  .object({
    assessmentId: z.string(),
    controlIds: z.array(z.string()),
  })
  .passthrough();

export const RemoveAssessmentControlPayload = z
  .object({
    assessmentId: z.string(),
    controlId: z.string(),
  })
  .passthrough();

export const AssessmentScopeItemsPayload = z
  .object({
    assessmentId: z.string(),
    scopeItemIds: z.array(z.string()),
  })
  .passthrough();

export const RemoveAssessmentScopeItemPayload = z
  .object({
    assessmentId: z.string(),
    scopeItemId: z.string(),
  })
  .passthrough();

export const RecordTestResultPayload = z
  .object({
    assessmentTestId: z.string(),
    result: z.string(),
    findings: z.string().optional(),
    recommendations: z.string().optional(),
    assignedTesterId: z.string().optional(),
  })
  .passthrough();

export const BulkAssignTestsPayload = z
  .object({
    testIds: z.array(z.string()),
    assignedTesterId: z.string().optional(),
    ownerId: z.string().optional(),
    assessorId: z.string().optional(),
    testMethod: z.string().optional(),
  })
  .passthrough();

export const UpdateTestPayload = z
  .object({
    assessmentTestId: z.string(),
    testMethod: z.string().optional(),
    ownerId: z.string().optional(),
    assessorId: z.string().optional(),
    assignedTesterId: z.string().optional(),
  })
  .passthrough();

export const AssignTesterPayload = z
  .object({
    assessmentTestId: z.string(),
    testerId: z.string(),
  })
  .passthrough();

export const UpdateRootCausePayload = z
  .object({
    assessmentTestId: z.string(),
    rootCause: z.string().optional(),
    rootCauseNotes: z.string().optional(),
    remediationEffort: z.string().optional(),
    estimatedHours: z.number().optional(),
    estimatedCost: z.number().optional(),
  })
  .passthrough();

export const SkipTestPayload = z
  .object({
    assessmentTestId: z.string(),
    justification: z.string(),
  })
  .passthrough();

export const CreateSOAPayload = z
  .object({
    version: z.string().optional(),
    name: z.string().optional(),
    notes: z.string().optional(),
    organisationId: z.string(),
  })
  .passthrough();

export const CreateSOAVersionPayload = z
  .object({
    sourceSoaId: z.string(),
    newVersion: z.string().optional(),
    version: z.string().optional(),
    name: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const UpdateSOAPayload = z
  .object({
    soaId: z.string(),
    name: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const SOAIdPayload = z
  .object({
    soaId: z.string(),
  })
  .passthrough();

export const UpdateSOAEntryPayload = z
  .object({
    soaEntryId: z.string(),
    applicable: z.boolean().optional(),
    justificationIfNa: z.string().optional(),
    implementationStatus: z.string().optional(),
    implementationDesc: z.string().optional(),
    parentRiskId: z.string().optional(),
    scenarioIds: z.array(z.string()).optional(),
  })
  .passthrough();

export const CreateScopeItemPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const UpdateScopeItemPayload = z
  .object({
    scopeItemId: z.string(),
  })
  .passthrough();

export const DeleteScopeItemPayload = z
  .object({
    scopeItemId: z.string(),
  })
  .passthrough();

export const CreateRemediationPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const UpdateMetricValuePayload = z
  .object({
    metricId: z.string(),
    value: z.number(),
    status: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Audit (Nonconformity) schemas
// ---------------------------------------------------------------------------

export const CreateNonconformityPayload = z
  .object({
    organisationId: z.string(),
  })
  .passthrough();

export const UpdateNonconformityPayload = z
  .object({
    ncId: z.string(),
  })
  .passthrough();

export const TransitionNonconformityPayload = z
  .object({
    ncId: z.string(),
    targetStatus: z.string(),
  })
  .passthrough();

export const NCIdPayload = z
  .object({
    ncId: z.string(),
  })
  .passthrough();

export const ApproveCapPayload = z
  .object({
    ncId: z.string(),
    approvalComments: z.string().optional(),
  })
  .passthrough();

export const RejectCapPayload = z
  .object({
    ncId: z.string(),
    rejectionReason: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Incident schemas
// ---------------------------------------------------------------------------

export const CreateIncidentPayload = z
  .object({
    organisationId: z.string(),
    detectedAt: z.string().optional(),
  })
  .passthrough();

export const UpdateIncidentPayload = z
  .object({
    incidentId: z.string(),
  })
  .passthrough();

export const TransitionIncidentPayload = z
  .object({
    incidentId: z.string(),
    targetStatus: z.string(),
    notes: z.string().optional(),
  })
  .passthrough();

export const CloseIncidentPayload = z
  .object({
    incidentId: z.string(),
    notes: z.string().optional(),
  })
  .passthrough();

export const AddIncidentAssetPayload = z
  .object({
    incidentId: z.string(),
    assetId: z.string(),
    impactType: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const LinkIncidentControlPayload = z
  .object({
    incidentId: z.string(),
    controlId: z.string(),
    linkType: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const AddTimelineEntryPayload = z
  .object({
    incidentId: z.string(),
    timestamp: z.string().optional(),
    entryType: z.string(),
    title: z.string(),
    description: z.string().optional(),
    visibility: z.string().optional(),
    sourceSystem: z.string().optional(),
  })
  .passthrough();

export const CreateLessonLearnedPayload = z
  .object({
    incidentId: z.string(),
    category: z.string(),
    observation: z.string(),
    recommendation: z.string().optional(),
    priority: z.string().optional(),
    targetDate: z.string().optional(),
    completedDate: z.string().optional(),
    status: z.string().optional(),
    assignedToId: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Evidence schemas
// ---------------------------------------------------------------------------

export const CreateEvidencePayload = z
  .object({
    organisationId: z.string(),
  })
  .passthrough();

export const UpdateEvidencePayload = z
  .object({
    evidenceId: z.string(),
  })
  .passthrough();

export const LinkEvidencePayload = z
  .object({
    evidenceId: z.string(),
    targetType: z.string(),
    targetId: z.string(),
    linkType: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const CreateEvidenceRequestPayload = z
  .object({
    organisationId: z.string(),
    dueDate: z.string().optional(),
  })
  .passthrough();

export const FulfillEvidenceRequestPayload = z
  .object({
    requestId: z.string(),
    evidenceId: z.string(),
    notes: z.string().optional(),
  })
  .passthrough();

export const CloseEvidenceRequestPayload = z
  .object({
    requestId: z.string(),
    action: z.string().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// ITSM schemas
// ---------------------------------------------------------------------------

export const UpdateChangePayload = z
  .object({
    changeId: z.string(),
  })
  .passthrough();

export const ApproveChangePayload = z
  .object({
    changeId: z.string(),
    comments: z.string().optional(),
  })
  .passthrough();

export const RejectChangePayload = z
  .object({
    changeId: z.string(),
    rejectionReason: z.string(),
  })
  .passthrough();

export const ImplementChangePayload = z
  .object({
    changeId: z.string(),
    implementationNotes: z.string().optional(),
    actualStart: z.string().optional(),
  })
  .passthrough();

export const CompleteChangePayload = z
  .object({
    changeId: z.string(),
    successful: z.boolean(),
    completionNotes: z.string().optional(),
    testResults: z.string().optional(),
    lessonsLearned: z.string().optional(),
    pirRequired: z.boolean().optional(),
    pirNotes: z.string().optional(),
  })
  .passthrough();

export const CancelChangePayload = z
  .object({
    changeId: z.string(),
    cancellationReason: z.string(),
  })
  .passthrough();

export const UpdateCapacityPlanPayload = z
  .object({
    capacityPlanId: z.string(),
  })
  .passthrough();

export const CreateAssetPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const UpdateAssetPayload = z
  .object({
    assetId: z.string(),
  })
  .passthrough();

export const DeleteAssetPayload = z
  .object({
    assetId: z.string(),
  })
  .passthrough();

export const CreateAssetRelationshipPayload = z
  .object({
    fromAssetId: z.string(),
    toAssetId: z.string(),
    relationshipType: z.string(),
    isCritical: z.boolean().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const LinkAssetControlPayload = z
  .object({
    assetId: z.string(),
    controlId: z.string(),
    status: z.string().optional(),
    implementationNotes: z.string().optional(),
    implementedDate: z.string().optional(),
    evidenceUrl: z.string().optional(),
    lastVerified: z.string().optional(),
  })
  .passthrough();

export const LinkAssetRiskPayload = z
  .object({
    assetId: z.string(),
    riskId: z.string(),
    impactLevel: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const CreateChangePayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const CreateCapacityPlanPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Organisation schemas
// ---------------------------------------------------------------------------

export const UpdateOrgProfilePayload = z
  .object({
    organisationId: z.string(),
  })
  .passthrough();

export const CreateDepartmentPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const UpdateDepartmentPayload = z
  .object({
    departmentId: z.string(),
  })
  .passthrough();

export const CreateLocationPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const UpdateLocationPayload = z
  .object({
    locationId: z.string(),
  })
  .passthrough();

export const CreateBusinessProcessPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const UpdateBusinessProcessPayload = z
  .object({
    processId: z.string(),
  })
  .passthrough();

export const CreateCommitteePayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const UpdateCommitteePayload = z
  .object({
    committeeId: z.string(),
  })
  .passthrough();

export const CreateCommitteeMeetingPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const CreateExternalDependencyPayload = z
  .object({
    organisationId: z.string().optional(),
  })
  .passthrough();

export const UpdateExternalDependencyPayload = z
  .object({
    dependencyId: z.string(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Policy schemas
// ---------------------------------------------------------------------------

export const CreatePolicyPayload = z
  .object({
    organisationId: z.string(),
  })
  .passthrough();

export const UpdatePolicyPayload = z
  .object({
    documentId: z.string(),
  })
  .passthrough();

export const PolicyDocumentIdPayload = z
  .object({
    documentId: z.string(),
  })
  .passthrough();

export const CreatePolicyExceptionPayload = z
  .object({
    organisationId: z.string().optional(),
    expiryDate: z.string().optional(),
    startDate: z.string().optional(),
  })
  .passthrough();

export const ApprovePolicyExceptionPayload = z
  .object({
    exceptionId: z.string(),
    approvalComments: z.string().optional(),
  })
  .passthrough();

export const CreatePolicyChangeRequestPayload = z
  .object({
    organisationId: z.string().optional(),
    targetDate: z.string().optional(),
  })
  .passthrough();
