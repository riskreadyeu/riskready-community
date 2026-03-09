import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpActionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { createPendingAction, withErrorHandling } from '#mcp-shared';

function registerEvidenceMutations(server: McpServer) {
  server.tool(
    'propose_create_evidence',
    'Propose creating a new evidence record. The proposal goes into an approval queue for human review.',
    {
      evidenceRef: z.string().describe('Evidence reference (e.g. "EVD-2025-0001")'),
      title: z.string().describe('Evidence title'),
      description: z.string().optional().describe('Evidence description'),
      evidenceType: z.enum(['DOCUMENT', 'CERTIFICATE', 'REPORT', 'POLICY', 'PROCEDURE', 'SCREENSHOT', 'LOG', 'CONFIGURATION', 'NETWORK_CAPTURE', 'MEMORY_DUMP', 'DISK_IMAGE', 'MALWARE_SAMPLE', 'EMAIL', 'MEETING_NOTES', 'APPROVAL_RECORD', 'AUDIT_REPORT', 'ASSESSMENT_RESULT', 'TEST_RESULT', 'SCAN_RESULT', 'VIDEO', 'AUDIO', 'OTHER']).describe('Evidence type'),
      classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('Classification level'),
      category: z.string().optional().describe('Category grouping'),
      validFrom: z.string().datetime().optional().describe('Validity start date (ISO 8601)'),
      validUntil: z.string().datetime().optional().describe('Expiry date (ISO 8601)'),
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED']).optional().describe('Initial evidence status'),
      tags: z.array(z.string()).optional().describe('Tags (JSON array)'),
      subcategory: z.string().optional().describe('Subcategory'),
      sourceType: z.string().optional().describe('Source type'),
      sourceSystem: z.string().optional().describe('Source system'),
      sourceReference: z.string().optional().describe('Source reference identifier'),
      collectionMethod: z.string().optional().describe('Collection method (e.g. "AUTOMATED", "MANUAL")'),
      renewalRequired: z.boolean().optional().describe('Whether renewal is required'),
      renewalReminderDays: z.number().int().optional().describe('Days before expiry to send renewal reminder'),
      version: z.string().optional().describe('Evidence version'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_create_evidence', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_EVIDENCE,
        summary: `Create ${params.evidenceType} evidence "${params.title}" (${params.evidenceRef})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_evidence',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_evidence',
    'Propose updating an existing evidence record. Validates the evidence exists. Requires human approval.',
    {
      evidenceId: z.string().describe('Evidence UUID to update'),
      title: z.string().optional().describe('Updated title'),
      description: z.string().optional().describe('Updated description'),
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED']).optional().describe('Updated status'),
      classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('Updated classification'),
      validFrom: z.string().datetime().optional().describe('Updated validity start date (ISO 8601)'),
      validUntil: z.string().datetime().optional().describe('Updated expiry date (ISO 8601)'),
      tags: z.array(z.string()).optional().describe('Tags (JSON array)'),
      category: z.string().optional().describe('Updated category'),
      subcategory: z.string().optional().describe('Updated subcategory'),
      renewalRequired: z.boolean().optional().describe('Whether renewal is required'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_update_evidence', async (params) => {
      const evidence = await prisma.evidence.findUnique({
        where: { id: params.evidenceId },
        select: { id: true, evidenceRef: true, title: true },
      });
      if (!evidence) {
        return { content: [{ type: 'text' as const, text: `Evidence ${params.evidenceId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_EVIDENCE,
        summary: `Update evidence ${evidence.evidenceRef} (${evidence.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_evidence',
      });
    }),
  );

  server.tool(
    'propose_link_evidence',
    'Propose linking evidence to another entity (control, risk, incident, asset, policy, or change). Requires human approval.',
    {
      evidenceId: z.string().describe('Evidence UUID'),
      targetType: z.enum(['control', 'risk', 'incident', 'asset', 'policy', 'change', 'nonconformity', 'treatment']).describe('Type of entity to link to'),
      targetId: z.string().describe('Target entity UUID'),
      linkType: z.string().optional().describe('Type of link (e.g. "design", "implementation", "forensic")'),
      notes: z.string().optional().describe('Link notes'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_link_evidence', async (params) => {
      const evidence = await prisma.evidence.findUnique({
        where: { id: params.evidenceId },
        select: { id: true, evidenceRef: true, title: true },
      });
      if (!evidence) {
        return { content: [{ type: 'text' as const, text: `Evidence ${params.evidenceId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.LINK_EVIDENCE,
        summary: `Link evidence ${evidence.evidenceRef} to ${params.targetType} ${params.targetId}${params.linkType ? ` (${params.linkType})` : ''}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_link_evidence',
      });
    }),
  );
}

function registerRequestMutations(server: McpServer) {
  server.tool(
    'propose_create_request',
    'Propose creating a new evidence request. Requires human approval.',
    {
      requestRef: z.string().describe('Request reference (e.g. "REQ-2025-0001")'),
      title: z.string().describe('Request title'),
      description: z.string().describe('Request description'),
      evidenceType: z.enum(['DOCUMENT', 'CERTIFICATE', 'REPORT', 'POLICY', 'PROCEDURE', 'SCREENSHOT', 'LOG', 'CONFIGURATION', 'NETWORK_CAPTURE', 'MEMORY_DUMP', 'DISK_IMAGE', 'MALWARE_SAMPLE', 'EMAIL', 'MEETING_NOTES', 'APPROVAL_RECORD', 'AUDIT_REPORT', 'ASSESSMENT_RESULT', 'TEST_RESULT', 'SCAN_RESULT', 'VIDEO', 'AUDIO', 'OTHER']).optional().describe('Required evidence type'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().describe('Request priority'),
      dueDate: z.string().datetime().describe('Due date (ISO 8601)'),
      assignedToId: z.string().optional().describe('Assigned user UUID'),
      contextType: z.string().optional().describe('Context type (e.g. "Control", "Test")'),
      contextRef: z.string().optional().describe('Context reference (e.g. "A.5.1")'),
      status: z.string().optional().describe('Initial request status'),
      requiredFormat: z.string().optional().describe('Required evidence format'),
      acceptanceCriteria: z.string().optional().describe('Acceptance criteria'),
      notes: z.string().optional().describe('Additional notes'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_create_request', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_EVIDENCE_REQUEST,
        summary: `Create evidence request "${params.title}" (${params.requestRef}) due ${params.dueDate}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_request',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_fulfill_request',
    'Propose fulfilling an evidence request with an existing evidence record. Requires human approval.',
    {
      requestId: z.string().describe('EvidenceRequest UUID'),
      evidenceId: z.string().describe('Evidence UUID to fulfill with'),
      notes: z.string().optional().describe('Fulfillment notes'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_fulfill_request', async (params) => {
      const [request, evidence] = await Promise.all([
        prisma.evidenceRequest.findUnique({ where: { id: params.requestId }, select: { id: true, requestRef: true, title: true } }),
        prisma.evidence.findUnique({ where: { id: params.evidenceId }, select: { id: true, evidenceRef: true, title: true } }),
      ]);
      if (!request) {
        return { content: [{ type: 'text' as const, text: `Evidence request ${params.requestId} not found` }], isError: true };
      }
      if (!evidence) {
        return { content: [{ type: 'text' as const, text: `Evidence ${params.evidenceId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.FULFILL_EVIDENCE_REQUEST,
        summary: `Fulfill request ${request.requestRef} with evidence ${evidence.evidenceRef}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_fulfill_request',
      });
    }),
  );

  server.tool(
    'propose_close_request',
    'Propose closing an evidence request (accepted, rejected, or cancelled). Requires human approval.',
    {
      requestId: z.string().describe('EvidenceRequest UUID'),
      action: z.enum(['accept', 'reject', 'cancel']).describe('Close action'),
      notes: z.string().optional().describe('Closure notes or rejection reason'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_close_request', async (params) => {
      const request = await prisma.evidenceRequest.findUnique({
        where: { id: params.requestId },
        select: { id: true, requestRef: true, title: true, status: true },
      });
      if (!request) {
        return { content: [{ type: 'text' as const, text: `Evidence request ${params.requestId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CLOSE_EVIDENCE_REQUEST,
        summary: `${params.action.charAt(0).toUpperCase() + params.action.slice(1)} evidence request ${request.requestRef} (current status: ${request.status})`,
        reason: params.reason,
        payload: { ...params, currentStatus: request.status },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_close_request',
      });
    }),
  );
}

export function registerMutationTools(server: McpServer) {
  registerEvidenceMutations(server);
  registerRequestMutations(server);
}
