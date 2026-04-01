import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Gateway } from '../gateway.js';
import type { GatewayConfig } from '../config.js';

const TEST_PORT = 13200;

// Use a minimal config that skips skills.yaml loading
// since integration test just verifies the HTTP pipeline
describe('Gateway Integration', () => {
  let gateway: Gateway;

  beforeAll(async () => {
    // Create a config with a test skills.yaml path
    // The Gateway will try to load skills.yaml from this path
    // Write a minimal one for testing
    const { writeFileSync } = await import('node:fs');
    writeFileSync('/tmp/test-skills.yaml', 'skills: []');

    const testConfig: GatewayConfig = {
      port: TEST_PORT,
      databaseUrl: 'postgresql://riskready:riskready_dev_password@localhost:5432/riskready',
      logLevel: 'warn',
      queue: { maxDepthPerUser: 5, jobTimeoutMs: 30000 },
      skills: { configPath: '/tmp/test-skills.yaml' },
      maxTokenBudget: 500_000,
      council: {
        enabled: false,
        classifierMode: 'heuristic',
        maxMembersPerSession: 6,
        maxTurnsPerMember: 15,
        defaultPattern: 'parallel_then_synthesis',
        maxTokenBudgetPerMember: 80_000,
        domainThreshold: 3,
      },
      rateLimit: {
        perUserHour: 30,
        perOrgHour: 100,
        maxConcurrent: 20,
      },
    };

    gateway = new Gateway(testConfig);
    await gateway.start();
  });

  afterAll(async () => {
    await gateway.stop();
    const { unlinkSync } = await import('node:fs');
    try { unlinkSync('/tmp/test-skills.yaml'); } catch {}
  });

  it('dispatches a message and receives a runId', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        organisationId: 'test-org',
        conversationId: 'test-conv',
        text: 'What are our top risks?',
      }),
    });

    expect(res.status).toBe(202);
    const { runId } = await res.json();
    expect(runId).toBeDefined();
    expect(typeof runId).toBe('string');
  });

  it('responds to health check', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('handles cancellation gracefully', async () => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/cancel/nonexistent`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
  });
});
