import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpActionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { createPendingAction, withErrorHandling } from '#mcp-shared';

function registerDocumentMutations(server: McpServer) {
  server.tool(
    'propose_create_policy',
    'Propose creating a new policy document. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      documentId: z.string().describe('Document ID (e.g. "POL-001")'),
      title: z.string().describe('Document title'),
      documentType: z.enum(['POLICY', 'STANDARD', 'PROCEDURE', 'WORK_INSTRUCTION', 'FORM', 'TEMPLATE', 'CHECKLIST', 'GUIDELINE', 'RECORD']).describe('Document type'),
      purpose: z.string().describe('Purpose of the document'),
      scope: z.string().describe('Scope of the document'),
      content: z.string().describe('Document content'),
      classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('Classification level'),
      approvalLevel: z.enum(['BOARD', 'EXECUTIVE', 'SENIOR_MANAGEMENT', 'MANAGEMENT', 'TEAM_LEAD', 'PROCESS_OWNER']).describe('Approval level required'),
      documentOwner: z.string().describe('Document owner name'),
      author: z.string().describe('Document author name'),
      reviewFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'BIENNIAL', 'TRIENNIAL', 'ON_CHANGE', 'AS_NEEDED']).optional().describe('Review frequency'),
      shortTitle: z.string().optional().describe('Short title'),
      summary: z.string().optional().describe('Document summary'),
      parentDocumentId: z.string().optional().describe('Parent document UUID'),
      version: z.string().optional().describe('Document version'),
      effectiveDate: z.string().datetime().optional().describe('Effective date (ISO 8601)'),
      expiryDate: z.string().datetime().optional().describe('Expiry date (ISO 8601)'),
      nextReviewDate: z.string().datetime().optional().describe('Next review date (ISO 8601)'),
      requiresAcknowledgment: z.boolean().optional().describe('Whether acknowledgment is required'),
      acknowledgmentDeadline: z.string().datetime().optional().describe('Acknowledgment deadline (ISO 8601)'),
      tags: z.array(z.string()).optional().describe('Tags (JSON array)'),
      organisationId: z.string().optional().describe('Organisation UUID'),
      reason: z.string().optional().describe('Reason for creating this policy'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_create_policy', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_POLICY,
        summary: `Create ${params.documentType.toLowerCase()} "${params.title}" (${params.documentId})`,
        reason: params.reason,
        payload: {
          documentId: params.documentId,
          title: params.title,
          documentType: params.documentType,
          purpose: params.purpose,
          scope: params.scope,
          content: params.content,
          classification: params.classification || 'INTERNAL',
          approvalLevel: params.approvalLevel,
          documentOwner: params.documentOwner,
          author: params.author,
          reviewFrequency: params.reviewFrequency || 'ANNUAL',
          shortTitle: params.shortTitle,
          summary: params.summary,
          parentDocumentId: params.parentDocumentId,
          version: params.version,
          effectiveDate: params.effectiveDate,
          expiryDate: params.expiryDate,
          nextReviewDate: params.nextReviewDate,
          requiresAcknowledgment: params.requiresAcknowledgment,
          acknowledgmentDeadline: params.acknowledgmentDeadline,
          tags: params.tags,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_policy',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_policy',
    'Propose updating an existing policy document. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
      title: z.string().optional().describe('New title'),
      purpose: z.string().optional().describe('New purpose'),
      scope: z.string().optional().describe('New scope'),
      content: z.string().optional().describe('New content'),
      classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).optional().describe('New classification'),
      documentOwner: z.string().optional().describe('New document owner'),
      reviewFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'BIENNIAL', 'TRIENNIAL', 'ON_CHANGE', 'AS_NEEDED']).optional().describe('New review frequency'),
      shortTitle: z.string().optional().describe('New short title'),
      summary: z.string().optional().describe('New summary'),
      effectiveDate: z.string().optional().describe('New effective date (ISO 8601)'),
      expiryDate: z.string().optional().describe('New expiry date (ISO 8601)'),
      nextReviewDate: z.string().datetime().optional().describe('New next review date (ISO 8601)'),
      requiresAcknowledgment: z.boolean().optional().describe('Whether acknowledgment is required'),
      tags: z.array(z.string()).optional().describe('Tags (JSON array)'),
      parentDocumentId: z.string().optional().describe('Parent document UUID'),
      reason: z.string().optional().describe('Reason for update'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_update_policy', async (params) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: params.documentId },
        select: { id: true, documentId: true, title: true, organisationId: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${params.documentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_POLICY,
        summary: `Update policy "${doc.title}" (${doc.documentId})`,
        reason: params.reason,
        payload: {
          documentId: params.documentId,
          title: params.title,
          purpose: params.purpose,
          scope: params.scope,
          content: params.content,
          classification: params.classification,
          documentOwner: params.documentOwner,
          reviewFrequency: params.reviewFrequency,
          shortTitle: params.shortTitle,
          summary: params.summary,
          effectiveDate: params.effectiveDate,
          expiryDate: params.expiryDate,
          nextReviewDate: params.nextReviewDate,
          requiresAcknowledgment: params.requiresAcknowledgment,
          tags: params.tags,
          parentDocumentId: params.parentDocumentId,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_policy',
        organisationId: doc.organisationId,
      });
    }),
  );

  server.tool(
    'propose_submit_review',
    'Propose submitting a policy document for review. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
      reviewType: z.enum(['SCHEDULED', 'TRIGGERED', 'AUDIT_FINDING', 'INCIDENT_RESPONSE', 'REGULATORY_CHANGE', 'REQUEST']).describe('Type of review'),
      findings: z.string().optional().describe('Review findings'),
      recommendations: z.string().optional().describe('Review recommendations'),
      nextReviewDate: z.string().datetime().optional().describe('Recommended next review date (ISO 8601)'),
      reason: z.string().optional().describe('Reason for review'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_submit_review', async (params) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: params.documentId },
        select: { id: true, documentId: true, title: true, organisationId: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${params.documentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.SUBMIT_POLICY_REVIEW,
        summary: `Submit "${doc.title}" (${doc.documentId}) for ${params.reviewType.toLowerCase().replace('_', ' ')} review`,
        reason: params.reason,
        payload: {
          documentId: params.documentId,
          reviewType: params.reviewType,
          findings: params.findings,
          recommendations: params.recommendations,
          nextReviewDate: params.nextReviewDate,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_submit_review',
        organisationId: doc.organisationId,
      });
    }),
  );

  server.tool(
    'propose_approve_policy',
    'Propose approving a policy document. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
      approvalComments: z.string().optional().describe('Approval comments'),
      reason: z.string().optional().describe('Reason for approval'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_approve_policy', async (params) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: params.documentId },
        select: { id: true, documentId: true, title: true, status: true, organisationId: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${params.documentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.APPROVE_POLICY,
        summary: `Approve policy "${doc.title}" (${doc.documentId}) — current status: ${doc.status}`,
        reason: params.reason,
        payload: {
          documentId: params.documentId,
          approvalComments: params.approvalComments,
          currentStatus: doc.status,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_approve_policy',
        organisationId: doc.organisationId,
      });
    }),
  );

  server.tool(
    'propose_publish_policy',
    'Propose publishing an approved policy document. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
      effectiveDate: z.string().datetime().optional().describe('Effective date (ISO 8601)'),
      reason: z.string().optional().describe('Reason for publishing'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_publish_policy', async (params) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: params.documentId },
        select: { id: true, documentId: true, title: true, status: true, organisationId: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${params.documentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.PUBLISH_POLICY,
        summary: `Publish policy "${doc.title}" (${doc.documentId})`,
        reason: params.reason,
        payload: {
          documentId: params.documentId,
          effectiveDate: params.effectiveDate,
          currentStatus: doc.status,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_publish_policy',
        organisationId: doc.organisationId,
      });
    }),
  );

  server.tool(
    'propose_retire_policy',
    'Propose retiring a policy document. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
      retirementReason: z.string().describe('Reason for retirement'),
      supersededById: z.string().optional().describe('UUID of the superseding document'),
      reason: z.string().optional().describe('Reason for the proposal'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_retire_policy', async (params) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: params.documentId },
        select: { id: true, documentId: true, title: true, status: true, organisationId: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${params.documentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.RETIRE_POLICY,
        summary: `Retire policy "${doc.title}" (${doc.documentId})`,
        reason: params.reason || params.retirementReason,
        payload: {
          documentId: params.documentId,
          retirementReason: params.retirementReason,
          supersededById: params.supersededById,
          currentStatus: doc.status,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_retire_policy',
        organisationId: doc.organisationId,
      });
    }),
  );
}

function registerExceptionMutations(server: McpServer) {
  server.tool(
    'propose_create_exception',
    'Propose creating a policy exception. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
      exceptionId: z.string().describe('Exception ID (e.g. "EXC-001")'),
      title: z.string().describe('Exception title'),
      description: z.string().describe('Exception description'),
      justification: z.string().describe('Justification for the exception'),
      scope: z.string().describe('Scope of the exception'),
      riskAssessment: z.string().describe('Risk assessment'),
      residualRisk: z.string().describe('Residual risk level'),
      approvalLevel: z.enum(['BOARD', 'EXECUTIVE', 'SENIOR_MANAGEMENT', 'MANAGEMENT', 'TEAM_LEAD', 'PROCESS_OWNER']).describe('Required approval level'),
      startDate: z.string().datetime().optional().describe('Start date (ISO 8601)'),
      expiryDate: z.string().datetime().optional().describe('Expiry date (ISO 8601)'),
      compensatingControls: z.string().optional().describe('Compensating controls'),
      reviewFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'BIENNIAL', 'TRIENNIAL', 'ON_CHANGE', 'AS_NEEDED']).optional().describe('Exception review frequency'),
      organisationId: z.string().optional().describe('Organisation UUID'),
      reason: z.string().optional().describe('Reason for this proposal'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_create_exception', async (params) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: params.documentId },
        select: { id: true, documentId: true, title: true, organisationId: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${params.documentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_POLICY_EXCEPTION,
        summary: `Create exception "${params.title}" (${params.exceptionId}) for policy "${doc.title}"`,
        reason: params.reason,
        payload: {
          documentId: params.documentId,
          exceptionId: params.exceptionId,
          title: params.title,
          description: params.description,
          justification: params.justification,
          scope: params.scope,
          riskAssessment: params.riskAssessment,
          residualRisk: params.residualRisk,
          approvalLevel: params.approvalLevel,
          startDate: params.startDate,
          expiryDate: params.expiryDate,
          compensatingControls: params.compensatingControls,
          reviewFrequency: params.reviewFrequency,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_exception',
        organisationId: params.organisationId || doc.organisationId,
      });
    }),
  );

  server.tool(
    'propose_approve_exception',
    'Propose approving a policy exception. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      exceptionId: z.string().describe('DocumentException UUID'),
      approvalComments: z.string().optional().describe('Approval comments'),
      reason: z.string().optional().describe('Reason for approval'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_approve_exception', async (params) => {
      const exception = await prisma.documentException.findUnique({
        where: { id: params.exceptionId },
        select: {
          id: true,
          exceptionId: true,
          title: true,
          status: true,
          organisationId: true,
          document: { select: { documentId: true, title: true } },
        },
      });
      if (!exception) {
        return { content: [{ type: 'text' as const, text: `Exception ${params.exceptionId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.APPROVE_POLICY_EXCEPTION,
        summary: `Approve exception "${exception.title}" (${exception.exceptionId}) for policy "${exception.document.title}"`,
        reason: params.reason,
        payload: {
          exceptionId: params.exceptionId,
          approvalComments: params.approvalComments,
          currentStatus: exception.status,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_approve_exception',
        organisationId: exception.organisationId,
      });
    }),
  );
}

function registerChangeRequestMutations(server: McpServer) {
  server.tool(
    'propose_create_change_request',
    'Propose creating a policy change request. Requires human approval. The reason field is shown to human reviewers. Only cite facts retrieved from tools.',
    {
      documentId: z.string().describe('PolicyDocument UUID'),
      changeRequestId: z.string().describe('Change request ID (e.g. "CR-001")'),
      title: z.string().describe('Change request title'),
      description: z.string().describe('Description of the proposed change'),
      justification: z.string().describe('Justification for the change'),
      changeType: z.enum(['INITIAL', 'MINOR_UPDATE', 'CLARIFICATION', 'ENHANCEMENT', 'CORRECTION', 'REGULATORY_UPDATE', 'MAJOR_REVISION', 'RESTRUCTURE']).describe('Type of change'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).describe('Priority level'),
      targetDate: z.string().datetime().optional().describe('Target completion date (ISO 8601)'),
      impactAssessment: z.string().optional().describe('Impact assessment'),
      affectedDocuments: z.string().optional().describe('Affected documents'),
      affectedProcesses: z.string().optional().describe('Affected processes'),
      organisationId: z.string().optional().describe('Organisation UUID'),
      reason: z.string().optional().describe('Reason for this proposal'),
      mcpSessionId: z.string().optional().describe('MCP session ID'),
    },
    withErrorHandling('propose_create_change_request', async (params) => {
      const doc = await prisma.policyDocument.findUnique({
        where: { id: params.documentId },
        select: { id: true, documentId: true, title: true, organisationId: true },
      });
      if (!doc) {
        return { content: [{ type: 'text' as const, text: `Policy document ${params.documentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_POLICY_CHANGE_REQUEST,
        summary: `Create ${params.priority} ${params.changeType.toLowerCase().replace('_', ' ')} change request "${params.title}" for policy "${doc.title}"`,
        reason: params.reason,
        payload: {
          documentId: params.documentId,
          changeRequestId: params.changeRequestId,
          title: params.title,
          description: params.description,
          justification: params.justification,
          changeType: params.changeType,
          priority: params.priority,
          targetDate: params.targetDate,
          impactAssessment: params.impactAssessment,
          affectedDocuments: params.affectedDocuments,
          affectedProcesses: params.affectedProcesses,
        },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_change_request',
        organisationId: params.organisationId || doc.organisationId,
      });
    }),
  );
}

export function registerMutationTools(server: McpServer) {
  registerDocumentMutations(server);
  registerExceptionMutations(server);
  registerChangeRequestMutations(server);
}
