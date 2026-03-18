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
    // Only redirect if we're not already on the login page
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  return res;
}
