// gateway/src/channels/__tests__/internal.adapter.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InternalAdapter } from '../internal.adapter.js';
import type { UnifiedMessage } from '../types.js';

describe('InternalAdapter', () => {
  let adapter: InternalAdapter;
  const PORT = 13100;

  beforeEach(async () => {
    adapter = new InternalAdapter({ port: PORT });
    await adapter.start();
  });

  afterEach(async () => {
    await adapter.stop();
  });

  it('accepts POST /dispatch and emits UnifiedMessage', async () => {
    const received: UnifiedMessage[] = [];
    adapter.onMessage((msg) => received.push(msg));

    const res = await fetch(`http://127.0.0.1:${PORT}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-1',
        organisationId: 'org-1',
        conversationId: 'conv-1',
        text: 'Hello AI',
        fileIds: [],
      }),
    });

    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.runId).toBeDefined();

    expect(received).toHaveLength(1);
    expect(received[0].channel).toBe('web');
    expect(received[0].text).toBe('Hello AI');
    expect(received[0].userId).toBe('user-1');
  });

  it('returns 400 when text is missing', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-1', organisationId: 'org-1' }),
    });

    expect(res.status).toBe(400);
  });

  it('responds to GET /health', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('supports POST /cancel/:runId', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/cancel/run-123`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
  });
});

describe('InternalAdapter with secret', () => {
  let adapter: InternalAdapter;
  const PORT = 13101;
  const SECRET = 'test-secret';

  beforeEach(async () => {
    adapter = new InternalAdapter({ port: PORT, secret: SECRET });
    await adapter.start();
  });

  afterEach(async () => {
    await adapter.stop();
  });

  it('returns 401 when X-Gateway-Secret is missing', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', organisationId: 'o1', text: 'hi' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when X-Gateway-Secret is wrong', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Gateway-Secret': 'wrong' },
      body: JSON.stringify({ userId: 'u1', organisationId: 'o1', text: 'hi' }),
    });
    expect(res.status).toBe(401);
  });

  it('allows /health without secret header', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/health`);
    expect(res.status).toBe(200);
  });

  it('allows /dispatch with correct secret', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Secret': SECRET,
        'X-User-Id': 'u1',
        'X-Organisation-Id': 'o1',
      },
      body: JSON.stringify({ text: 'hi' }),
    });
    expect(res.status).toBe(202);
  });
});
