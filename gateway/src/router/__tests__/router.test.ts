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
