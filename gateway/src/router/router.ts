import type { SkillDefinition } from '../agent/skill-registry.js';
import { SkillRegistry } from '../agent/skill-registry.js';

const KEYWORD_TAG_MAP: Record<string, string[]> = {
  control: ['controls'], controls: ['controls'], soa: ['controls'],
  assessment: ['controls'], 'iso 27001': ['controls', 'compliance'],
  iso27001: ['controls'], metric: ['controls'],
  compliance: ['compliance', 'controls'], dora: ['compliance', 'controls'],
  regulation: ['compliance'], nis2: ['compliance', 'controls'],
  gap: ['controls'], 'gap analysis': ['controls'],
  'statement of applicability': ['controls'],
};

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

    // 3. No keyword match? Return all (which is just controls in community)
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
}
