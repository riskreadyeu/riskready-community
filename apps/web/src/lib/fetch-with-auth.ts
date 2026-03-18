/**
 * Shared fetch wrapper that redirects to /login on 401 Unauthorized.
 * All API modules should use this instead of raw fetch().
 */
export async function fetchWithAuth(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    // Don't redirect for auth check endpoints (expected to return 401 when not logged in)
    // Don't redirect if already on login page
    const isAuthCheck = path.includes('/auth/me');
    const isLoginPage = window.location.pathname.startsWith('/login');
    if (!isAuthCheck && !isLoginPage) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  return res;
}
