import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillRegistry } from '../skill-registry.js';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => ({
    pid: 12345,
    kill: vi.fn(),
    on: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
  })),
}));

const YAML_CONTENT = `
skills:
  - name: test-skill-a
    description: "Test skill A"
    tags: [test, alpha]
    capabilities: [query]
    command: echo
    args: [hello]
    requiresDb: false

  - name: test-skill-b
    description: "Test skill B for risk"
    tags: [risk, beta]
    capabilities: [query, mutation]
    command: echo
    args: [world]
    requiresDb: true
`;

describe('SkillRegistry', () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
    registry.loadFromString(YAML_CONTENT);
  });

  it('loads skill definitions from YAML', () => {
    const skills = registry.listAll();
    expect(skills).toHaveLength(2);
    expect(skills[0].name).toBe('test-skill-a');
    expect(skills[1].name).toBe('test-skill-b');
  });

  it('finds skills by tags', () => {
    const results = registry.findByTags(['risk']);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('test-skill-b');
  });

  it('finds skills by capability', () => {
    const results = registry.findByCapability('mutation');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('test-skill-b');
  });

  it('returns empty array for unknown tags', () => {
    const results = registry.findByTags(['nonexistent']);
    expect(results).toHaveLength(0);
  });

  it('gets a specific skill by name', () => {
    const skill = registry.get('test-skill-a');
    expect(skill).toBeDefined();
    expect(skill!.description).toBe('Test skill A');
  });

  it('returns undefined for unknown skill name', () => {
    expect(registry.get('nope')).toBeUndefined();
  });
});
