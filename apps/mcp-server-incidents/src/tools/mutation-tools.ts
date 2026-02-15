import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';

async function getDefaultOrganisationId(): Promise<string> {
  const org = await prisma.organisationProfile.findFirst({ select: { id: true } });
  if (!org) throw new Error('No organisation found in the database. Please create one first.');
  return org.id;
}

async function createPendingAction(params: {
  actionType: string;
  summary: string;
  reason?: string;
  payload: any;
  mcpSessionId?: string;
  mcpToolName: string;
  organisationId?: string;
}) {
  const orgId = params.organisationId || await getDefaultOrganisationId();
  const action = await prisma.mcpPendingAction.create({
    data: {
      actionType: params.actionType as any,
      summary: params.summary,
      reason: params.reason,
      payload: params.payload,
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

function registerIncidentMutations(server: McpServer) {
  server.tool(
    'propose_create_incident',
    'Propose creating a new security incident. The proposal goes into an approval queue for human review before execution.',
    {
      referenceNumber: z.string().describe('Incident reference number (e.g. "INC-2025-001")'),
      title: z.string().describe('Incident title'),
      description: z.string().describe('Incident description'),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).describe('Incident severity'),
      category: z.enum(['MALWARE', 'PHISHING', 'DENIAL_OF_SERVICE', 'DATA_BREACH', 'UNAUTHORIZED_ACCESS', 'INSIDER_THREAT', 'PHYSICAL', 'SUPPLY_CHAIN', 'SYSTEM_FAILURE', 'CONFIGURATION_ERROR', 'OTHER']).optional().describe('Incident category'),
      source: z.enum(['SIEM', 'USER_REPORT', 'THREAT_INTEL', 'AUTOMATED', 'THIRD_PARTY', 'REGULATOR', 'VULNERABILITY_SCAN', 'PENETRATION_TEST', 'OTHER']).describe('Detection source'),
      detectedAt: z.string().optional().describe('Detection timestamp (ISO 8601, defaults to now)'),
      isConfirmed: z.boolean().optional().describe('Whether the incident is confirmed'),
      reporterId: z.string().optional().describe('Reporter user UUID'),
      handlerId: z.string().optional().describe('Handler user UUID'),
      incidentManagerId: z.string().optional().describe('Incident manager user UUID'),
      sourceRef: z.string().optional().describe('Source reference (e.g. SIEM alert ID)'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    async (params) => {
      return createPendingAction({
        actionType: 'CREATE_INCIDENT',
        summary: `Create ${params.severity} incident "${params.title}" (${params.referenceNumber}) from ${params.source}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_incident',
        organisationId: params.organisationId,
      });
    },
  );

  server.tool(
    'propose_update_incident',
    'Propose updating an existing incident. Validates the incident exists before creating the proposal. Requires human approval.',
    {
      incidentId: z.string().describe('Incident UUID to update'),
      title: z.string().optional().describe('Updated title'),
      description: z.string().optional().describe('Updated description'),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Updated severity'),
      category: z.enum(['MALWARE', 'PHISHING', 'DENIAL_OF_SERVICE', 'DATA_BREACH', 'UNAUTHORIZED_ACCESS', 'INSIDER_THREAT', 'PHYSICAL', 'SUPPLY_CHAIN', 'SYSTEM_FAILURE', 'CONFIGURATION_ERROR', 'OTHER']).optional().describe('Updated category'),
      confidentialityBreach: z.boolean().optional().describe('Confidentiality breach flag'),
      integrityBreach: z.boolean().optional().describe('Integrity breach flag'),
      availabilityBreach: z.boolean().optional().describe('Availability breach flag'),
      isConfirmed: z.boolean().optional().describe('Whether the incident is confirmed'),
      handlerId: z.string().optional().describe('Handler user UUID'),
      incidentManagerId: z.string().optional().describe('Incident manager user UUID'),
      sourceRef: z.string().optional().describe('Source reference'),
      source: z.enum(['SIEM', 'USER_REPORT', 'THREAT_INTEL', 'AUTOMATED', 'THIRD_PARTY', 'REGULATOR', 'VULNERABILITY_SCAN', 'PENETRATION_TEST', 'OTHER']).optional().describe('Updated detection source'),
      status: z.enum(['DETECTED', 'TRIAGED', 'INVESTIGATING', 'CONTAINING', 'ERADICATING', 'RECOVERING', 'POST_INCIDENT', 'CLOSED']).optional().describe('Updated status'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    async (params) => {
      const incident = await prisma.incident.findUnique({
        where: { id: params.incidentId },
        select: { id: true, referenceNumber: true, title: true, organisationId: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${params.incidentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: 'UPDATE_INCIDENT',
        summary: `Update incident ${incident.referenceNumber} (${incident.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_incident',
        organisationId: incident.organisationId || undefined,
      });
    },
  );

  server.tool(
    'propose_transition_incident',
    'Propose a status transition for an incident. Validates the incident exists. Requires human approval.',
    {
      incidentId: z.string().describe('Incident UUID'),
      targetStatus: z.enum(['DETECTED', 'TRIAGED', 'INVESTIGATING', 'CONTAINING', 'ERADICATING', 'RECOVERING', 'POST_INCIDENT', 'CLOSED']).describe('Target status'),
      resolutionType: z.enum(['RESOLVED', 'FALSE_POSITIVE', 'ACCEPTED_RISK', 'DUPLICATE', 'TRANSFERRED']).optional().describe('Resolution type (required when closing)'),
      reason: z.string().optional().describe('Explain WHY this transition is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    async (params) => {
      const incident = await prisma.incident.findUnique({
        where: { id: params.incidentId },
        select: { id: true, referenceNumber: true, status: true, organisationId: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${params.incidentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: 'TRANSITION_INCIDENT',
        summary: `Transition incident ${incident.referenceNumber} from ${incident.status} to ${params.targetStatus}`,
        reason: params.reason,
        payload: { ...params, currentStatus: incident.status },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_transition_incident',
        organisationId: incident.organisationId || undefined,
      });
    },
  );

  server.tool(
    'propose_add_incident_asset',
    'Propose linking an affected asset to an incident. Requires human approval.',
    {
      incidentId: z.string().describe('Incident UUID'),
      assetId: z.string().describe('Asset UUID'),
      impactType: z.enum(['COMPROMISED', 'AFFECTED', 'AT_RISK']).describe('How the asset was impacted'),
      notes: z.string().optional().describe('Notes about the impact'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    async (params) => {
      const [incident, asset] = await Promise.all([
        prisma.incident.findUnique({ where: { id: params.incidentId }, select: { id: true, referenceNumber: true, organisationId: true } }),
        prisma.asset.findUnique({ where: { id: params.assetId }, select: { id: true, assetTag: true, name: true } }),
      ]);
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${params.incidentId} not found` }], isError: true };
      }
      if (!asset) {
        return { content: [{ type: 'text' as const, text: `Asset ${params.assetId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: 'ADD_INCIDENT_ASSET',
        summary: `Link asset ${asset.assetTag} (${asset.name}) to incident ${incident.referenceNumber} as ${params.impactType}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_add_incident_asset',
        organisationId: incident.organisationId || undefined,
      });
    },
  );

  server.tool(
    'propose_link_incident_control',
    'Propose linking a control to an incident (failed, bypassed, effective, or not applicable). Requires human approval.',
    {
      incidentId: z.string().describe('Incident UUID'),
      controlId: z.string().describe('Control UUID'),
      linkType: z.enum(['failed', 'bypassed', 'effective', 'not_applicable']).describe('How the control performed during the incident'),
      notes: z.string().optional().describe('Notes about the control performance'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    async (params) => {
      const [incident, control] = await Promise.all([
        prisma.incident.findUnique({ where: { id: params.incidentId }, select: { id: true, referenceNumber: true, organisationId: true } }),
        prisma.control.findUnique({ where: { id: params.controlId }, select: { id: true, controlId: true, name: true } }),
      ]);
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${params.incidentId} not found` }], isError: true };
      }
      if (!control) {
        return { content: [{ type: 'text' as const, text: `Control ${params.controlId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: 'LINK_INCIDENT_CONTROL',
        summary: `Link control ${control.controlId} (${control.name}) to incident ${incident.referenceNumber} as ${params.linkType}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_link_incident_control',
        organisationId: incident.organisationId || undefined,
      });
    },
  );

  server.tool(
    'propose_close_incident',
    'Propose closing an incident with resolution details. Requires human approval.',
    {
      incidentId: z.string().describe('Incident UUID'),
      resolutionType: z.enum(['RESOLVED', 'FALSE_POSITIVE', 'ACCEPTED_RISK', 'DUPLICATE', 'TRANSFERRED']).describe('Resolution type'),
      rootCauseIdentified: z.boolean().optional().describe('Whether root cause was identified'),
      lessonsLearnedCompleted: z.boolean().optional().describe('Whether lessons learned review is complete'),
      correctiveActionsIdentified: z.boolean().optional().describe('Whether corrective actions were identified'),
      resolutionSummary: z.string().optional().describe('Summary of the resolution'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    async (params) => {
      const incident = await prisma.incident.findUnique({
        where: { id: params.incidentId },
        select: { id: true, referenceNumber: true, status: true, organisationId: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${params.incidentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: 'CLOSE_INCIDENT',
        summary: `Close incident ${incident.referenceNumber} as ${params.resolutionType} (current status: ${incident.status})`,
        reason: params.reason,
        payload: { ...params, currentStatus: incident.status },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_close_incident',
        organisationId: incident.organisationId || undefined,
      });
    },
  );
}

function registerTimelineMutations(server: McpServer) {
  server.tool(
    'propose_add_timeline_entry',
    'Propose adding a timeline entry to an incident. Requires human approval.',
    {
      incidentId: z.string().describe('Incident UUID'),
      timestamp: z.string().describe('Event timestamp (ISO 8601)'),
      entryType: z.enum(['STATUS_CHANGE', 'ACTION_TAKEN', 'COMMUNICATION', 'EVIDENCE_COLLECTED', 'ESCALATION', 'FINDING', 'CLASSIFICATION_CHANGE', 'NOTIFICATION_SENT', 'OTHER']).describe('Timeline entry type'),
      title: z.string().describe('Entry title'),
      description: z.string().optional().describe('Entry description'),
      visibility: z.enum(['INTERNAL', 'MANAGEMENT', 'REGULATOR', 'PUBLIC']).optional().describe('Entry visibility'),
      sourceSystem: z.string().optional().describe('Source system that generated the entry'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    async (params) => {
      const incident = await prisma.incident.findUnique({
        where: { id: params.incidentId },
        select: { id: true, referenceNumber: true, organisationId: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${params.incidentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: 'ADD_TIMELINE_ENTRY',
        summary: `Add ${params.entryType} timeline entry to incident ${incident.referenceNumber}: "${params.title}"`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_add_timeline_entry',
        organisationId: incident.organisationId || undefined,
      });
    },
  );
}

function registerLessonMutations(server: McpServer) {
  server.tool(
    'propose_create_lesson',
    'Propose creating a lessons learned entry for an incident. Requires human approval.',
    {
      incidentId: z.string().describe('Incident UUID'),
      category: z.enum(['DETECTION', 'RESPONSE', 'COMMUNICATION', 'TOOLING', 'TRAINING', 'PROCESS', 'THIRD_PARTY', 'DOCUMENTATION']).describe('Lesson category'),
      observation: z.string().describe('What was observed'),
      recommendation: z.string().describe('Recommended improvement'),
      priority: z.number().int().min(1).max(5).optional().describe('Priority (1=highest, 5=lowest)'),
      targetDate: z.string().optional().describe('Target completion date (ISO 8601)'),
      status: z.string().optional().describe('Initial lesson status'),
      assignedToId: z.string().optional().describe('Assigned user UUID'),
      completedDate: z.string().optional().describe('Completed date (ISO 8601)'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    async (params) => {
      const incident = await prisma.incident.findUnique({
        where: { id: params.incidentId },
        select: { id: true, referenceNumber: true, organisationId: true },
      });
      if (!incident) {
        return { content: [{ type: 'text' as const, text: `Incident ${params.incidentId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: 'CREATE_LESSON_LEARNED',
        summary: `Create ${params.category} lesson learned for incident ${incident.referenceNumber}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_lesson',
        organisationId: incident.organisationId || undefined,
      });
    },
  );
}

export function registerMutationTools(server: McpServer) {
  registerIncidentMutations(server);
  registerTimelineMutations(server);
  registerLessonMutations(server);
}
