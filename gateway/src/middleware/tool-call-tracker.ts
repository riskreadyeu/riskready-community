import { logger } from '../logger.js';

interface UserToolStats {
  callCount: number;
  windowStart: number;
  lastAlertAt: number;
}

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const ALERT_THRESHOLD = 200; // tool calls per hour
const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 min between alerts

const userStats = new Map<string, UserToolStats>();

export function trackToolCall(userId: string): void {
  const now = Date.now();
  let stats = userStats.get(userId);

  if (!stats || now - stats.windowStart > WINDOW_MS) {
    stats = { callCount: 0, windowStart: now, lastAlertAt: 0 };
    userStats.set(userId, stats);
  }

  stats.callCount++;

  if (stats.callCount > ALERT_THRESHOLD && now - stats.lastAlertAt > ALERT_COOLDOWN_MS) {
    stats.lastAlertAt = now;
    logger.warn({
      userId,
      callCount: stats.callCount,
      windowMinutes: Math.round((now - stats.windowStart) / 60000),
      threshold: ALERT_THRESHOLD,
    }, 'Anomalous tool call frequency detected');
  }
}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, stats] of userStats) {
    if (now - stats.windowStart > WINDOW_MS * 2) {
      userStats.delete(userId);
    }
  }
}, 10 * 60 * 1000).unref();

// --- Enforcement-capable tool call tracker ---

export class ToolCallLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolCallLimitError';
  }
}

export interface ToolCallTrackerOptions {
  /** Maximum total calls across all tools. Undefined = no limit. */
  maxTotalCalls?: number;
  /** Maximum calls per individual tool. Undefined = no limit. */
  maxCallsPerTool?: number;
}

/**
 * Tracks per-tool and total tool call counts with optional enforcement.
 *
 * When limits are set, `record()` throws `ToolCallLimitError` if a limit
 * would be exceeded. When no limits are set, it logs only (no enforcement).
 */
export class ToolCallTracker {
  private readonly perToolCounts = new Map<string, number>();
  private totalCalls = 0;
  private readonly maxTotalCalls: number | undefined;
  private readonly maxCallsPerTool: number | undefined;

  constructor(options?: ToolCallTrackerOptions) {
    this.maxTotalCalls = options?.maxTotalCalls;
    this.maxCallsPerTool = options?.maxCallsPerTool;
  }

  /**
   * Record a tool call. Throws `ToolCallLimitError` if enforcement limits
   * are configured and the call would exceed them.
   */
  record(toolName: string): void {
    // Check total limit before recording
    if (this.maxTotalCalls !== undefined && this.totalCalls >= this.maxTotalCalls) {
      throw new ToolCallLimitError(
        `Total tool call limit exceeded: ${this.totalCalls}/${this.maxTotalCalls} calls reached`,
      );
    }

    // Check per-tool limit before recording
    const currentCount = this.perToolCounts.get(toolName) ?? 0;
    if (this.maxCallsPerTool !== undefined && currentCount >= this.maxCallsPerTool) {
      throw new ToolCallLimitError(
        `Per-tool call limit exceeded for "${toolName}": ${currentCount}/${this.maxCallsPerTool} calls reached`,
      );
    }

    // Record the call
    this.totalCalls++;
    this.perToolCounts.set(toolName, currentCount + 1);
  }

  /** Returns the total number of recorded calls across all tools. */
  getTotalCalls(): number {
    return this.totalCalls;
  }

  /** Returns the number of recorded calls for a specific tool. */
  getCallCount(toolName: string): number {
    return this.perToolCounts.get(toolName) ?? 0;
  }

  /** Resets all counters. */
  reset(): void {
    this.perToolCounts.clear();
    this.totalCalls = 0;
  }
}
