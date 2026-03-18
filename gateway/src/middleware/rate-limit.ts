// gateway/src/middleware/rate-limit.ts

import type { FastifyInstance } from 'fastify';
import { logger } from '../logger.js';

export interface RateLimitConfig {
  perUserHour: number;
  perOrgHour: number;
  maxConcurrent: number;
}

interface SlidingWindowEntry {
  timestamps: number[];
}

const userWindows = new Map<string, SlidingWindowEntry>();
const orgWindows = new Map<string, SlidingWindowEntry>();
let concurrentCount = 0;

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function pruneWindow(entry: SlidingWindowEntry, now: number): void {
  const cutoff = now - WINDOW_MS;
  // Find the first index that is within the window
  let i = 0;
  while (i < entry.timestamps.length && entry.timestamps[i] < cutoff) {
    i++;
  }
  if (i > 0) {
    entry.timestamps.splice(0, i);
  }
}

function getWindowCount(map: Map<string, SlidingWindowEntry>, key: string, now: number): number {
  const entry = map.get(key);
  if (!entry) return 0;
  pruneWindow(entry, now);
  return entry.timestamps.length;
}

function recordHit(map: Map<string, SlidingWindowEntry>, key: string, now: number): void {
  let entry = map.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    map.set(key, entry);
  }
  entry.timestamps.push(now);
}

function cleanupStaleEntries(): void {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  for (const [key, entry] of userWindows) {
    pruneWindow(entry, now);
    if (entry.timestamps.length === 0) {
      userWindows.delete(key);
    }
  }
  for (const [key, entry] of orgWindows) {
    pruneWindow(entry, now);
    if (entry.timestamps.length === 0) {
      orgWindows.delete(key);
    }
  }
}

// Periodic cleanup of stale entries
const cleanupTimer = setInterval(cleanupStaleEntries, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

export function registerRateLimit(server: FastifyInstance, config: RateLimitConfig): void {
  server.addHook('preHandler', async (request, reply) => {
    // Only rate-limit the dispatch endpoint
    if (request.method !== 'POST' || request.url !== '/dispatch') return;

    const now = Date.now();

    // Extract user and org from headers or body
    const userId =
      (typeof request.headers['x-user-id'] === 'string' && request.headers['x-user-id']) ||
      (request.body as Record<string, unknown>)?.userId as string | undefined;
    const organisationId =
      (typeof request.headers['x-organisation-id'] === 'string' && request.headers['x-organisation-id']) ||
      (request.body as Record<string, unknown>)?.organisationId as string | undefined;

    // Check concurrent limit
    if (concurrentCount >= config.maxConcurrent) {
      logger.warn({ concurrentCount, max: config.maxConcurrent }, 'Rate limit: max concurrent exceeded');
      reply.header('Retry-After', '30');
      return reply.status(429).send({
        error: 'Too many concurrent agent runs. Please try again shortly.',
      });
    }

    // Check per-user hourly limit
    if (userId) {
      const userCount = getWindowCount(userWindows, userId, now);
      if (userCount >= config.perUserHour) {
        const oldest = userWindows.get(userId)!.timestamps[0];
        const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
        logger.warn({ userId, count: userCount, limit: config.perUserHour }, 'Rate limit: per-user hour exceeded');
        reply.header('Retry-After', String(Math.max(retryAfter, 1)));
        return reply.status(429).send({
          error: 'Hourly request limit exceeded. Please try again later.',
        });
      }
    }

    // Check per-org hourly limit
    if (organisationId) {
      const orgCount = getWindowCount(orgWindows, organisationId, now);
      if (orgCount >= config.perOrgHour) {
        const oldest = orgWindows.get(organisationId)!.timestamps[0];
        const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
        logger.warn({ organisationId, count: orgCount, limit: config.perOrgHour }, 'Rate limit: per-org hour exceeded');
        reply.header('Retry-After', String(Math.max(retryAfter, 1)));
        return reply.status(429).send({
          error: 'Organisation hourly request limit exceeded. Please try again later.',
        });
      }
    }

    // Record the hit for sliding window tracking
    if (userId) recordHit(userWindows, userId, now);
    if (organisationId) recordHit(orgWindows, organisationId, now);
  });
}

export function incrementConcurrent(): void {
  concurrentCount++;
}

export function decrementConcurrent(): void {
  concurrentCount = Math.max(0, concurrentCount - 1);
}

/** Reset all state — for testing only */
export function resetRateLimitState(): void {
  userWindows.clear();
  orgWindows.clear();
  concurrentCount = 0;
}
