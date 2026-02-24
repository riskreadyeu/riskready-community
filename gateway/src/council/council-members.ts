// gateway/src/council/council-members.ts

import type { CouncilMemberRole } from './council-types.js';
import { MEMBER_SERVER_MAP } from './council-types.js';
import { getCouncilMemberPrompt } from './council-prompts.js';

/**
 * AgentDefinition interface compatible with the Claude Agent SDK's options.agents.
 */
export interface AgentDefinition {
  description: string;
  systemPrompt: string;
  mcpServers: string[];
  maxTurns: number;
  model?: string;
}

/**
 * Build AgentDefinitions for the selected council members.
 * These are passed to the SDK's options.agents for sub-agent invocation.
 */
export function buildCouncilMembers(
  memberRoles: CouncilMemberRole[],
  allMcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>,
  maxTurnsPerMember: number = 15,
  memberModel?: string,
): Record<string, AgentDefinition> {
  const agents: Record<string, AgentDefinition> = {};

  for (const role of memberRoles) {
    const requiredServerNames = MEMBER_SERVER_MAP[role];
    const availableServers = requiredServerNames.filter((name) => name in allMcpServers);

    agents[role] = {
      description: getAgentDescription(role),
      systemPrompt: getCouncilMemberPrompt(role),
      mcpServers: availableServers,
      maxTurns: maxTurnsPerMember,
      ...(memberModel ? { model: memberModel } : {}),
    };
  }

  return agents;
}

function getAgentDescription(role: CouncilMemberRole): string {
  const descriptions: Record<CouncilMemberRole, string> = {
    'risk-analyst': 'Specialized risk analysis agent. Queries risk register, scenarios, KRIs, tolerance, and treatment plans.',
    'controls-auditor': 'Specialized controls audit agent. Queries control effectiveness, SOA, assessments, and gap analysis.',
    'compliance-officer': 'Specialized compliance agent. Queries policies, framework alignment (ISO 27001, DORA, NIS2), and governance.',
    'incident-commander': 'Specialized incident analysis agent. Queries incident patterns, lessons learned, and response metrics.',
    'evidence-auditor': 'Specialized evidence and audit agent. Queries evidence coverage, audit readiness, and nonconformities.',
    'ciso-strategist': 'Senior strategist agent with access to all domains. Synthesizes cross-domain findings.',
  };
  return descriptions[role];
}

/**
 * Filter MCP servers to only those needed by a specific council member.
 */
export function filterMcpServersForMember(
  role: CouncilMemberRole,
  allServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>,
): Record<string, { command: string; args: string[]; env?: Record<string, string> }> {
  const requiredNames = MEMBER_SERVER_MAP[role];
  const filtered: typeof allServers = {};

  for (const name of requiredNames) {
    if (allServers[name]) {
      filtered[name] = allServers[name];
    }
  }

  return filtered;
}
