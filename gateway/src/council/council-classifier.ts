// gateway/src/council/council-classifier.ts

import { Router, COUNCIL_TRIGGER_PHRASES } from '../router/router.js';
import type { CouncilDecision, CouncilMemberRole, DeliberationPattern, CouncilConfig } from './council-types.js';
import { DEFAULT_COUNCIL_CONFIG } from './council-types.js';

/**
 * Determines whether to convene the AI Agents Council for a given message.
 * Uses a heuristic approach (keyword counting) by default, with an optional LLM classifier.
 */
export class CouncilClassifier {
  private router: Router;
  private config: CouncilConfig;

  constructor(router: Router, config?: Partial<CouncilConfig>) {
    this.router = router;
    this.config = { ...DEFAULT_COUNCIL_CONFIG, ...config };
  }

  /**
   * Classify whether a message should trigger council deliberation.
   */
  classify(message: string): CouncilDecision {
    if (!this.config.enabled) {
      return { convene: false, reason: 'Council disabled', memberRoles: [], deliberationPattern: 'parallel_then_synthesis' };
    }

    return this.heuristicClassify(message);
  }

  private heuristicClassify(message: string): CouncilDecision {
    const lower = message.toLowerCase();

    // Check for explicit council trigger phrases
    const triggerMatch = COUNCIL_TRIGGER_PHRASES.some((phrase) => lower.includes(phrase));

    // Count distinct domain categories triggered
    const domainCount = this.router.countDistinctDomains(message);

    // Decision: convene if 3+ domains triggered OR explicit trigger phrase matched
    const convene = domainCount >= 3 || triggerMatch;

    if (!convene) {
      return {
        convene: false,
        reason: `Only ${domainCount} domain(s) triggered, no council trigger phrases matched`,
        memberRoles: [],
        deliberationPattern: this.config.defaultPattern,
      };
    }

    // Select council members based on the domains triggered
    const memberRoles = this.selectMembers(message);
    const deliberationPattern = this.selectPattern(message, memberRoles);

    return {
      convene: true,
      reason: triggerMatch
        ? `Council trigger phrase matched (${domainCount} domains)`
        : `${domainCount} distinct domains triggered`,
      memberRoles,
      deliberationPattern,
    };
  }

  private selectMembers(message: string): CouncilMemberRole[] {
    const lower = message.toLowerCase();
    const members = new Set<CouncilMemberRole>();

    // Always include CISO strategist for synthesis
    members.add('ciso-strategist');

    // Select domain-specific members
    const domainKeywords: Record<CouncilMemberRole, string[]> = {
      'risk-analyst': ['risk', 'kri', 'tolerance', 'treatment', 'scenario', 'appetite'],
      'controls-auditor': ['control', 'soa', 'assessment', 'implementation', 'gap', 'metric'],
      'compliance-officer': ['compliance', 'policy', 'regulation', 'iso', 'dora', 'nis2', 'governance', 'framework'],
      'incident-commander': ['incident', 'breach', 'ransomware', 'phishing', 'malware', 'attack', 'response'],
      'evidence-auditor': ['evidence', 'audit', 'nonconformity', 'finding', 'documentation', 'attestation'],
      'ciso-strategist': [], // Always included
    };

    for (const [role, keywords] of Object.entries(domainKeywords) as Array<[CouncilMemberRole, string[]]>) {
      if (keywords.some((kw) => lower.includes(kw))) {
        members.add(role);
      }
    }

    // If only CISO was selected (no specific domain keywords), include all members
    if (members.size <= 1) {
      members.add('risk-analyst');
      members.add('controls-auditor');
      members.add('compliance-officer');
      members.add('incident-commander');
      members.add('evidence-auditor');
    }

    // Cap at configured maximum
    const allMembers = Array.from(members);
    return allMembers.slice(0, this.config.maxMembersPerSession);
  }

  private selectPattern(message: string, members: CouncilMemberRole[]): DeliberationPattern {
    const lower = message.toLowerCase();

    // Challenge-response for risk acceptance and high-impact decisions
    if (lower.includes('risk acceptance') || lower.includes('accept risk') || lower.includes('risk appetite')
      || lower.includes('decommission') || lower.includes('retire control') || lower.includes('policy exception')
      || lower.includes('waiver') || lower.includes('accept the risk')) {
      return 'challenge_response';
    }

    // Sequential buildup for investigations and causal analysis
    if (lower.includes('investigate') || lower.includes('root cause') || lower.includes('trace')
      || lower.includes('timeline') || lower.includes('causal') || lower.includes('impact analysis')
      || lower.includes('how did') || lower.includes('what caused') || lower.includes('chain of events')) {
      return 'sequential_buildup';
    }

    // Default: parallel then synthesis
    return this.config.defaultPattern;
  }
}
