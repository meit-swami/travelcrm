/**
 * Minimal typed API client for the TravelOS API. The browser talks to the API
 * directly (CORS-enabled); the access token is read from the httpOnly session
 * cookie on the server and passed explicitly where needed.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ProblemDetails {
  title: string;
  status: number;
  code: string;
  detail?: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; fullName: string; tenantId: string; roles: string[] };
}

async function request<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (init?.token) headers.set('Authorization', `Bearer ${init.token}`);

  const res = await fetch(`${API_BASE}/api/v1${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    let problem: ProblemDetails;
    try {
      problem = (await res.json()) as ProblemDetails;
    } catch {
      problem = { title: res.statusText, status: res.status, code: 'ERROR' };
    }
    throw new ApiError(problem);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  login: (body: { tenantSlug: string; email: string; password: string; totp?: string }) =>
    request<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: (token: string) =>
    request<{
      id: string;
      email: string;
      fullName: string;
      roles: string[];
      permissions: string[];
    }>('/auth/me', { token }),

  logout: (refreshToken: string) =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};
