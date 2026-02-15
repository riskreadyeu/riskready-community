// gateway/src/run/run-manager.ts
import type { ChatEvent } from '../channels/types.js';

interface RunState {
  id: string;
  status: 'active' | 'done' | 'error';
  events: ChatEvent[];
  subscribers: Set<(e: ChatEvent) => void>;
  cancelFn?: () => void;
  createdAt: number;
  cleanupTimer?: ReturnType<typeof setTimeout>;
}

const CLEANUP_DELAY_MS = 60_000;

export class RunManager {
  private runs = new Map<string, RunState>();

  createRun(runId: string): void {
    const existing = this.runs.get(runId);
    if (existing) {
      if (existing.cleanupTimer) clearTimeout(existing.cleanupTimer);
      return;
    }
    this.runs.set(runId, {
      id: runId,
      status: 'active',
      events: [],
      subscribers: new Set(),
      createdAt: Date.now(),
    });
  }

  emit(runId: string, event: ChatEvent): void {
    const run = this.runs.get(runId);
    if (!run) return;

    run.events.push(event);

    for (const cb of run.subscribers) {
      cb(event);
    }

    if (event.type === 'done' || event.type === 'error') {
      run.status = event.type === 'done' ? 'done' : 'error';
      run.subscribers.clear();
      this.scheduleCleanup(runId);
    }
  }

  subscribe(runId: string, callback: (e: ChatEvent) => void): () => void {
    const run = this.runs.get(runId);
    if (!run) {
      callback({ type: 'error', message: 'Run not found' });
      return () => {};
    }

    // Replay all buffered events
    for (const event of run.events) {
      callback(event);
    }

    // If already finished, no need to subscribe for future events
    if (run.status === 'done' || run.status === 'error') {
      return () => {};
    }

    run.subscribers.add(callback);
    return () => { run.subscribers.delete(callback); };
  }

  registerCancel(runId: string, cancelFn: () => void): void {
    const run = this.runs.get(runId);
    if (run) run.cancelFn = cancelFn;
  }

  cancel(runId: string): void {
    const run = this.runs.get(runId);
    if (run?.cancelFn) {
      run.cancelFn();
      run.cancelFn = undefined;
    }
  }

  hasRun(runId: string): boolean {
    return this.runs.has(runId);
  }

  clear(): void {
    for (const run of this.runs.values()) {
      if (run.cleanupTimer) clearTimeout(run.cleanupTimer);
    }
    this.runs.clear();
  }

  get size(): number {
    return this.runs.size;
  }

  private scheduleCleanup(runId: string): void {
    const run = this.runs.get(runId);
    if (!run) return;
    run.cleanupTimer = setTimeout(() => {
      this.runs.delete(runId);
    }, CLEANUP_DELAY_MS);
  }
}
