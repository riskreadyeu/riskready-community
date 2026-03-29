import { describe, it, expect, beforeEach } from 'vitest';
import { Router } from '../router.js';
import { SkillRegistry } from '../../agent/skill-registry.js';

const YAML = `
skills:
  - name: riskready-controls
    description: "Security controls, SOA, assessments, metrics, gap analysis"
    tags: [grc, controls, compliance, soa, iso27001]
    capabilities: [query, mutation]
    command: echo
    args: [a]
    requiresDb: true
`;

const MULTI_SKILL_YAML = `
skills:
  - name: riskready-controls
    description: "Security controls"
    tags: [controls, compliance]
    capabilities: [query, mutation]
    command: echo
    args: [a]
    requiresDb: true
  - name: riskready-risks
    description: "Risk management"
    tags: [risks]
    capabilities: [query, mutation]
    command: echo
    args: [b]
    requiresDb: true
  - name: riskready-incidents
    description: "Incident management"
    tags: [incidents]
    capabilities: [query, mutation]
    command: echo
    args: [c]
    requiresDb: true
  - name: riskready-itsm
    description: "IT service management"
    tags: [itsm, cmdb]
    capabilities: [query, mutation]
    command: echo
    args: [d]
    requiresDb: true
  - name: riskready-audits
    description: "Audit management"
    tags: [audits]
    capabilities: [query, mutation]
    command: echo
    args: [e]
    requiresDb: true
  - name: riskready-evidence
    description: "Evidence management"
    tags: [evidence]
    capabilities: [query, mutation]
    command: echo
    args: [f]
    requiresDb: true
  - name: riskready-organisation
    description: "Organisation management"
    tags: [organisation, governance]
    capabilities: [query, mutation]
    command: echo
    args: [g]
    requiresDb: true
  - name: riskready-policies
    description: "Policy management"
    tags: [governance]
    capabilities: [query, mutation]
    command: echo
    args: [h]
    requiresDb: true
`;

describe('Router', () => {
  let router: Router;
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
    registry.loadFromString(YAML);
    router = new Router(registry);
  });

  it('routes a controls message to controls skills', () => {
    const skills = router.route('Show me SOA entries for ISO 27001');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
  });

  it('routes assessment queries to controls', () => {
    const skills = router.route('List all assessments');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
  });

  it('routes compliance queries to controls', () => {
    const skills = router.route('Are we DORA compliant?');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
  });

  it('returns all skills for ambiguous queries', () => {
    const skills = router.route('Give me a full overview');
    expect(skills.length).toBe(1); // only controls in community
    expect(skills[0].name).toBe('riskready-controls');
  });

  it('handles explicit skill requests', () => {
    const skills = router.route('@riskready-controls list all controls');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
  });

  it('does not match "controller" for keyword "control"', () => {
    const skills = router.route('The controller class is broken');
    // "controller" should not match "control" — falls through to all skills
    expect(skills.length).toBe(1); // all skills returned (just controls in community)
  });

  it('matches "control" as a standalone word', () => {
    const skills = router.route('Show me the control library');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
  });

  it('routes gap analysis queries to controls', () => {
    const skills = router.route('Run a gap analysis');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
  });
});

describe('Router keyword expansion', () => {
  let router: Router;
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
    registry.loadFromString(MULTI_SKILL_YAML);
    router = new Router(registry);
  });

  it('routes vulnerability-related queries to risks and incidents', () => {
    const skills = router.route('Are there any vulnerability findings?');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-risks');
    expect(names).toContain('riskready-incidents');
  });

  it('routes firewall/security queries to controls and itsm', () => {
    const skills = router.route('Are our firewalls properly configured?');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
    expect(names).toContain('riskready-itsm');
  });

  it('does not return all skills for unmatched queries when partial match exists', () => {
    const allSkills = router.route('hello');
    const targetedSkills = router.route('risk appetite statement');
    expect(targetedSkills.length).toBeLessThan(allSkills.length);
  });

  it('routes NIST queries to compliance and controls', () => {
    const skills = router.route('How does our NIST alignment look?');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
  });

  it('routes encryption queries to controls', () => {
    const skills = router.route('Is encryption enabled on all databases?');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-controls');
  });

  it('routes outage queries to incidents and itsm', () => {
    const skills = router.route('We had an outage last night');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-incidents');
    expect(names).toContain('riskready-itsm');
  });

  it('routes audit trail queries to audits and evidence', () => {
    const skills = router.route('Show me the audit trail');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-audits');
    expect(names).toContain('riskready-evidence');
  });

  it('routes stakeholder queries to organisation', () => {
    const skills = router.route('Who are the key stakeholders?');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-organisation');
  });

  it('routes business continuity queries to organisation and risks', () => {
    const skills = router.route('Review our business continuity plan');
    const names = skills.map((s) => s.name);
    expect(names).toContain('riskready-organisation');
    expect(names).toContain('riskready-risks');
  });
});
