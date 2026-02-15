export interface Job {
  id: string;
  userId: string;
  execute: (signal: AbortSignal) => Promise<JobResult>;
}

export interface JobResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface LaneStatus {
  queueDepth: number;
  isRunning: boolean;
}
