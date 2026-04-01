import { fetchWithAuth } from './fetch-with-auth';

type User = { id: string; email: string; organisationId?: string };

type MeResponse = { user: User };

type LoginResponse = { user: User };

export function getApiErrorMessage(text: string, fallback: string): string {
  const trimmed = text.trim();

  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      message?: string;
      error?: string;
      details?: { message?: string };
    };

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }

    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }

    if (typeof parsed.details?.message === "string" && parsed.details.message.trim()) {
      return parsed.details.message;
    }
  } catch {
    // Fallback to the raw response text when the payload is not JSON.
  }

  return trimmed;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(path, init);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(getApiErrorMessage(text, `Request failed (${res.status})`));
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await res.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response from ${path}`);
  }
}

// Request without content-type for FormData
async function requestFormData<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
  });

  if (res.status === 401) {
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(getApiErrorMessage(text, `Request failed (${res.status})`));
  }

  const text = await res.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response`);
  }
}

// Generic API client for reuse across modules
export const api = {
  baseUrl: '/api',
  get: <T>(path: string) => request<T>(`/api${path}`),
  post: <T>(path: string, data?: unknown) =>
    request<T>(`/api${path}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(`/api${path}`, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T = void>(path: string) =>
    request<T>(`/api${path}`, { method: 'DELETE' }),
  postForm: <T>(path: string, formData: FormData) =>
    requestFormData<T>(`/api${path}`, {
      method: 'POST',
      body: formData,
    }),
};

export async function login(email: string, password: string) {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return request<MeResponse>('/api/auth/me');
}

export async function logout() {
  return request<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
  });
}
