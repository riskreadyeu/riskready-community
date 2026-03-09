import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpActionType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '#src/prisma.js';
import { createPendingAction, withErrorHandling } from '#mcp-shared';

// ---------------------------------------------------------------------------
// Risk mutations
// ---------------------------------------------------------------------------
function registerRiskMutations(server: McpServer) {
  server.tool(
    'propose_create_risk',
    'Propose creating a new risk. The proposal goes into an approval queue for human review.',
    {
      riskId: z.string().describe('Risk identifier (e.g. "R-01")'),
      title: z.string().describe('Risk title'),
      description: z.string().optional().describe('Risk description'),
      tier: z.enum(['CORE', 'EXTENDED', 'ADVANCED']).optional().describe('Risk tier'),
      framework: z.enum(['ISO', 'SOC2', 'NIS2', 'DORA']).optional().describe('Framework'),
      status: z.enum(['IDENTIFIED', 'ASSESSED', 'TREATING', 'ACCEPTED', 'CLOSED', 'MONITORING']).optional().describe('Initial risk status'),
      source: z.string().optional().describe('Risk source (e.g. "ISRA", "Audit", "Incident")'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Risk priority'),
      parentRiskId: z.string().optional().describe('Parent risk UUID'),
      notes: z.string().optional().describe('Additional notes'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this risk should be created — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_create_risk', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_RISK,
        summary: `Create risk "${params.title}" (${params.riskId})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_risk',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_update_risk',
    'Propose updating an existing risk. Requires human approval.',
    {
      riskId: z.string().describe('Risk UUID'),
      title: z.string().optional().describe('Updated title'),
      description: z.string().optional().describe('Updated description'),
      status: z.enum(['IDENTIFIED', 'ASSESSED', 'TREATING', 'ACCEPTED', 'CLOSED', 'MONITORING']).optional().describe('Updated status'),
      tier: z.enum(['CORE', 'EXTENDED', 'ADVANCED']).optional().describe('Updated tier'),
      source: z.string().optional().describe('Risk source'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Updated priority'),
      framework: z.enum(['ISO', 'SOC2', 'NIS2', 'DORA']).optional().describe('Updated framework'),
      parentRiskId: z.string().optional().describe('Parent risk UUID'),
      notes: z.string().optional().describe('Additional notes'),
      reason: z.string().optional().describe('Explain WHY this change is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_update_risk', async (params) => {
      const risk = await prisma.risk.findUnique({
        where: { id: params.riskId },
        select: { id: true, riskId: true, title: true, organisationId: true },
      });
      if (!risk) {
        return { content: [{ type: 'text' as const, text: `Risk with ID ${params.riskId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.UPDATE_RISK,
        summary: `Update risk "${risk.riskId}" (${risk.title})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_update_risk',
        organisationId: risk.organisationId,
      });
    }),
  );

  server.tool(
    'propose_create_kri',
    'Propose creating a new Key Risk Indicator. Requires human approval.',
    {
      kriId: z.string().describe('KRI identifier (e.g. "KRI-001")'),
      name: z.string().describe('KRI name'),
      description: z.string().optional().describe('KRI description'),
      unit: z.string().optional().describe('Measurement unit (e.g. "%", "Count", "Days")'),
      frequency: z.string().optional().describe('Collection frequency (e.g. "DAILY", "WEEKLY", "MONTHLY")'),
      greenThreshold: z.string().optional().describe('Green threshold value'),
      amberThreshold: z.string().optional().describe('Amber threshold value'),
      redThreshold: z.string().optional().describe('Red threshold value'),
      breachThreshold: z.string().optional().describe('Breach threshold value'),
      notes: z.string().optional().describe('Additional notes'),
      riskId: z.string().describe('Parent risk UUID'),
      reason: z.string().optional().describe('Explain WHY this KRI should be created — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_create_kri', async (params) => {
      // Validate parent risk exists and get organisationId
      const risk = await prisma.risk.findUnique({
        where: { id: params.riskId },
        select: { id: true, riskId: true, organisationId: true },
      });
      if (!risk) {
        return { content: [{ type: 'text' as const, text: `Parent risk with ID ${params.riskId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_KRI,
        summary: `Create KRI "${params.name}" (${params.kriId}) for risk ${risk.riskId}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_kri',
        organisationId: risk.organisationId,
      });
    }),
  );

  server.tool(
    'propose_record_kri_value',
    'Propose recording a new KRI measurement value. Requires human approval.',
    {
      kriId: z.string().describe('KeyRiskIndicator UUID'),
      value: z.string().describe('New measurement value (e.g. "95%", "3", "14 days")'),
      status: z.enum(['GREEN', 'AMBER', 'RED']).optional().describe('RAG status for this measurement'),
      notes: z.string().optional().describe('Measurement notes'),
      reason: z.string().optional().describe('Explain WHY this measurement is being recorded — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_record_kri_value', async (params) => {
      const kri = await prisma.keyRiskIndicator.findUnique({
        where: { id: params.kriId },
        select: { id: true, kriId: true, name: true, risk: { select: { organisationId: true } } },
      });
      if (!kri) {
        return { content: [{ type: 'text' as const, text: `KRI with ID ${params.kriId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.RECORD_KRI_VALUE,
        summary: `Record value "${params.value}" for KRI "${kri.kriId}" (${kri.name})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_record_kri_value',
        organisationId: kri.risk.organisationId,
      });
    }),
  );

  server.tool(
    'propose_create_rts',
    'Propose creating a new Risk Tolerance Statement. Requires human approval.',
    {
      rtsId: z.string().describe('RTS identifier (e.g. "RTS-001")'),
      title: z.string().describe('RTS title'),
      objective: z.string().describe('RTS objective'),
      proposedRTS: z.string().describe('Full text of the tolerance statement'),
      domain: z.string().optional().describe('Risk domain'),
      proposedToleranceLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().describe('Proposed tolerance level'),
      notes: z.string().optional().describe('Additional notes'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this RTS should be created — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_create_rts', async (params) => {
      return createPendingAction({
        actionType: McpActionType.CREATE_RTS,
        summary: `Create RTS "${params.title}" (${params.rtsId})`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_rts',
        organisationId: params.organisationId,
      });
    }),
  );

  server.tool(
    'propose_approve_rts',
    'Propose approving a Risk Tolerance Statement. Requires human approval.',
    {
      rtsId: z.string().describe('RiskToleranceStatement UUID'),
      approvalComments: z.string().optional().describe('Approval comments'),
      reason: z.string().optional().describe('Explain WHY this RTS should be approved — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_approve_rts', async (params) => {
      const rts = await prisma.riskToleranceStatement.findUnique({
        where: { id: params.rtsId },
        select: { id: true, rtsId: true, title: true, status: true, organisationId: true },
      });
      if (!rts) {
        return { content: [{ type: 'text' as const, text: `RTS with ID ${params.rtsId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.APPROVE_RTS,
        summary: `Approve RTS "${rts.rtsId}" (${rts.title}) — current status: ${rts.status}`,
        reason: params.reason,
        payload: { ...params, currentStatus: rts.status },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_approve_rts',
        organisationId: rts.organisationId,
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Scenario mutations
// ---------------------------------------------------------------------------
function registerScenarioMutations(server: McpServer) {
  server.tool(
    'propose_create_scenario',
    'Propose creating a new risk scenario. Requires human approval.',
    {
      scenarioId: z.string().describe('Scenario identifier (e.g. "R-01-S01")'),
      title: z.string().describe('Scenario title'),
      cause: z.string().optional().describe('Cause description'),
      event: z.string().optional().describe('Event description'),
      consequence: z.string().optional().describe('Consequence description'),
      status: z.string().optional().describe('Initial scenario status'),
      notes: z.string().optional().describe('Additional notes'),
      riskId: z.string().describe('Parent risk UUID'),
      reason: z.string().optional().describe('Explain WHY this scenario should be created — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_create_scenario', async (params) => {
      // Validate parent risk exists and get organisationId
      const risk = await prisma.risk.findUnique({
        where: { id: params.riskId },
        select: { id: true, riskId: true, organisationId: true },
      });
      if (!risk) {
        return { content: [{ type: 'text' as const, text: `Parent risk with ID ${params.riskId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_SCENARIO,
        summary: `Create scenario "${params.title}" (${params.scenarioId}) under risk ${risk.riskId}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_scenario',
        organisationId: risk.organisationId,
      });
    }),
  );

  server.tool(
    'propose_transition_scenario',
    'Propose a status transition for a risk scenario. Requires human approval.',
    {
      scenarioId: z.string().describe('RiskScenario UUID'),
      targetStatus: z.string().describe('Target status (e.g. ASSESSED, EVALUATED, TREATING)'),
      justification: z.string().optional().describe('Justification for the transition'),
      reason: z.string().optional().describe('Explain WHY this transition is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_transition_scenario', async (params) => {
      const scenario = await prisma.riskScenario.findUnique({
        where: { id: params.scenarioId },
        select: { id: true, scenarioId: true, status: true, risk: { select: { organisationId: true } } },
      });
      if (!scenario) {
        return { content: [{ type: 'text' as const, text: `Scenario with ID ${params.scenarioId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.TRANSITION_SCENARIO,
        summary: `Transition scenario "${scenario.scenarioId}" from ${scenario.status} to ${params.targetStatus}`,
        reason: params.reason,
        payload: { ...params, currentStatus: scenario.status },
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_transition_scenario',
        organisationId: scenario.risk.organisationId,
      });
    }),
  );

  server.tool(
    'propose_assess_scenario',
    'Propose recording an inherent or residual assessment for a risk scenario. Requires human approval.',
    {
      scenarioId: z.string().describe('RiskScenario UUID'),
      assessmentType: z.enum(['inherent', 'residual']).describe('Assessment type'),
      likelihood: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).describe('Likelihood level'),
      impact: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).describe('Impact level'),
      notes: z.string().optional().describe('Assessment notes'),
      reason: z.string().optional().describe('Explain WHY this assessment is proposed — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_assess_scenario', async (params) => {
      const scenario = await prisma.riskScenario.findUnique({
        where: { id: params.scenarioId },
        select: { id: true, scenarioId: true, risk: { select: { organisationId: true } } },
      });
      if (!scenario) {
        return { content: [{ type: 'text' as const, text: `Scenario with ID ${params.scenarioId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.ASSESS_SCENARIO,
        summary: `Record ${params.assessmentType} assessment for scenario "${scenario.scenarioId}" — likelihood: ${params.likelihood}, impact: ${params.impact}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_assess_scenario',
        organisationId: scenario.risk.organisationId,
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Treatment mutations
// ---------------------------------------------------------------------------
function registerTreatmentMutations(server: McpServer) {
  server.tool(
    'propose_create_treatment_plan',
    'Propose creating a new treatment plan. Requires human approval.',
    {
      treatmentId: z.string().describe('Treatment plan identifier (e.g. "TP-001")'),
      title: z.string().describe('Treatment plan title'),
      description: z.string().describe('Treatment plan description'),
      treatmentType: z.enum(['MITIGATE', 'TRANSFER', 'ACCEPT', 'AVOID', 'SHARE']).optional().describe('Treatment type'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Priority'),
      status: z.string().optional().describe('Initial treatment plan status'),
      targetDate: z.string().datetime().optional().describe('Target completion date (ISO 8601)'),
      budget: z.number().optional().describe('Budget allocated'),
      estimatedCost: z.number().optional().describe('Estimated cost'),
      notes: z.string().optional().describe('Additional notes'),
      riskId: z.string().describe('Parent risk UUID'),
      organisationId: z.string().optional().describe('Organisation UUID (uses default if omitted)'),
      reason: z.string().optional().describe('Explain WHY this treatment plan should be created — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_create_treatment_plan', async (params) => {
      // Validate parent risk exists and get organisationId
      const risk = await prisma.risk.findUnique({
        where: { id: params.riskId },
        select: { id: true, riskId: true, organisationId: true },
      });
      if (!risk) {
        return { content: [{ type: 'text' as const, text: `Parent risk with ID ${params.riskId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_TREATMENT_PLAN,
        summary: `Create treatment plan "${params.title}" (${params.treatmentId}) for risk ${risk.riskId}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_treatment_plan',
        organisationId: params.organisationId || risk.organisationId,
      });
    }),
  );

  server.tool(
    'propose_create_treatment_action',
    'Propose creating a new treatment action. Requires human approval.',
    {
      actionId: z.string().describe('Action identifier (e.g. "TP-001-A01")'),
      title: z.string().describe('Action title'),
      description: z.string().optional().describe('Action description'),
      status: z.string().optional().describe('Initial action status'),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().describe('Action priority'),
      targetDate: z.string().datetime().optional().describe('Target completion date (ISO 8601)'),
      estimatedHours: z.number().optional().describe('Estimated hours to complete'),
      notes: z.string().optional().describe('Additional notes'),
      treatmentPlanId: z.string().describe('Parent treatment plan UUID'),
      reason: z.string().optional().describe('Explain WHY this action should be created — shown to human reviewers'),
      mcpSessionId: z.string().optional().describe('MCP session identifier for tracking'),
    },
    withErrorHandling('propose_create_treatment_action', async (params) => {
      // Validate parent treatment plan exists and get organisationId
      const plan = await prisma.treatmentPlan.findUnique({
        where: { id: params.treatmentPlanId },
        select: { id: true, treatmentId: true, title: true, organisationId: true },
      });
      if (!plan) {
        return { content: [{ type: 'text' as const, text: `Treatment plan with ID ${params.treatmentPlanId} not found` }], isError: true };
      }

      return createPendingAction({
        actionType: McpActionType.CREATE_TREATMENT_ACTION,
        summary: `Create treatment action "${params.title}" (${params.actionId}) under plan ${plan.treatmentId}`,
        reason: params.reason,
        payload: params,
        mcpSessionId: params.mcpSessionId,
        mcpToolName: 'propose_create_treatment_action',
        organisationId: plan.organisationId,
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------
export function registerMutationTools(server: McpServer) {
  registerRiskMutations(server);
  registerScenarioMutations(server);
  registerTreatmentMutations(server);
}
