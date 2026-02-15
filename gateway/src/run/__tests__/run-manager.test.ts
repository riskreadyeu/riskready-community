// gateway/src/run/__tests__/run-manager.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RunManager } from '../run-manager.js';
import type { ChatEvent } from '../../channels/types.js';

describe('RunManager', () => {
  let manager: RunManager;

  beforeEach(() => {
    manager = new RunManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    manager.clear();
    vi.useRealTimers();
  });

  it('creates a run', () => {
    manager.createRun('run-1');
    expect(manager.hasRun('run-1')).toBe(true);
  });

  it('emits events to live subscribers', () => {
    manager.createRun('run-1');
    const events: ChatEvent[] = [];
    manager.subscribe('run-1', (e) => events.push(e));

    manager.emit('run-1', { type: 'text_delta', text: 'hello' });

    expect(events).toEqual([{ type: 'text_delta', text: 'hello' }]);
  });

  it('replays buffered events on late subscribe', () => {
    manager.createRun('run-1');
    manager.emit('run-1', { type: 'text_delta', text: 'a' });
    manager.emit('run-1', { type: 'text_delta', text: 'b' });

    const events: ChatEvent[] = [];
    manager.subscribe('run-1', (e) => events.push(e));

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: 'text_delta', text: 'a' });
  });

  it('replays everything for completed runs', () => {
    manager.createRun('run-1');
    manager.emit('run-1', { type: 'text_delta', text: 'hello' });
    manager.emit('run-1', { type: 'done', messageId: 'msg-1' });

    const events: ChatEvent[] = [];
    manager.subscribe('run-1', (e) => events.push(e));

    expect(events).toHaveLength(2);
    expect(events[1].type).toBe('done');
  });

  it('clears subscribers after done', () => {
    manager.createRun('run-1');
    const events: ChatEvent[] = [];
    manager.subscribe('run-1', (e) => events.push(e));

    manager.emit('run-1', { type: 'done', messageId: 'msg-1' });

    expect(events).toHaveLength(1);
  });

  it('sends error for unknown run', () => {
    const events: ChatEvent[] = [];
    manager.subscribe('nonexistent', (e) => events.push(e));

    expect(events).toEqual([{ type: 'error', message: 'Run not found' }]);
  });

  it('unsubscribe stops delivery', () => {
    manager.createRun('run-1');
    const events: ChatEvent[] = [];
    const unsub = manager.subscribe('run-1', (e) => events.push(e));

    unsub();
    manager.emit('run-1', { type: 'text_delta', text: 'after' });

    expect(events).toHaveLength(0);
  });

  it('cancel calls the registered cancel function', () => {
    manager.createRun('run-1');
    const fn = vi.fn();
    manager.registerCancel('run-1', fn);

    manager.cancel('run-1');

    expect(fn).toHaveBeenCalledOnce();
  });

  it('auto-cleans runs 60s after done', () => {
    manager.createRun('run-1');
    manager.emit('run-1', { type: 'done', messageId: 'msg-1' });

    expect(manager.hasRun('run-1')).toBe(true);
    vi.advanceTimersByTime(60_001);
    expect(manager.hasRun('run-1')).toBe(false);
  });
});
