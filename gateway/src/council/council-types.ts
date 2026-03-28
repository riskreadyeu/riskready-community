// gateway/src/council/council-types.ts

export type CouncilMemberRole =
  | 'risk-analyst'
  | 'controls-auditor'
  | 'compliance-officer'
  | 'incident-commander'
  | 'evidence-auditor'
  | 'ciso-strategist';

export type DeliberationPattern =
  | 'parallel_then_synthesis'
  | 'sequential_buildup'
  | 'challenge_response';

export interface CouncilDecision {
  convene: boolean;
  reason: string;
  memberRoles: CouncilMemberRole[];
  deliberationPattern: DeliberationPattern;
}

export interface CouncilOpinionData {
  agentRole: CouncilMemberRole;
  findings: Array<{
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    description: string;
    evidence: string[];
  }>;
  recommendations: Array<{
    title: string;
    priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
    description: string;
    rationale: string;
  }>;
  dissents: Array<{
    againstAgent: string;
    finding: string;
    reason: string;
  }>;
  dataSources: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface CouncilDeliberation {
  sessionId: string;
  consensusSummary: string;
  consolidatedRecommendations: Array<{
    title: string;
    priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
    description: string;
    supportingAgents: string[];
  }>;
  dissentingOpinions: Array<{
    agentRole: string;
    finding: string;
    reason: string;
  }>;
  crossDomainCorrelations: Array<{
    description: string;
    domains: string[];
    recordIds: string[];
  }>;
  proposedActions: Array<{
    action: string;
    domain: string;
    priority: string;
  }>;
  confidenceLevel: 'high' | 'medium' | 'low';
  nextSteps: string[];
  opinions: CouncilOpinionData[];
}

export interface CouncilConfig {
  enabled: boolean;
  classifierMode: 'heuristic' | 'llm';
  maxMembersPerSession: number;
  maxTurnsPerMember: number;
  defaultPattern: DeliberationPattern;
  memberModel?: string;
  maxTokenBudgetPerMember: number;
}

export const DEFAULT_COUNCIL_CONFIG: CouncilConfig = {
  enabled: true,
  classifierMode: 'heuristic',
  maxMembersPerSession: 6,
  maxTurnsPerMember: 15,
  defaultPattern: 'parallel_then_synthesis',
  maxTokenBudgetPerMember: 80_000,
};

/** Maps council member roles to the MCP server names they need */
export const MEMBER_SERVER_MAP: Record<CouncilMemberRole, string[]> = {
  'risk-analyst': ['riskready-risks', 'riskready-controls', 'riskready-agent-ops'],
  'controls-auditor': ['riskready-controls', 'riskready-evidence', 'riskready-audits', 'riskready-agent-ops'],
  'compliance-officer': ['riskready-policies', 'riskready-controls', 'riskready-organisation', 'riskready-agent-ops'],
  'incident-commander': ['riskready-incidents', 'riskready-itsm', 'riskready-evidence', 'riskready-agent-ops'],
  'evidence-auditor': ['riskready-evidence', 'riskready-audits', 'riskready-controls', 'riskready-agent-ops'],
  'ciso-strategist': [
    'riskready-risks', 'riskready-controls', 'riskready-evidence',
    'riskready-policies', 'riskready-organisation', 'riskready-itsm',
    'riskready-audits', 'riskready-incidents', 'riskready-agent-ops',
  ],
};
