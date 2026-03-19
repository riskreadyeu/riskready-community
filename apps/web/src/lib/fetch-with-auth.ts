/**
 * Shared fetch wrapper with auth error handling.
 * All API modules should use this instead of raw fetch().
 *
 * On 401: throws Error('Unauthorized') — the app's auth context handles redirect.
 * Does NOT do window.location redirect to avoid loops.
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

  if (res.status === 401 && !path.includes('/auth/me')) {
    throw new Error('Unauthorized');
  }

  return res;
}
