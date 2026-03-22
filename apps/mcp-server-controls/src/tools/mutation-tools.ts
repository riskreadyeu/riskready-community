import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpActionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { createPendingAction, getDefaultOrganisationId, withErrorHandling, zId, zSessionId, zOrgId, zReason } from '#mcp-shared';

// ========================================
// ASSESSMENT MUTATIONS
// ========================================

function registerAssessmentMutations(server: McpServer) {
  server.tool(
    'propose_assessment',
    'Propose creating a new control assessment. The proposal goes into an approval queue for human review before execution. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      organisationId: zOrgId,
      assessmentRef: z.string().max(200).describe('Assessment reference ID (e.g. "ASM-2026-001")'),
      title: z.string().max(500).describe('Assessment title'),
      description: z.string().max(5000).optional().describe('Assessment description'),
      leadTesterId: zId.optional().describe('Lead tester user ID'),
      reviewerId: zId.optional().describe('Reviewer user ID'),
      plannedStartDate: z.string().datetime().optional().describe('Planned start date (ISO 8601)'),
      plannedEndDate: z.string().datetime().optional().describe('Planned end date (ISO 8601)'),
      dueDate: z.string().datetime().optional().describe('Due date (ISO 8601)'),
      periodStart: z.string().datetime().optional().describe('Period under test start date (ISO 8601)'),
      periodEnd: z.string().datetime().optional().describe('Period under test end date (ISO 8601)'),
      actualStartDate: z.string().datetime().optional().describe('Actual start date (ISO 8601)'),
      actualEndDate: z.string().datetime().optional().describe('Actual end date (ISO 8601)'),
      controlIds: z.array(z.string()).max(500).optional().describe('Control UUIDs to include in scope'),
      scopeItemIds: z.array(z.string()).max(500).optional().describe('Scope item UUIDs to include'),
      status: z.string().max(200).optional().describe('Initial assessment status'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_assessment', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_ASSESSMENT,
        summary: `Create assessment "${params.title}" (${params.assessmentRef})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_assessment',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_assessment',
    'Propose updating assessment details (title, dates, team). Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      title: z.string().max(500).optional().describe('New title'),
      description: z.string().max(5000).optional().describe('New description'),
      leadTesterId: zId.optional().describe('Lead tester user ID'),
      reviewerId: zId.optional().describe('Reviewer user ID'),
      plannedStartDate: z.string().datetime().optional().describe('New planned start date (ISO 8601)'),
      plannedEndDate: z.string().datetime().optional().describe('New planned end date (ISO 8601)'),
      dueDate: z.string().datetime().optional().describe('New due date (ISO 8601)'),
      periodStart: z.string().datetime().optional().describe('New period start date (ISO 8601)'),
      periodEnd: z.string().datetime().optional().describe('New period end date (ISO 8601)'),
      actualStartDate: z.string().datetime().optional().describe('Actual start date (ISO 8601)'),
      actualEndDate: z.string().datetime().optional().describe('Actual end date (ISO 8601)'),
      status: z.string().max(200).optional().describe('New assessment status'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_assessment', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_ASSESSMENT,
        summary: `Update assessment ${assessment.assessmentRef} (${assessment.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_assessment',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_delete_assessment',
    'Propose deleting a draft assessment. Only DRAFT assessments can be deleted. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_delete_assessment', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, status: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }
      if (assessment.status !== 'DRAFT') {
        return { content: [{ type: 'text' as const, text: `Assessment ${assessment.assessmentRef} is ${assessment.status} — only DRAFT assessments can be deleted` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.DELETE_ASSESSMENT,
        summary: `Delete draft assessment ${assessment.assessmentRef} (${assessment.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_delete_assessment',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_start_assessment',
    'Propose starting a draft assessment (DRAFT → IN_PROGRESS). Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_start_assessment', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, status: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }
      if (assessment.status !== 'DRAFT') {
        return { content: [{ type: 'text' as const, text: `Assessment ${assessment.assessmentRef} is ${assessment.status} — must be DRAFT to start` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.START_ASSESSMENT,
        summary: `Start assessment ${assessment.assessmentRef} (DRAFT → IN_PROGRESS)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_start_assessment',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_submit_assessment_review',
    'Propose submitting an assessment for review (IN_PROGRESS → UNDER_REVIEW). Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_submit_assessment_review', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, status: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }
      if (assessment.status !== 'IN_PROGRESS') {
        return { content: [{ type: 'text' as const, text: `Assessment ${assessment.assessmentRef} is ${assessment.status} — must be IN_PROGRESS to submit for review` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.SUBMIT_ASSESSMENT_REVIEW,
        summary: `Submit assessment ${assessment.assessmentRef} for review (IN_PROGRESS → UNDER_REVIEW)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_submit_assessment_review',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_complete_assessment',
    'Propose completing an assessment under review (UNDER_REVIEW → COMPLETED). Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      reviewNotes: z.string().max(2000).optional().describe('Review notes'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_complete_assessment', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, status: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }
      if (assessment.status !== 'UNDER_REVIEW') {
        return { content: [{ type: 'text' as const, text: `Assessment ${assessment.assessmentRef} is ${assessment.status} — must be UNDER_REVIEW to complete` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.COMPLETE_ASSESSMENT,
        summary: `Complete assessment ${assessment.assessmentRef} (UNDER_REVIEW → COMPLETED)`,
        reason: params.reason,
        payload: { ...params, reviewNotes: params.reviewNotes },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_complete_assessment',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_cancel_assessment',
    'Propose cancelling an assessment. Cannot cancel already COMPLETED or CANCELLED assessments. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      cancelReason: z.string().max(1000).optional().describe('Reason for cancellation'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_cancel_assessment', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, status: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }
      if (assessment.status === 'COMPLETED' || assessment.status === 'CANCELLED') {
        return { content: [{ type: 'text' as const, text: `Assessment ${assessment.assessmentRef} is ${assessment.status} — cannot cancel` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CANCEL_ASSESSMENT,
        summary: `Cancel assessment ${assessment.assessmentRef} (${assessment.status} → CANCELLED)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_cancel_assessment',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_add_assessment_controls',
    'Propose adding controls to an assessment scope. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      controlIds: z.array(z.string()).max(500).describe('Control UUIDs to add'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_add_assessment_controls', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.ADD_ASSESSMENT_CONTROLS,
        summary: `Add ${params.controlIds.length} control(s) to assessment ${assessment.assessmentRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_add_assessment_controls',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_remove_assessment_control',
    'Propose removing a control from an assessment scope. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      controlId: zId.describe('Control UUID to remove'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_remove_assessment_control', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.REMOVE_ASSESSMENT_CONTROL,
        summary: `Remove control from assessment ${assessment.assessmentRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_remove_assessment_control',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_add_assessment_scope_items',
    'Propose adding scope items to an assessment. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      scopeItemIds: z.array(z.string()).max(500).describe('Scope item UUIDs to add'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_add_assessment_scope_items', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.ADD_ASSESSMENT_SCOPE_ITEMS,
        summary: `Add ${params.scopeItemIds.length} scope item(s) to assessment ${assessment.assessmentRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_add_assessment_scope_items',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_remove_assessment_scope_item',
    'Propose removing a scope item from an assessment. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      scopeItemId: zId.describe('Scope item UUID to remove'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_remove_assessment_scope_item', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        select: { id: true, assessmentRef: true, title: true, organisationId: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.REMOVE_ASSESSMENT_SCOPE_ITEM,
        summary: `Remove scope item from assessment ${assessment.assessmentRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_remove_assessment_scope_item',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_populate_tests',
    'Propose auto-generating tests for an assessment based on its controls in scope. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentId: zId.describe('Assessment UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_populate_tests', async (params) => {
      const assessment = await prisma.assessment.findUnique({
        where: { id: params.assessmentId },
        include: { controls: true },
      });
      if (!assessment) {
        return { content: [{ type: 'text' as const, text: `Assessment ${params.assessmentId} not found` }], isError: true };
      }
      if (assessment.controls.length === 0) {
        return { content: [{ type: 'text' as const, text: `Assessment ${assessment.assessmentRef} has no controls in scope — add controls first` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.POPULATE_ASSESSMENT_TESTS,
        summary: `Populate tests for assessment ${assessment.assessmentRef} (${assessment.controls.length} controls in scope)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_populate_tests',
        organisationId: assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_bulk_assign_tests',
    'Propose bulk-assigning tests to testers, owners, or assessors. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      testIds: z.array(z.string()).max(500).describe('Assessment test UUIDs to update'),
      assignedTesterId: zId.optional().describe('Assigned tester user ID'),
      ownerId: zId.optional().describe('Owner user ID'),
      assessorId: zId.optional().describe('Assessor user ID'),
      testMethod: z.string().max(200).optional().describe('Test method to set'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_bulk_assign_tests', async (params) => {
      // Get org from first test
      const firstTest = await prisma.assessmentTest.findFirst({
        where: { id: { in: params.testIds } },
        include: { assessment: { select: { organisationId: true } } },
      });
      if (!firstTest) {
        return { content: [{ type: 'text' as const, text: 'No valid test IDs provided' }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.BULK_ASSIGN_TESTS,
        summary: `Bulk assign ${params.testIds.length} test(s)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_bulk_assign_tests',
        organisationId: firstTest.assessment.organisationId,
      });
    }),
  );
}

// ========================================
// SOA MUTATIONS
// ========================================

function registerSoaMutations(server: McpServer) {
  server.tool(
    'propose_soa_entry_update',
    'Propose updating an SOA entry — change applicability or implementation status. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      soaEntryId: zId.describe('SOAEntry UUID'),
      applicable: z.boolean().optional().describe('Change applicability'),
      implementationStatus: z.enum(['NOT_STARTED', 'PARTIAL', 'IMPLEMENTED']).optional().describe('New implementation status'),
      implementationDesc: z.string().max(5000).optional().describe('Implementation description'),
      justificationIfNa: z.string().max(5000).optional().describe('Justification if marking not applicable'),
      controlRecordId: zId.optional().describe('Control record ID'),
      parentRiskId: zId.optional().describe('Parent risk ID for mapping'),
      scenarioIds: z.string().max(200).optional().describe('Comma-separated scenario IDs (e.g. "R-001-S01, R-001-S02")'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_soa_entry_update', async (params) => {
      // Validate SOA entry exists
      const entry = await prisma.sOAEntry.findUnique({
        where: { id: params.soaEntryId },
        include: { soa: { select: { organisationId: true } } },
      });
      if (!entry) {
        return { content: [{ type: 'text' as const, text: `SOA entry ${params.soaEntryId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_SOA_ENTRY,
        summary: `Update SOA entry for control ${entry.controlId}: ${[
          params.applicable !== undefined ? `applicable=${params.applicable}` : '',
          params.implementationStatus ? `status=${params.implementationStatus}` : '',
        ].filter(Boolean).join(', ') || 'no changes specified'}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_soa_entry_update',
        organisationId: entry.soa.organisationId,
      });
    }),
  );

  server.tool(
    'propose_create_soa',
    'Propose creating a new empty Statement of Applicability. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      version: z.string().max(200).describe('SOA version identifier (e.g. "1.0", "2024-Q1")'),
      name: z.string().max(500).optional().describe('SOA name'),
      notes: z.string().max(2000).optional().describe('SOA notes'),
      organisationId: zOrgId,
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_soa', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_SOA,
        summary: `Create SOA version ${params.version}${params.name ? ` (${params.name})` : ''}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_soa',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_create_soa_from_controls',
    'Propose creating a new SOA pre-populated with entries from all applicable controls. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      version: z.string().max(200).describe('SOA version identifier'),
      name: z.string().max(500).optional().describe('SOA name'),
      organisationId: zOrgId,
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_soa_from_controls', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_SOA_FROM_CONTROLS,
        summary: `Create SOA version ${params.version} from current control library`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_soa_from_controls',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_create_soa_version',
    'Propose creating a new SOA version by copying entries from an existing SOA. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      sourceSoaId: zId.describe('Source SOA UUID to copy from'),
      newVersion: z.string().max(200).describe('New version identifier'),
      name: z.string().max(500).optional().describe('New SOA name'),
      notes: z.string().max(2000).optional().describe('New SOA notes'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_soa_version', async (params) => {
      const sourceSoa = await prisma.statementOfApplicability.findUnique({
        where: { id: params.sourceSoaId },
        select: { id: true, version: true, organisationId: true },
      });
      if (!sourceSoa) {
        return { content: [{ type: 'text' as const, text: `Source SOA ${params.sourceSoaId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_SOA_VERSION,
        summary: `Create SOA version ${params.newVersion} from ${sourceSoa.version}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_soa_version',
        organisationId: sourceSoa.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_soa',
    'Propose updating SOA metadata (name, notes). Only DRAFT SOAs can be updated. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      soaId: zId.describe('SOA UUID'),
      name: z.string().max(500).optional().describe('New SOA name'),
      notes: z.string().max(2000).optional().describe('New SOA notes'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_soa', async (params) => {
      const soa = await prisma.statementOfApplicability.findUnique({
        where: { id: params.soaId },
        select: { id: true, version: true, status: true, organisationId: true },
      });
      if (!soa) {
        return { content: [{ type: 'text' as const, text: `SOA ${params.soaId} not found` }], isError: true };
      }
      if (soa.status !== 'DRAFT') {
        return { content: [{ type: 'text' as const, text: `SOA ${soa.version} is ${soa.status} — only DRAFT SOAs can be updated` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_SOA,
        summary: `Update SOA ${soa.version} metadata`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_soa',
        organisationId: soa.organisationId,
      });
    }),
  );

  server.tool(
    'propose_submit_soa_review',
    'Propose submitting an SOA for review (DRAFT → PENDING_REVIEW). Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      soaId: zId.describe('SOA UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_submit_soa_review', async (params) => {
      const soa = await prisma.statementOfApplicability.findUnique({
        where: { id: params.soaId },
        select: { id: true, version: true, status: true, organisationId: true },
      });
      if (!soa) {
        return { content: [{ type: 'text' as const, text: `SOA ${params.soaId} not found` }], isError: true };
      }
      if (soa.status !== 'DRAFT') {
        return { content: [{ type: 'text' as const, text: `SOA ${soa.version} is ${soa.status} — must be DRAFT to submit for review` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.SUBMIT_SOA_REVIEW,
        summary: `Submit SOA ${soa.version} for review (DRAFT → PENDING_REVIEW)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_submit_soa_review',
        organisationId: soa.organisationId,
      });
    }),
  );

  server.tool(
    'propose_approve_soa',
    'Propose approving an SOA under review (PENDING_REVIEW → APPROVED). Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      soaId: zId.describe('SOA UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_approve_soa', async (params) => {
      const soa = await prisma.statementOfApplicability.findUnique({
        where: { id: params.soaId },
        select: { id: true, version: true, status: true, organisationId: true },
      });
      if (!soa) {
        return { content: [{ type: 'text' as const, text: `SOA ${params.soaId} not found` }], isError: true };
      }
      if (soa.status !== 'PENDING_REVIEW') {
        return { content: [{ type: 'text' as const, text: `SOA ${soa.version} is ${soa.status} — must be PENDING_REVIEW to approve` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.APPROVE_SOA,
        summary: `Approve SOA ${soa.version} (PENDING_REVIEW → APPROVED)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_approve_soa',
        organisationId: soa.organisationId,
      });
    }),
  );

  server.tool(
    'propose_delete_soa',
    'Propose deleting a draft SOA. Only DRAFT SOAs can be deleted. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      soaId: zId.describe('SOA UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_delete_soa', async (params) => {
      const soa = await prisma.statementOfApplicability.findUnique({
        where: { id: params.soaId },
        select: { id: true, version: true, status: true, organisationId: true },
      });
      if (!soa) {
        return { content: [{ type: 'text' as const, text: `SOA ${params.soaId} not found` }], isError: true };
      }
      if (soa.status !== 'DRAFT') {
        return { content: [{ type: 'text' as const, text: `SOA ${soa.version} is ${soa.status} — only DRAFT SOAs can be deleted` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.DELETE_SOA,
        summary: `Delete draft SOA ${soa.version}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_delete_soa',
        organisationId: soa.organisationId,
      });
    }),
  );
}

// ========================================
// SCOPE ITEM MUTATIONS
// ========================================

function registerScopeMutations(server: McpServer) {
  server.tool(
    'propose_scope_item',
    'Propose adding a new scope item (application, asset class, location, etc.) for assessment testing. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      organisationId: zOrgId,
      scopeType: z.enum(['APPLICATION', 'ASSET_CLASS', 'LOCATION', 'PERSONNEL_TYPE', 'BUSINESS_UNIT', 'PLATFORM', 'PROVIDER', 'NETWORK_ZONE', 'PROCESS']).describe('Scope type'),
      code: z.string().max(200).describe('Unique scope item code (e.g. "APP-001", "LOC-HQ")'),
      name: z.string().max(500).describe('Scope item name'),
      description: z.string().max(5000).optional().describe('Description'),
      criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM').describe('Criticality level'),
      isActive: z.boolean().optional().describe('Whether the scope item is active'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_scope_item', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_SCOPE_ITEM,
        summary: `Create scope item ${params.code} (${params.name}) — ${params.scopeType}, ${params.criticality} criticality`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_scope_item',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_scope_item',
    'Propose updating a scope item\'s details. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      scopeItemId: zId.describe('Scope item UUID'),
      name: z.string().max(500).optional().describe('New name'),
      description: z.string().max(5000).optional().describe('New description'),
      criticality: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('New criticality level'),
      isActive: z.boolean().optional().describe('Active status'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_scope_item', async (params) => {
      const item = await prisma.scopeItem.findUnique({
        where: { id: params.scopeItemId },
        select: { id: true, code: true, name: true, organisationId: true },
      });
      if (!item) {
        return { content: [{ type: 'text' as const, text: `Scope item ${params.scopeItemId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_SCOPE_ITEM,
        summary: `Update scope item ${item.code} (${item.name})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_scope_item',
        organisationId: item.organisationId,
      });
    }),
  );

  server.tool(
    'propose_delete_scope_item',
    'Propose deleting a scope item. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      scopeItemId: zId.describe('Scope item UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_delete_scope_item', async (params) => {
      const item = await prisma.scopeItem.findUnique({
        where: { id: params.scopeItemId },
        select: { id: true, code: true, name: true, organisationId: true },
      });
      if (!item) {
        return { content: [{ type: 'text' as const, text: `Scope item ${params.scopeItemId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.DELETE_SCOPE_ITEM,
        summary: `Delete scope item ${item.code} (${item.name})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_delete_scope_item',
        organisationId: item.organisationId,
      });
    }),
  );
}

// ========================================
// TEST MUTATIONS
// ========================================

function registerTestMutations(server: McpServer) {
  server.tool(
    'propose_test_result',
    'Propose recording a test result for an assessment test. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentTestId: zId.describe('AssessmentTest UUID'),
      result: z.enum(['PASS', 'PARTIAL', 'FAIL', 'NOT_APPLICABLE']).describe('Test result'),
      findings: z.string().max(5000).optional().describe('Test findings'),
      recommendations: z.string().max(2000).optional().describe('Recommendations'),
      testMethod: z.string().max(200).optional().describe('Test method used'),
      rootCause: z.enum(['PEOPLE', 'PROCESS', 'TECHNOLOGY', 'BUDGET', 'THIRD_PARTY', 'DESIGN', 'UNKNOWN']).optional().describe('Root cause category (for FAIL/PARTIAL)'),
      rootCauseNotes: z.string().max(2000).optional().describe('Root cause notes'),
      remediationEffort: z.enum(['TRIVIAL', 'MINOR', 'MODERATE', 'MAJOR', 'STRATEGIC']).optional().describe('Remediation effort'),
      estimatedHours: z.number().max(100_000).optional().describe('Estimated hours to complete'),
      estimatedCost: z.number().max(1_000_000_000).optional().describe('Estimated cost to remediate'),
      assignedTesterId: zId.optional().describe('Assigned tester user ID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_test_result', async (params) => {
      const test = await prisma.assessmentTest.findUnique({
        where: { id: params.assessmentTestId },
        include: { assessment: { select: { organisationId: true, assessmentRef: true } } },
      });
      if (!test) {
        return { content: [{ type: 'text' as const, text: `Assessment test ${params.assessmentTestId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.RECORD_TEST_RESULT,
        summary: `Record ${params.result} result for test ${test.testCode} in ${test.assessment.assessmentRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_test_result',
        organisationId: test.assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_remediation',
    'Propose a remediation action for a failed assessment test. Creates a treatment action linked to the test. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentTestId: zId.describe('AssessmentTest UUID (the failed/partial test)'),
      title: z.string().max(500).describe('Remediation action title'),
      description: z.string().max(5000).optional().describe('Detailed description of the remediation'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM').describe('Priority level'),
      estimatedHours: z.number().int().max(100_000).optional().describe('Estimated hours to complete'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_remediation', async (params) => {
      const test = await prisma.assessmentTest.findUnique({
        where: { id: params.assessmentTestId },
        include: { assessment: { select: { organisationId: true, assessmentRef: true } } },
      });
      if (!test) {
        return { content: [{ type: 'text' as const, text: `Assessment test ${params.assessmentTestId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_REMEDIATION,
        summary: `Create remediation "${params.title}" for test ${test.testCode} (${params.priority} priority)`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_remediation',
        organisationId: test.assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_test',
    'Propose updating test assignment or method details. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentTestId: zId.describe('AssessmentTest UUID'),
      testMethod: z.string().max(200).optional().describe('New test method'),
      ownerId: zId.optional().describe('Owner user ID'),
      assessorId: zId.optional().describe('Assessor user ID'),
      assignedTesterId: zId.optional().describe('Assigned tester user ID'),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional().describe('New test status'),
      result: z.enum(['PASS', 'PARTIAL', 'FAIL', 'NOT_TESTED', 'NOT_APPLICABLE']).optional().describe('New test result'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_test', async (params) => {
      const test = await prisma.assessmentTest.findUnique({
        where: { id: params.assessmentTestId },
        include: { assessment: { select: { organisationId: true, assessmentRef: true } } },
      });
      if (!test) {
        return { content: [{ type: 'text' as const, text: `Assessment test ${params.assessmentTestId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_TEST,
        summary: `Update test ${test.testCode} in ${test.assessment.assessmentRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_test',
        organisationId: test.assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_assign_tester',
    'Propose assigning a specific tester to a test. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentTestId: zId.describe('AssessmentTest UUID'),
      testerId: zId.describe('User UUID of the tester to assign'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_assign_tester', async (params) => {
      const test = await prisma.assessmentTest.findUnique({
        where: { id: params.assessmentTestId },
        include: { assessment: { select: { organisationId: true, assessmentRef: true } } },
      });
      if (!test) {
        return { content: [{ type: 'text' as const, text: `Assessment test ${params.assessmentTestId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.ASSIGN_TESTER,
        summary: `Assign tester to test ${test.testCode} in ${test.assessment.assessmentRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_assign_tester',
        organisationId: test.assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_root_cause',
    'Propose updating root cause analysis for a failed or partial test. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentTestId: zId.describe('AssessmentTest UUID'),
      rootCause: z.enum(['PEOPLE', 'PROCESS', 'TECHNOLOGY', 'BUDGET', 'THIRD_PARTY', 'DESIGN', 'UNKNOWN']).optional().describe('Root cause category'),
      rootCauseNotes: z.string().max(2000).optional().describe('Root cause notes'),
      remediationEffort: z.enum(['TRIVIAL', 'MINOR', 'MODERATE', 'MAJOR', 'STRATEGIC']).optional().describe('Remediation effort'),
      estimatedHours: z.number().max(100_000).optional().describe('Estimated hours to remediate'),
      estimatedCost: z.number().max(1_000_000_000).optional().describe('Estimated cost to remediate'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_root_cause', async (params) => {
      const test = await prisma.assessmentTest.findUnique({
        where: { id: params.assessmentTestId },
        include: { assessment: { select: { organisationId: true, assessmentRef: true } } },
      });
      if (!test) {
        return { content: [{ type: 'text' as const, text: `Assessment test ${params.assessmentTestId} not found` }], isError: true };
      }
      if (test.result !== 'FAIL' && test.result !== 'PARTIAL') {
        return { content: [{ type: 'text' as const, text: `Test ${test.testCode} result is ${test.result} — root cause analysis only applies to FAIL or PARTIAL results` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_ROOT_CAUSE,
        summary: `Update root cause for test ${test.testCode} in ${test.assessment.assessmentRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_root_cause',
        organisationId: test.assessment.organisationId,
      });
    }),
  );

  server.tool(
    'propose_skip_test',
    'Propose skipping a test with justification. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      assessmentTestId: zId.describe('AssessmentTest UUID'),
      justification: z.string().max(1000).describe('Justification for skipping the test'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_skip_test', async (params) => {
      const test = await prisma.assessmentTest.findUnique({
        where: { id: params.assessmentTestId },
        include: { assessment: { select: { organisationId: true, assessmentRef: true } } },
      });
      if (!test) {
        return { content: [{ type: 'text' as const, text: `Assessment test ${params.assessmentTestId} not found` }], isError: true };
      }
      if (test.status !== 'PENDING' && test.status !== 'IN_PROGRESS') {
        return { content: [{ type: 'text' as const, text: `Test ${test.testCode} is ${test.status} — can only skip PENDING or IN_PROGRESS tests` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.SKIP_TEST,
        summary: `Skip test ${test.testCode} in ${test.assessment.assessmentRef}: ${params.justification}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_skip_test',
        organisationId: test.assessment.organisationId,
      });
    }),
  );
}

// ========================================
// CONTROL MUTATIONS
// ========================================

function registerControlMutations(server: McpServer) {
  server.tool(
    'propose_control_status',
    'Propose changing a control\'s implementation status or applicability. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      controlId: zId.describe('Control UUID'),
      implementationStatus: z.enum(['NOT_STARTED', 'PARTIAL', 'IMPLEMENTED']).describe('New implementation status'),
      implementationDesc: z.string().max(5000).optional().describe('Implementation description'),
      applicable: z.boolean().optional().describe('Whether the control is applicable (regulatory scope)'),
      justificationIfNa: z.string().max(5000).optional().describe('Justification when marking control as not applicable'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_control_status', async (params) => {
      const control = await prisma.control.findUnique({
        where: { id: params.controlId },
        select: { id: true, controlId: true, name: true, organisationId: true, implementationStatus: true, applicable: true },
      });
      if (!control) {
        return { content: [{ type: 'text' as const, text: `Control ${params.controlId} not found` }], isError: true };
      }

      const changes = [
        params.implementationStatus !== control.implementationStatus ? `status: ${control.implementationStatus} → ${params.implementationStatus}` : '',
        params.applicable !== undefined && params.applicable !== control.applicable ? `applicable: ${control.applicable} → ${params.applicable}` : '',
      ].filter(Boolean).join(', ');

      return createPendingAction({
        actionType: McpActionType.UPDATE_CONTROL_STATUS,
        summary: `Update control ${control.controlId} (${control.name}): ${changes || `status: ${params.implementationStatus}`}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_control_status',
        organisationId: control.organisationId,
      });
    }),
  );

  server.tool(
    'propose_create_control',
    'Propose creating a new control in the library. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      controlId: z.string().describe('Control identifier (e.g. "A.5.1")'),
      name: z.string().max(500).describe('Control name'),
      theme: z.enum(['ORGANISATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNOLOGICAL']).describe('ISO 27001 control theme'),
      description: z.string().max(5000).optional().describe('Control description'),
      framework: z.enum(['ISO', 'SOC2', 'NIS2', 'DORA']).optional().describe('Control framework'),
      sourceStandard: z.string().max(200).optional().describe('Source standard reference'),
      soc2Criteria: z.string().max(200).optional().describe('SOC2 criteria'),
      tscCategory: z.string().max(200).optional().describe('TSC category'),
      applicable: z.boolean().optional().describe('Whether control is applicable'),
      justificationIfNa: z.string().max(5000).optional().describe('Justification if not applicable'),
      implementationStatus: z.enum(['NOT_STARTED', 'PARTIAL', 'IMPLEMENTED']).optional().describe('Initial implementation status'),
      implementationDesc: z.string().max(5000).optional().describe('Implementation description'),
      organisationId: zOrgId,
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_create_control', async (params) => {
      // Check no duplicate controlId for org
      const orgId = params.organisationId || await getDefaultOrganisationId();
      const existing = await prisma.control.findFirst({
        where: { controlId: params.controlId, organisationId: orgId },
      });
      if (existing) {
        return { content: [{ type: 'text' as const, text: `Control with ID ${params.controlId} already exists for this organisation` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_CONTROL,
        summary: `Create control "${params.name}" (${params.controlId})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_control',
        organisationId: orgId,
      });
    }),
  );

  server.tool(
    'propose_update_control',
    'Propose updating an existing control\'s details. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      controlId: zId.describe('Control UUID'),
      name: z.string().max(500).optional().describe('New control name'),
      description: z.string().max(5000).optional().describe('New description'),
      theme: z.enum(['ORGANISATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNOLOGICAL']).optional().describe('New theme'),
      framework: z.enum(['ISO', 'SOC2', 'NIS2', 'DORA']).optional().describe('New framework'),
      sourceStandard: z.string().max(200).optional().describe('New source standard'),
      soc2Criteria: z.string().max(200).optional().describe('New SOC2 criteria'),
      tscCategory: z.string().max(200).optional().describe('New TSC category'),
      applicable: z.boolean().optional().describe('New applicability'),
      justificationIfNa: z.string().max(5000).optional().describe('Justification if not applicable'),
      implementationStatus: z.enum(['NOT_STARTED', 'PARTIAL', 'IMPLEMENTED']).optional().describe('New implementation status'),
      implementationDesc: z.string().max(5000).optional().describe('New implementation description'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_update_control', async (params) => {
      const control = await prisma.control.findUnique({
        where: { id: params.controlId },
        select: { id: true, controlId: true, name: true, organisationId: true },
      });
      if (!control) {
        return { content: [{ type: 'text' as const, text: `Control ${params.controlId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_CONTROL,
        summary: `Update control ${control.controlId} (${control.name})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_control',
        organisationId: control.organisationId,
      });
    }),
  );

  server.tool(
    'propose_disable_control',
    'Propose disabling a control (soft-delete). Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      controlId: zId.describe('Control UUID'),
      disableReason: z.string().max(1000).describe('Reason for disabling the control'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_disable_control', async (params) => {
      const control = await prisma.control.findUnique({
        where: { id: params.controlId },
        select: { id: true, controlId: true, name: true, organisationId: true, enabled: true },
      });
      if (!control) {
        return { content: [{ type: 'text' as const, text: `Control ${params.controlId} not found` }], isError: true };
      }
      if (!control.enabled) {
        return { content: [{ type: 'text' as const, text: `Control ${control.controlId} is already disabled` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.DISABLE_CONTROL,
        summary: `Disable control ${control.controlId}: ${params.disableReason}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_disable_control',
        organisationId: control.organisationId,
      });
    }),
  );

  server.tool(
    'propose_enable_control',
    'Propose re-enabling a disabled control. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      controlId: zId.describe('Control UUID'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_enable_control', async (params) => {
      const control = await prisma.control.findUnique({
        where: { id: params.controlId },
        select: { id: true, controlId: true, name: true, organisationId: true, enabled: true, applicable: true },
      });
      if (!control) {
        return { content: [{ type: 'text' as const, text: `Control ${params.controlId} not found` }], isError: true };
      }
      if (control.enabled) {
        return { content: [{ type: 'text' as const, text: `Control ${control.controlId} is already enabled` }], isError: true };
      }
      if (!control.applicable) {
        return { content: [{ type: 'text' as const, text: `Control ${control.controlId} is not applicable — cannot enable` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.ENABLE_CONTROL,
        summary: `Enable control ${control.controlId}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_enable_control',
        organisationId: control.organisationId,
      });
    }),
  );
}

// ========================================
// METRIC MUTATIONS
// ========================================

function registerMetricMutations(server: McpServer) {
  server.tool(
    'propose_metric_value',
    'Propose recording a new metric measurement value. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      metricId: zId.describe('ControlMetric UUID'),
      value: z.string().max(200).describe('New measurement value (e.g. "95%", "3", "14 days")'),
      status: z.enum(['GREEN', 'AMBER', 'RED']).describe('RAG status for this measurement'),
      notes: z.string().max(2000).optional().describe('Measurement notes'),
      reason: zReason,
      mcpSessionId: zSessionId,
    },
    withErrorHandling('propose_metric_value', async (params) => {
      const metric = await prisma.controlMetric.findUnique({
        where: { id: params.metricId },
        include: { control: { select: { organisationId: true, controlId: true } } },
      });
      if (!metric) {
        return { content: [{ type: 'text' as const, text: `Metric ${params.metricId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_METRIC_VALUE,
        summary: `Record metric ${metric.metricId} value: ${params.value} (${params.status})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_metric_value',
        organisationId: metric.control.organisationId,
      });
    }),
  );
}

// ========================================
// MAIN ORCHESTRATOR
// ========================================

export function registerMutationTools(server: McpServer) {
  registerAssessmentMutations(server);
  registerSoaMutations(server);
  registerScopeMutations(server);
  registerTestMutations(server);
  registerControlMutations(server);
  registerMetricMutations(server);
}
