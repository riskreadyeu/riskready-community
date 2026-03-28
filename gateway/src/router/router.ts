import type { SkillDefinition } from '../agent/skill-registry.js';
import { SkillRegistry } from '../agent/skill-registry.js';

const KEYWORD_TAG_MAP: Record<string, string[]> = {
  // Controls
  control: ['controls'], controls: ['controls'], soa: ['controls'],
  assessment: ['controls'], metric: ['controls'],
  'statement of applicability': ['controls'],
  'gap analysis': ['controls'], gap: ['controls'],

  // Compliance / frameworks
  'iso 27001': ['controls', 'compliance'], iso27001: ['controls', 'compliance'],
  compliance: ['compliance', 'controls'], dora: ['compliance', 'controls'],
  regulation: ['compliance'], nis2: ['compliance', 'controls'],

  // Risks
  risk: ['risks'], risks: ['risks'], kri: ['risks'],
  'key risk indicator': ['risks'], tolerance: ['risks'],
  treatment: ['risks'], 'risk treatment': ['risks'],
  scenario: ['risks'], 'risk scenario': ['risks'],
  'risk register': ['risks'], appetite: ['risks'],

  // Incidents
  incident: ['incidents'], incidents: ['incidents'],
  breach: ['incidents'], 'security incident': ['incidents'],
  'lessons learned': ['incidents'], ransomware: ['incidents'],
  phishing: ['incidents'], malware: ['incidents'],

  // Policies
  policy: ['governance'], policies: ['governance'],
  'policy review': ['governance'], exception: ['governance'],
  governance: ['governance'],

  // Evidence
  evidence: ['evidence', 'compliance'], 'evidence request': ['evidence'],
  attestation: ['evidence'],

  // Audits
  audit: ['audits', 'compliance'], audits: ['audits', 'compliance'],
  nonconformity: ['audits'], finding: ['audits'],
  'corrective action': ['audits'], 'audit finding': ['audits'],

  // ITSM
  asset: ['itsm', 'cmdb'], assets: ['itsm', 'cmdb'],
  cmdb: ['itsm', 'cmdb'], 'change management': ['itsm'],
  capacity: ['itsm'], 'software inventory': ['itsm'],
  itsm: ['itsm'],

  // Organisation
  organisation: ['organisation', 'governance'], organization: ['organisation', 'governance'],
  department: ['organisation'], location: ['organisation'],
  committee: ['organisation'], 'business process': ['organisation'],

  // Expanded risk/incident terms
  vulnerability: ['risks', 'incidents'], threat: ['risks', 'incidents'],
  'risk appetite': ['risks'], 'risk owner': ['risks'],
  residual: ['risks'], inherent: ['risks'], likelihood: ['risks'],
  impact: ['risks'], 'risk matrix': ['risks'], heatmap: ['risks'],

  // Expanded control/ITSM terms
  firewall: ['controls', 'itsm'], antivirus: ['controls', 'itsm'],
  encryption: ['controls'], backup: ['controls', 'itsm'],
  'access control': ['controls'], mfa: ['controls'],
  'two factor': ['controls'], authentication: ['controls'],
  patch: ['controls', 'itsm'], patching: ['controls', 'itsm'],

  // Expanded compliance terms
  nist: ['compliance', 'controls'], gdpr: ['compliance'],
  pci: ['compliance'], hipaa: ['compliance'], sox: ['compliance'],
  certification: ['compliance'], accreditation: ['compliance'],

  // Expanded incident terms
  'data leak': ['incidents'], 'data loss': ['incidents'],
  outage: ['incidents', 'itsm'], downtime: ['incidents', 'itsm'],
  'denial of service': ['incidents'], ddos: ['incidents'],
  'social engineering': ['incidents'], insider: ['incidents'],

  // Expanded evidence/audit terms
  'audit trail': ['audits', 'evidence'], 'audit log': ['audits'],
  'evidence collection': ['evidence'], screenshot: ['evidence'],
  'supporting document': ['evidence'],

  // Expanded ITSM terms
  server: ['itsm'], network: ['itsm'], database: ['itsm'],
  'service desk': ['itsm'], configuration: ['itsm'],
  'change request': ['itsm'], 'release management': ['itsm'],

  // Expanded organisation terms
  stakeholder: ['organisation'], 'interested party': ['organisation'],
  'business continuity': ['organisation', 'risks'], bcdr: ['organisation', 'risks'],
};

// Phrases that trigger the council (Phase 5) — exported for use by council classifier
export const COUNCIL_TRIGGER_PHRASES = [
  'overall posture', 'maturity assessment', 'board report', 'council review',
  'multi-perspective', 'full assessment', 'comprehensive review', 'posture assessment',
  'cross-domain', 'holistic view', 'executive summary', 'security posture',
];

export class Router {
  constructor(private registry: SkillRegistry) {}

  route(message: string): SkillDefinition[] {
    const lower = message.toLowerCase();

    // 1. Check for explicit skill requests
    const explicitMatch = lower.match(/@(riskready-[\w-]+)/);
    if (explicitMatch) {
      const skill = this.registry.get(explicitMatch[1]);
      if (skill) {
        return [skill];
      }
    }

    // 2. Classify by keywords
    const matchedTags = new Set<string>();
    for (const [keyword, tags] of Object.entries(KEYWORD_TAG_MAP)) {
      if (new RegExp(`\\b${keyword}\\b`).test(lower)) {
        for (const tag of tags) matchedTags.add(tag);
      }
    }

    // 3. No keyword match? Return all
    if (matchedTags.size === 0) {
      return this.registry.listAll();
    }

    // 4. Find skills matching tags
    const matched = this.registry.findByTags(Array.from(matchedTags));

    // Deduplicate
    const seen = new Set<string>();
    return matched.filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    });
  }

  /**
   * Count how many distinct domain categories are triggered by a message.
   * Used by the council classifier to decide if multi-agent deliberation is needed.
   */
  countDistinctDomains(message: string): number {
    const lower = message.toLowerCase();
    const domainCategories = new Set<string>();

    const tagToDomain: Record<string, string> = {
      controls: 'controls',
      compliance: 'compliance',
      risks: 'risks',
      incidents: 'incidents',
      governance: 'policies',
      evidence: 'evidence',
      audits: 'audits',
      itsm: 'itsm',
      cmdb: 'itsm',
      organisation: 'organisation',
    };

    for (const [keyword, tags] of Object.entries(KEYWORD_TAG_MAP)) {
      if (new RegExp(`\\b${keyword}\\b`).test(lower)) {
        for (const tag of tags) {
          const domain = tagToDomain[tag];
          if (domain) domainCategories.add(domain);
        }
      }
    }

    return domainCategories.size;
  }
}
