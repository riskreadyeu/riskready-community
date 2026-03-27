import { describe, it, expect, beforeEach } from 'vitest';
import { LaneQueue } from '../lane-queue.js';
import type { Job } from '../types.js';

function makeJob(userId: string, result: unknown, delayMs = 0): Job {
  return {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId,
    execute: async (_signal: AbortSignal) => {
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      return { success: true, data: result };
    },
  };
}

function makeFailingJob(userId: string, error: string): Job {
  return {
    id: `job-fail-${Date.now()}`,
    userId,
    execute: async () => {
      throw new Error(error);
    },
  };
}

describe('LaneQueue', () => {
  let queue: LaneQueue;

  beforeEach(() => {
    queue = new LaneQueue({ maxDepthPerUser: 3, jobTimeoutMs: 5000 });
  });

  it('executes a single job and returns result', async () => {
    const job = makeJob('user-1', 'hello');
    const result = await queue.enqueue(job);
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('serializes jobs for the same user', async () => {
    const order: number[] = [];
    const job1: Job = {
      id: 'j1',
      userId: 'user-1',
      execute: async () => {
        await new Promise((r) => setTimeout(r, 50));
        order.push(1);
        return { success: true };
      },
    };
    const job2: Job = {
      id: 'j2',
      userId: 'user-1',
      execute: async () => {
        order.push(2);
        return { success: true };
      },
    };

    const [r1, r2] = await Promise.all([
      queue.enqueue(job1),
      queue.enqueue(job2),
    ]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(order).toEqual([1, 2]);
  });

  it('runs different users in parallel', async () => {
    const start = Date.now();
    const job1 = makeJob('user-1', 'a', 50);
    const job2 = makeJob('user-2', 'b', 50);

    await Promise.all([queue.enqueue(job1), queue.enqueue(job2)]);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(90);
  });

  it('rejects when queue depth exceeds max', async () => {
    const slowJob = makeJob('user-1', 'slow', 200);
    queue.enqueue(slowJob);
    queue.enqueue(makeJob('user-1', 'q1'));
    queue.enqueue(makeJob('user-1', 'q2'));

    await expect(
      queue.enqueue(makeJob('user-1', 'overflow')),
    ).rejects.toThrow('Queue full');
  });

  it('continues processing after a job fails', async () => {
    const failJob = makeFailingJob('user-1', 'boom');
    const goodJob = makeJob('user-1', 'ok');

    const r1 = queue.enqueue(failJob).catch((e) => ({ success: false, error: e.message }));
    const r2 = queue.enqueue(goodJob);

    const [result1, result2] = await Promise.all([r1, r2]);
    expect(result1).toEqual({ success: false, error: 'boom' });
    expect(result2.success).toBe(true);
    expect(result2.data).toBe('ok');
  });

  it('reports lane status', async () => {
    const slowJob = makeJob('user-1', 'slow', 100);
    queue.enqueue(slowJob);
    queue.enqueue(makeJob('user-1', 'q1'));

    const status = queue.getStatus('user-1');
    expect(status.queueDepth).toBeGreaterThanOrEqual(1);

    const emptyStatus = queue.getStatus('user-999');
    expect(emptyStatus.queueDepth).toBe(0);
    expect(emptyStatus.isRunning).toBe(false);
  });

  it('drain resolves when all active jobs complete', async () => {
    let resolveJob!: () => void;
    const jobPromise = new Promise<void>((r) => { resolveJob = r; });

    queue.enqueue({
      id: 'j1',
      userId: 'u1',
      execute: async () => {
        await jobPromise;
        return { success: true };
      },
    });

    // Give the job time to start
    await new Promise((r) => setTimeout(r, 10));

    const drainPromise = queue.drain(5000);
    resolveJob();

    await expect(drainPromise).resolves.toBeUndefined();
  });

  it('cancels a running job via abort signal', async () => {
    const job: Job = {
      id: 'cancellable',
      userId: 'user-1',
      execute: async (signal) => {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 5000);
          signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Aborted'));
          });
        });
        return { success: true };
      },
    };

    const promise = queue.enqueue(job);
    await new Promise((r) => setTimeout(r, 10));
    queue.cancel('user-1', 'cancellable');

    await expect(promise).rejects.toThrow('Aborted');
  });
});
