import { McpActionType } from '@prisma/client';
import { prisma } from './prisma.js';

export async function getDefaultOrganisationId(): Promise<string> {
  const org = await prisma.organisationProfile.findFirst({ select: { id: true } });
  if (!org) throw new Error('No organisation found in the database. Please create one first.');
  return org.id;
}

export async function createPendingAction(params: {
  actionType: McpActionType;
  summary: string;
  reason?: string;
  payload: unknown;
  mcpSessionId?: string;
  mcpToolName: string;
  organisationId?: string;
}) {
  const orgId = params.organisationId || await getDefaultOrganisationId();
  const action = await prisma.mcpPendingAction.create({
    data: {
      actionType: params.actionType,
      summary: params.summary,
      reason: params.reason,
      payload: params.payload as never,
      mcpSessionId: params.mcpSessionId,
      mcpToolName: params.mcpToolName,
      organisationId: orgId,
    },
  });
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        message: `Action proposed successfully. Awaiting human approval.`,
        actionId: action.id,
        actionType: action.actionType,
        status: action.status,
        summary: action.summary,
      }, null, 2),
    }],
  };
}
