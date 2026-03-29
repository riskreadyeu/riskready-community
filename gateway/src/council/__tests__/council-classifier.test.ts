import { describe, it, expect } from 'vitest';
import { CouncilClassifier } from '../council-classifier.js';
import { Router } from '../../router/router.js';
import { SkillRegistry } from '../../agent/skill-registry.js';

describe('CouncilClassifier with custom threshold', () => {
  // Create a minimal SkillRegistry+Router for testing
  const registry = new SkillRegistry();
  const router = new Router(registry);

  it('does not convene with threshold=5 when only 3 domains triggered', () => {
    const classifier = new CouncilClassifier(router, { enabled: true, domainThreshold: 5 });
    const result = classifier.classify('risks controls incidents');
    expect(result.convene).toBe(false);
  });

  it('convenes with threshold=2 when 2 domains triggered', () => {
    const classifier = new CouncilClassifier(router, { enabled: true, domainThreshold: 2 });
    const result = classifier.classify('What are our risks and controls?');
    expect(result.convene).toBe(true);
  });

  it('uses default threshold of 3 when not specified', () => {
    const classifier = new CouncilClassifier(router, { enabled: true });
    // 2 domains should not convene with default threshold of 3
    const result = classifier.classify('What are our risks and controls?');
    expect(result.convene).toBe(false);
  });

  it('convenes on trigger phrases regardless of threshold', () => {
    const classifier = new CouncilClassifier(router, { enabled: true, domainThreshold: 99 });
    const result = classifier.classify('give me a comprehensive review of our security posture');
    expect(result.convene).toBe(true);
  });
});
