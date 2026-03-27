import type { Job, JobResult, LaneStatus } from './types.js';
import { logger } from '../logger.js';

interface LaneQueueOptions {
  maxDepthPerUser: number;
  jobTimeoutMs: number;
}

interface Lane {
  chain: Promise<void>;
  depth: number;
  activeJobId: string | null;
  abortController: AbortController | null;
}

export class LaneQueue {
  private lanes = new Map<string, Lane>();
  private opts: LaneQueueOptions;

  constructor(opts: LaneQueueOptions) {
    this.opts = opts;
  }

  async enqueue(job: Job): Promise<JobResult> {
    let lane = this.lanes.get(job.userId);
    if (!lane) {
      lane = { chain: Promise.resolve(), depth: 0, activeJobId: null, abortController: null };
      this.lanes.set(job.userId, lane);
    }

    if (lane.depth >= this.opts.maxDepthPerUser) {
      throw new Error('Queue full for this user');
    }

    lane.depth++;

    return new Promise<JobResult>((resolve, reject) => {
      lane!.chain = lane!.chain
        .then(async () => {
          const ac = new AbortController();
          lane!.activeJobId = job.id;
          lane!.abortController = ac;

          const timeout = setTimeout(() => ac.abort(), this.opts.jobTimeoutMs);

          try {
            const result = await job.execute(ac.signal);
            resolve(result);
          } catch (err) {
            reject(err);
          } finally {
            clearTimeout(timeout);
            lane!.activeJobId = null;
            lane!.abortController = null;
            lane!.depth--;
            if (lane!.depth === 0) {
              this.lanes.delete(job.userId);
            }
          }
        })
        .catch((err) => {
          logger.error({ err, userId: job.userId }, 'Unhandled error in job chain');
        });
    });
  }

  cancel(userId: string, jobId: string): void {
    const lane = this.lanes.get(userId);
    if (lane && lane.activeJobId === jobId && lane.abortController) {
      lane.abortController.abort();
    }
  }

  async drain(timeoutMs: number): Promise<void> {
    const activePromises: Promise<void>[] = [];
    for (const lane of this.lanes.values()) {
      if (lane.depth > 0) {
        activePromises.push(lane.chain);
      }
    }
    if (activePromises.length === 0) return;

    const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
    await Promise.race([
      Promise.allSettled(activePromises),
      timeout,
    ]);

    // Abort any still-running jobs after timeout
    for (const lane of this.lanes.values()) {
      if (lane.abortController) {
        lane.abortController.abort();
      }
    }
  }

  getStatus(userId: string): LaneStatus {
    const lane = this.lanes.get(userId);
    if (!lane) return { queueDepth: 0, isRunning: false };
    return {
      queueDepth: lane.depth,
      isRunning: lane.activeJobId !== null,
    };
  }
}
