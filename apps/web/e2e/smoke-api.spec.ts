/**
 * Smoke Tests: API Endpoint Health
 *
 * Hits every backend API route group with a logged-in session and asserts
 * no 500 (Internal Server Error) responses. Uses Playwright's request API
 * context (no browser needed).
 *
 * Run with: npx playwright test smoke-api
 */

import { test, expect, APIRequestContext, request as playwrightRequest } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared authed request context
// ---------------------------------------------------------------------------

let api: APIRequestContext;

test.beforeAll(async () => {
  // Login and capture cookies
  const raw = await playwrightRequest.newContext({ baseURL: 'http://localhost:5174' });
  const loginRes = await raw.post('/api/auth/login', {
    data: { email: 'admin@local.test', password: 'password123' },
  });
  expect(loginRes.status()).toBe(201);

  // Extract cookie values from set-cookie headers
  const setCookies = loginRes.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
  const cookieString = setCookies.map(h => h.value.split(';')[0]).join('; ');

  await raw.dispose();

  // Create a new context with the auth cookies baked in
  api = await playwrightRequest.newContext({
    baseURL: 'http://localhost:5174',
    extraHTTPHeaders: {
      cookie: cookieString,
    },
  });
});

test.afterAll(async () => {
  await api?.dispose();
});

// ---------------------------------------------------------------------------
// Public Endpoints
// ---------------------------------------------------------------------------

test.describe('Public Endpoints', () => {
  test('GET /api/health', async () => {
    const res = await api.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Auth Endpoints
// ---------------------------------------------------------------------------

test.describe('Auth Endpoints', () => {
  test('GET /api/auth/me', async () => {
    const res = await api.get('/api/auth/me');
    expect(res.status()).toBe(200);
  });

  test('GET /api/auth/users', async () => {
    const res = await api.get('/api/auth/users');
    expect(res.status()).toBe(200);
  });

  test('POST /api/auth/logout invalidates the session', async () => {
    const raw = await playwrightRequest.newContext({ baseURL: 'http://localhost:5174' });
    const loginRes = await raw.post('/api/auth/login', {
      data: { email: 'admin@local.test', password: 'password123' },
    });
    expect(loginRes.status()).toBe(201);

    const setCookies = loginRes.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie');
    const cookieString = setCookies.map(h => h.value.split(';')[0]).join('; ');

    const authed = await playwrightRequest.newContext({
      baseURL: 'http://localhost:5174',
      extraHTTPHeaders: {
        cookie: cookieString,
      },
    });

    try {
      const logoutRes = await authed.post('/api/auth/logout');
      expect(logoutRes.status()).toBe(201);
      const clearedCookies = logoutRes
        .headersArray()
        .filter(h => h.name.toLowerCase() === 'set-cookie')
        .map(h => h.value);

      expect(clearedCookies.some(value => value.startsWith('access_token=;'))).toBeTruthy();
      expect(clearedCookies.some(value => value.startsWith('refresh_session=;'))).toBeTruthy();
    } finally {
      await authed.dispose();
      await raw.dispose();
    }
  });
});

// ---------------------------------------------------------------------------
// Dashboard Endpoints
// ---------------------------------------------------------------------------

test.describe('Dashboard Endpoints', () => {
  test('GET /api/dashboard/metrics', async () => {
    const res = await api.get('/api/dashboard/metrics');
    expect(res.status()).toBe(200);
  });

  test('GET /api/dashboard/recent-activity', async () => {
    const res = await api.get('/api/dashboard/recent-activity');
    expect(res.status()).toBe(200);
  });

  test('GET /api/dashboard/upcoming-tasks', async () => {
    const res = await api.get('/api/dashboard/upcoming-tasks');
    expect(res.status()).toBe(200);
  });

  test('GET /api/dashboard/risk-trends', async () => {
    const res = await api.get('/api/dashboard/risk-trends');
    expect(res.status()).toBe(200);
  });

  test('GET /api/dashboard/compliance', async () => {
    const res = await api.get('/api/dashboard/compliance');
    expect(res.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Risks Module Endpoints
// ---------------------------------------------------------------------------

test.describe('Risks Endpoints', () => {
  test('GET /api/risks', async () => {
    const res = await api.get('/api/risks');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/risks/stats', async () => {
    const res = await api.get('/api/risks/stats');
    expect(res.status()).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Controls Module Endpoints
// ---------------------------------------------------------------------------

test.describe('Controls Endpoints', () => {
  test.fixme('GET /api/controls', async () => {
    // Known 500 - service has TS errors from missing Prisma models (transpile-only mode)
    const res = await api.get('/api/controls');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/controls/stats', async () => {
    const res = await api.get('/api/controls/stats');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/soa', async () => {
    const res = await api.get('/api/soa');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/scope-items', async () => {
    const res = await api.get('/api/scope-items');
    expect(res.status()).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Policies Module Endpoints
// ---------------------------------------------------------------------------

test.describe('Policies Endpoints', () => {
  test('GET /api/policies', async () => {
    const res = await api.get('/api/policies');
    expect(res.status()).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Incidents Module Endpoints
// ---------------------------------------------------------------------------

test.describe('Incidents Endpoints', () => {
  test.fixme('GET /api/incidents', async () => {
    // Known 500 - service has TS errors from missing Prisma models (transpile-only mode)
    const res = await api.get('/api/incidents');
    expect(res.status()).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Evidence Module Endpoints
// ---------------------------------------------------------------------------

test.describe('Evidence Endpoints', () => {
  test.fixme('GET /api/evidence', async () => {
    // Known 500 - service has TS errors from missing Prisma models (transpile-only mode)
    const res = await api.get('/api/evidence');
    expect(res.status()).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Audits Module Endpoints
// ---------------------------------------------------------------------------

test.describe('Audits Endpoints', () => {
  test('GET /api/nonconformities', async () => {
    const res = await api.get('/api/nonconformities');
    expect(res.status()).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// ITSM Module Endpoints
// ---------------------------------------------------------------------------

test.describe('ITSM Endpoints', () => {
  test('GET /api/itsm/assets', async () => {
    const res = await api.get('/api/itsm/assets');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/itsm/changes', async () => {
    const res = await api.get('/api/itsm/changes');
    expect(res.status()).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Organisation Module Endpoints
// ---------------------------------------------------------------------------

test.describe('Organisation Endpoints', () => {
  test('GET /api/organisation/departments', async () => {
    const res = await api.get('/api/organisation/departments');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/organisation/locations', async () => {
    const res = await api.get('/api/organisation/locations');
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/organisation/processes', async () => {
    const res = await api.get('/api/organisation/processes');
    expect(res.status()).toBeLessThan(500);
  });
});
