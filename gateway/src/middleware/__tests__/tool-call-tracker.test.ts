import { describe, it, expect } from 'vitest';
import { ToolCallTracker, ToolCallLimitError } from '../tool-call-tracker.js';

describe('ToolCallTracker enforcement', () => {
  it('throws when total call limit exceeded', () => {
    const tracker = new ToolCallTracker({ maxTotalCalls: 3 });
    tracker.record('tool_a');
    tracker.record('tool_b');
    tracker.record('tool_c');
    expect(() => tracker.record('tool_d')).toThrow(/total tool call limit/i);
  });

  it('throws ToolCallLimitError when total call limit exceeded', () => {
    const tracker = new ToolCallTracker({ maxTotalCalls: 1 });
    tracker.record('tool_a');
    expect(() => tracker.record('tool_b')).toThrow(ToolCallLimitError);
  });

  it('throws when per-tool call limit exceeded', () => {
    const tracker = new ToolCallTracker({ maxCallsPerTool: 2 });
    tracker.record('tool_a');
    tracker.record('tool_a');
    expect(() => tracker.record('tool_a')).toThrow(/per-tool call limit/i);
  });

  it('allows different tools up to per-tool limit', () => {
    const tracker = new ToolCallTracker({ maxCallsPerTool: 2 });
    tracker.record('tool_a');
    tracker.record('tool_a');
    tracker.record('tool_b');
    tracker.record('tool_b');
    expect(tracker.getTotalCalls()).toBe(4);
  });

  it('does not throw when limits not set', () => {
    const tracker = new ToolCallTracker();
    for (let i = 0; i < 100; i++) {
      tracker.record('tool_a');
    }
    expect(tracker.getTotalCalls()).toBe(100);
  });

  it('tracks calls correctly', () => {
    const tracker = new ToolCallTracker({ maxTotalCalls: 10 });
    tracker.record('tool_a');
    tracker.record('tool_b');
    tracker.record('tool_a');
    expect(tracker.getTotalCalls()).toBe(3);
    expect(tracker.getCallCount('tool_a')).toBe(2);
    expect(tracker.getCallCount('tool_b')).toBe(1);
  });

  it('returns 0 for unknown tool names', () => {
    const tracker = new ToolCallTracker();
    expect(tracker.getCallCount('nonexistent')).toBe(0);
  });

  it('resets all counters', () => {
    const tracker = new ToolCallTracker({ maxTotalCalls: 5 });
    tracker.record('tool_a');
    tracker.record('tool_b');
    tracker.reset();
    expect(tracker.getTotalCalls()).toBe(0);
    expect(tracker.getCallCount('tool_a')).toBe(0);
    // Can record again after reset
    tracker.record('tool_a');
    expect(tracker.getTotalCalls()).toBe(1);
  });

  it('enforces both limits simultaneously', () => {
    const tracker = new ToolCallTracker({ maxTotalCalls: 5, maxCallsPerTool: 2 });
    tracker.record('tool_a');
    tracker.record('tool_a');
    // Per-tool limit hit before total
    expect(() => tracker.record('tool_a')).toThrow(/per-tool call limit/i);
    // Other tools still work
    tracker.record('tool_b');
    tracker.record('tool_c');
    tracker.record('tool_d');
    // Now total limit is hit
    expect(() => tracker.record('tool_e')).toThrow(/total tool call limit/i);
  });
});
