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
