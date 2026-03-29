/**
 * Read the XSRF-TOKEN cookie value for CSRF double-submit pattern.
 */
function getXsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match?.[1];
}

/**
 * Shared fetch wrapper with auth error handling.
 * All API modules should use this instead of raw fetch().
 *
 * On 401: throws Error('Unauthorized') — the app's auth context handles redirect.
 * Does NOT do window.location redirect to avoid loops.
 */
export async function fetchWithAuth(path: string, init?: RequestInit): Promise<Response> {
  const xsrfToken = getXsrfToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (res.status === 401 && !path.includes('/auth/me')) {
    throw new Error('Unauthorized');
  }

  return res;
}
