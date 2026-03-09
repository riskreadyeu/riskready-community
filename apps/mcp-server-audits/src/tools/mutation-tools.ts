import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpActionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { createPendingAction, withErrorHandling } from '#mcp-shared';

function registerNonconformityMutations(server: McpServer) {
  server.tool(
    'propose_create_nc',
    'Propose creating a new nonconformity. The proposal goes into an approval queue for human review before execution.',
    {
      ncId: z.string().describe('Nonconformity identifier (e.g. "NC-2026-001")'),
      title: z.string().describe('Nonconformity title'),
      description: z.string().describe('Detailed description of the nonconformity'),
      source: z.enum(['TEST', 'INTERNAL_AUDIT', 'EXTERNAL_AUDIT', 'CERTIFICATION_AUDIT', 'INCIDENT', 'SELF_ASSESSMENT', 'MANAGEMENT_REVIEW', 'SURVEILLANCE_AUDIT', 'ISRA_GAP']).describe('Source of the nonconformity'),
      severity: z.enum(['MAJOR', 'MINOR', 'OBSERVATION']).describe('Severity level'),
      category: z.enum(['CONTROL_FAILURE', 'DOCUMENTATION', 'PROCESS', 'TECHNICAL', 'ORGANIZATIONAL', 'TRAINING', 'RESOURCE']).describe('Nonconformity category'),
      controlId: z.string().optional().describe('Related control UUID'),
      isoClause: z.string().optional().describe('ISO clause reference (e.g. "A.5.2", "Clause 6.1")'),
      findings: z.string().optional().describe('Detailed audit findings'),
      rootCause: z.string().optional().describe('Root cause analysis'),
      impact: z.string().optional().describe('Business/security impact'),
      targetClosureDate: z.string().datetime().optional().describe('Target closure date (ISO 8601)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
    },
    withErrorHandling('propose_create_nc', async (params) => {
      // Check for duplicate ncId
      const existing = await prisma.nonconformity.findUnique({
        where: { ncId: params.ncId },
      });
      if (existing) {
        return { content: [{ type: 'text' as const, text: `Nonconformity with ID ${params.ncId} already exists` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_NONCONFORMITY,
        summary: `Create nonconformity "${params.title}" (${params.ncId}) — ${params.severity} ${params.source}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_nc',
        organisationId: params.organisationId,
      });
    },
  );

  server.tool(
    'propose_update_nc',
    'Propose updating an existing nonconformity. Requires human approval.',
    {
      ncId: z.string().describe('Nonconformity UUID to update'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      severity: z.enum(['MAJOR', 'MINOR', 'OBSERVATION']).optional().describe('New severity'),
      category: z.enum(['CONTROL_FAILURE', 'DOCUMENTATION', 'PROCESS', 'TECHNICAL', 'ORGANIZATIONAL', 'TRAINING', 'RESOURCE']).optional().describe('New category'),
      findings: z.string().optional().describe('Detailed audit findings'),
      source: z.enum(['TEST', 'INTERNAL_AUDIT', 'EXTERNAL_AUDIT', 'CERTIFICATION_AUDIT', 'INCIDENT', 'SELF_ASSESSMENT', 'MANAGEMENT_REVIEW', 'SURVEILLANCE_AUDIT', 'ISRA_GAP']).optional().describe('Updated source'),
      isoClause: z.string().optional().describe('ISO clause reference'),
      rootCause: z.string().optional().describe('Root cause analysis'),
      impact: z.string().optional().describe('Business/security impact'),
      correctiveAction: z.string().optional().describe('Corrective action plan text'),
      targetClosureDate: z.string().datetime().optional().describe('Target closure date (ISO 8601)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_update_nc', async (params) => {
      const nc = await prisma.nonconformity.findUnique({
        where: { id: params.ncId },
        select: { id: true, ncId: true, title: true, controlId: true, control: { select: { organisationId: true } } },
      });
      if (!nc) {
        return { content: [{ type: 'text' as const, text: `Nonconformity ${params.ncId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_NONCONFORMITY,
        summary: `Update nonconformity ${nc.ncId} (${nc.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_nc',
        organisationId: nc.control?.organisationId,
      });
    }),
  );

  server.tool(
    'propose_transition_nc',
    'Propose transitioning a nonconformity to a new status. Requires human approval.',
    {
      ncId: z.string().describe('Nonconformity UUID'),
      targetStatus: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'VERIFIED_EFFECTIVE', 'VERIFIED_INEFFECTIVE', 'CLOSED', 'REJECTED']).describe('Target NC status'),
      justification: z.string().optional().describe('Justification for the transition'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_transition_nc', async (params) => {
      const nc = await prisma.nonconformity.findUnique({
        where: { id: params.ncId },
        select: { id: true, ncId: true, title: true, status: true, controlId: true, control: { select: { organisationId: true } } },
      });
      if (!nc) {
        return { content: [{ type: 'text' as const, text: `Nonconformity ${params.ncId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.TRANSITION_NONCONFORMITY,
        summary: `Transition nonconformity ${nc.ncId} from ${nc.status} to ${params.targetStatus}`,
        reason: params.reason,
        payload: { ...params, currentStatus: nc.status },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_transition_nc',
        organisationId: nc.control?.organisationId,
      });
    }),
  );

  server.tool(
    'propose_close_nc',
    'Propose closing a nonconformity after verification. Requires human approval.',
    {
      ncId: z.string().describe('Nonconformity UUID'),
      verificationMethod: z.string().optional().describe('Verification method (e.g. "RE_TEST", "RE_AUDIT", "DOCUMENT_REVIEW", "WALKTHROUGH")'),
      verificationResult: z.string().optional().describe('Verification result (e.g. "EFFECTIVE", "INEFFECTIVE")'),
      verificationNotes: z.string().optional().describe('Verification notes'),
      verificationDate: z.string().datetime().optional().describe('Verification date (ISO 8601)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_close_nc', async (params) => {
      const nc = await prisma.nonconformity.findUnique({
        where: { id: params.ncId },
        select: { id: true, ncId: true, title: true, status: true, controlId: true, control: { select: { organisationId: true } } },
      });
      if (!nc) {
        return { content: [{ type: 'text' as const, text: `Nonconformity ${params.ncId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CLOSE_NONCONFORMITY,
        summary: `Close nonconformity ${nc.ncId} (${nc.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_close_nc',
        organisationId: nc.control?.organisationId,
      });
    }),
  );
}

function registerCapMutations(server: McpServer) {
  server.tool(
    'propose_submit_cap',
    'Propose submitting a corrective action plan (CAP) for approval. Requires human approval.',
    {
      ncId: z.string().describe('Nonconformity UUID'),
      correctiveAction: z.string().describe('Corrective action plan text'),
      targetClosureDate: z.string().datetime().optional().describe('Target closure date (ISO 8601)'),
      responsibleUserId: z.string().optional().describe('Responsible user UUID'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_submit_cap', async (params) => {
      const nc = await prisma.nonconformity.findUnique({
        where: { id: params.ncId },
        select: { id: true, ncId: true, title: true, capStatus: true, controlId: true, control: { select: { organisationId: true } } },
      });
      if (!nc) {
        return { content: [{ type: 'text' as const, text: `Nonconformity ${params.ncId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.SUBMIT_CAP,
        summary: `Submit CAP for nonconformity ${nc.ncId} (${nc.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_submit_cap',
        organisationId: nc.control?.organisationId,
      });
    }),
  );

  server.tool(
    'propose_approve_cap',
    'Propose approving a corrective action plan (CAP). Requires human approval.',
    {
      ncId: z.string().describe('Nonconformity UUID'),
      approvalComments: z.string().optional().describe('Approval comments'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_approve_cap', async (params) => {
      const nc = await prisma.nonconformity.findUnique({
        where: { id: params.ncId },
        select: { id: true, ncId: true, title: true, capStatus: true, controlId: true, control: { select: { organisationId: true } } },
      });
      if (!nc) {
        return { content: [{ type: 'text' as const, text: `Nonconformity ${params.ncId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.APPROVE_CAP,
        summary: `Approve CAP for nonconformity ${nc.ncId} (${nc.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_approve_cap',
        organisationId: nc.control?.organisationId,
      });
    }),
  );

  server.tool(
    'propose_reject_cap',
    'Propose rejecting a corrective action plan (CAP). Requires human approval.',
    {
      ncId: z.string().describe('Nonconformity UUID'),
      rejectionReason: z.string().describe('Reason for rejecting the CAP'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_reject_cap', async (params) => {
      const nc = await prisma.nonconformity.findUnique({
        where: { id: params.ncId },
        select: { id: true, ncId: true, title: true, capStatus: true, controlId: true, control: { select: { organisationId: true } } },
      });
      if (!nc) {
        return { content: [{ type: 'text' as const, text: `Nonconformity ${params.ncId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.REJECT_CAP,
        summary: `Reject CAP for nonconformity ${nc.ncId}: ${params.rejectionReason}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_reject_cap',
        organisationId: nc.control?.organisationId,
      });
    }),
  );
}

export function registerMutationTools(server: McpServer) {
  registerNonconformityMutations(server);
  registerCapMutations(server);
}
