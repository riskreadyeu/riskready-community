import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the api module
vi.mock('@/lib/api', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

import { getMe, login as loginRequest, logout as logoutRequest } from '@/lib/api';

const mockGetMe = vi.mocked(getMe);
const mockLogin = vi.mocked(loginRequest);
const mockLogout = vi.mocked(logoutRequest);

// Mock fetch for the organisation lookup
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="email">{auth.user?.email ?? 'none'}</span>
      <span data-testid="orgId">{auth.organisationId || 'none'}</span>
      <button data-testid="login" onClick={() => auth.login('test@test.com', 'pass')}>Login</button>
      <button data-testid="logout" onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

describe('AuthContext', () => {
  it('throws when useAuth is used outside of AuthProvider', () => {
    // Suppress console.error from React for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider',
    );
    spy.mockRestore();
  });

  it('shows loading state initially, then resolves to unauthenticated on getMe failure', async () => {
    mockGetMe.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Eventually it should stop loading and be unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('email').textContent).toBe('none');
  });

  it('authenticates when getMe returns a user', async () => {
    mockGetMe.mockResolvedValue({
      user: { id: 'u1', email: 'admin@test.com' },
    });
    // Mock the organisation fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'org-1' }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    expect(screen.getByTestId('email').textContent).toBe('admin@test.com');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('preserves organisationId from getMe response', async () => {
    mockGetMe.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', organisationId: 'org-from-me' },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('orgId').textContent).toBe('org-from-me');
    });
  });

  it('login flow calls loginRequest then refreshes user', async () => {
    // Initial: not authenticated
    mockGetMe
      .mockRejectedValueOnce(new Error('Unauthorized'))
      .mockResolvedValueOnce({
        user: { id: 'u1', email: 'test@test.com', organisationId: 'org-1' },
      });

    mockLogin.mockResolvedValue({
      user: { id: 'u1', email: 'test@test.com' },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');

    // Click login
    await act(async () => {
      screen.getByTestId('login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'pass');
    expect(screen.getByTestId('email').textContent).toBe('test@test.com');
  });

  it('logout clears user state', async () => {
    mockGetMe.mockResolvedValue({
      user: { id: 'u1', email: 'admin@test.com', organisationId: 'org-1' },
    });
    mockLogout.mockResolvedValue({ ok: true as const });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Click logout
    await act(async () => {
      screen.getByTestId('logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    expect(screen.getByTestId('email').textContent).toBe('none');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
  });

  it('falls back to localStorage when getMe fails', async () => {
    mockGetMe.mockRejectedValue(new Error('Unauthorized'));
    localStorageMock.setItem(
      'auth_user',
      JSON.stringify({ id: 'u1', email: 'cached@test.com', organisationId: 'org-cached' }),
    );

    // Organisation lookup for the cached user
    mockFetch.mockResolvedValue({
      ok: false,
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Should restore from localStorage
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe('cached@test.com');
  });
});
