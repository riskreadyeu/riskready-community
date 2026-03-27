import { describe, it, expect } from 'vitest';
import {
  wrapMemoryContext,
  wrapTaskContext,
  wrapCouncilQuestion,
  wrapCouncilFindings,
  wrapToolData,
} from '../prompt-sanitizer.js';

describe('wrapMemoryContext', () => {
  it('wraps memories in XML tags', () => {
    const result = wrapMemoryContext([
      { type: 'PREFERENCE', content: 'User prefers tables' },
    ]);
    expect(result).toContain('<RECALLED_MEMORIES>');
    expect(result).toContain('</RECALLED_MEMORIES>');
    expect(result).toContain('<MEMORY type="PREFERENCE">');
    expect(result).toContain('User prefers tables');
  });

  it('truncates individual memory items over 1000 chars', () => {
    const result = wrapMemoryContext([
      { type: 'CONTEXT', content: 'x'.repeat(1500) },
    ]);
    expect(result).toContain('[TRUNCATED]');
    expect(result).not.toContain('x'.repeat(1500));
  });

  it('returns empty string for empty array', () => {
    expect(wrapMemoryContext([])).toBe('');
  });
});

describe('wrapTaskContext', () => {
  it('wraps task in XML tags', () => {
    const result = wrapTaskContext({
      id: 'task-1',
      title: 'Review risks',
      instruction: 'Check all high risks',
      status: 'IN_PROGRESS',
      trigger: 'USER_REQUEST',
    });
    expect(result).toContain('<TASK_CONTEXT>');
    expect(result).toContain('</TASK_CONTEXT>');
    expect(result).toContain('Review risks');
    expect(result).toContain('Check all high risks');
  });

  it('truncates instruction over 2000 chars', () => {
    const result = wrapTaskContext({
      id: 'task-1',
      title: 'Test',
      instruction: 'y'.repeat(3000),
      status: 'PENDING',
      trigger: 'USER_REQUEST',
    });
    expect(result).toContain('[TRUNCATED]');
  });
});

describe('wrapCouncilQuestion', () => {
  it('wraps question in XML tags', () => {
    const result = wrapCouncilQuestion('What is the risk posture?');
    expect(result).toContain('<USER_QUESTION>');
    expect(result).toContain('</USER_QUESTION>');
    expect(result).toContain('What is the risk posture?');
  });

  it('truncates over 5000 chars', () => {
    const result = wrapCouncilQuestion('z'.repeat(6000));
    expect(result).toContain('[TRUNCATED]');
  });
});

describe('wrapCouncilFindings', () => {
  it('wraps findings in XML tags', () => {
    const result = wrapCouncilFindings('Risk analyst found 3 issues');
    expect(result).toContain('<COUNCIL_FINDINGS>');
    expect(result).toContain('</COUNCIL_FINDINGS>');
  });
});

describe('wrapToolData', () => {
  it('wraps tool data with tool name attribute', () => {
    const result = wrapToolData('list_risks', '{"results":[]}');
    expect(result).toContain('<TOOL_DATA tool="list_risks">');
    expect(result).toContain('</TOOL_DATA>');
  });
});
