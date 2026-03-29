import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, getApiErrorMessage, login, logout, getMe } from '../api';

// Mock fetch-with-auth to avoid the actual fetch wrapper
vi.mock('../fetch-with-auth', () => ({
  fetchWithAuth: vi.fn(),
}));

import { fetchWithAuth } from '../fetch-with-auth';

const mockFetchWithAuth = vi.mocked(fetchWithAuth);

function mockResponse(body: unknown, options: { ok?: boolean; status?: number; text?: string } = {}) {
  const { ok = true, status = 200 } = options;
  const text = options.text ?? JSON.stringify(body);
  return {
    ok,
    status,
    text: () => Promise.resolve(text),
  } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getApiErrorMessage', () => {
  it('returns fallback for empty string', () => {
    expect(getApiErrorMessage('', 'fallback')).toBe('fallback');
  });

  it('returns fallback for whitespace-only string', () => {
    expect(getApiErrorMessage('   ', 'fallback')).toBe('fallback');
  });

  it('extracts message field from JSON', () => {
    expect(getApiErrorMessage('{"message":"Bad input"}', 'fallback')).toBe('Bad input');
  });

  it('extracts error field from JSON', () => {
    expect(getApiErrorMessage('{"error":"Not found"}', 'fallback')).toBe('Not found');
  });

  it('extracts details.message from JSON', () => {
    expect(
      getApiErrorMessage('{"details":{"message":"Detailed error"}}', 'fallback'),
    ).toBe('Detailed error');
  });

  it('returns raw text when not valid JSON', () => {
    expect(getApiErrorMessage('plain error text', 'fallback')).toBe('plain error text');
  });

  it('prefers message over error', () => {
    expect(
      getApiErrorMessage('{"message":"msg","error":"err"}', 'fallback'),
    ).toBe('msg');
  });
});

describe('api.get', () => {
  it('calls fetchWithAuth with correct URL prefix', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse({ data: 1 }));

    await api.get('/risks');

    expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/risks', undefined);
  });

  it('parses JSON response', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse({ items: [1, 2] }));

    const result = await api.get<{ items: number[] }>('/items');

    expect(result).toEqual({ items: [1, 2] });
  });

  it('throws on non-ok response', async () => {
    mockFetchWithAuth.mockResolvedValue(
      mockResponse(null, { ok: false, status: 404, text: '{"message":"Not found"}' }),
    );

    await expect(api.get('/missing')).rejects.toThrow('Not found');
  });

  it('returns null for empty response body', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse(null, { text: '' }));

    const result = await api.get('/empty');

    expect(result).toBeNull();
  });

  it('throws on invalid JSON', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse(null, { text: 'not json' }));

    await expect(api.get('/bad')).rejects.toThrow('Invalid JSON response from /api/bad');
  });
});

describe('api.post', () => {
  it('sends POST with JSON body', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse({ id: '1' }));

    await api.post('/risks', { title: 'New risk' });

    expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/risks', {
      method: 'POST',
      body: JSON.stringify({ title: 'New risk' }),
    });
  });

  it('sends POST without body when data is undefined', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse({ ok: true }));

    await api.post('/action');

    expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/action', {
      method: 'POST',
      body: undefined,
    });
  });
});

describe('api.put', () => {
  it('sends PUT with JSON body', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse({ id: '1' }));

    await api.put('/risks/1', { title: 'Updated' });

    expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/risks/1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
    });
  });
});

describe('api.delete', () => {
  it('sends DELETE request', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse(null, { text: '' }));

    await api.delete('/risks/1');

    expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/risks/1', {
      method: 'DELETE',
    });
  });
});

describe('login', () => {
  it('posts credentials to /api/auth/login', async () => {
    mockFetchWithAuth.mockResolvedValue(
      mockResponse({ user: { id: '1', email: 'test@test.com' } }),
    );

    const result = await login('test@test.com', 'pass123');

    expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'pass123' }),
    });
    expect(result.user.email).toBe('test@test.com');
  });
});

describe('getMe', () => {
  it('calls /api/auth/me', async () => {
    mockFetchWithAuth.mockResolvedValue(
      mockResponse({ user: { id: '1', email: 'me@test.com' } }),
    );

    const result = await getMe();

    expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/auth/me', undefined);
    expect(result.user.email).toBe('me@test.com');
  });
});

describe('logout', () => {
  it('posts to /api/auth/logout', async () => {
    mockFetchWithAuth.mockResolvedValue(mockResponse({ ok: true }));

    await logout();

    expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    });
  });
});
