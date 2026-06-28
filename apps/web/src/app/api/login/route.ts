import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/api';
import { ACCESS_COOKIE, COOKIE_SECURE, REFRESH_COOKIE } from '@/lib/session';

/**
 * Same-origin staff login. The browser posts credentials here; this handler
 * calls the API server-side, then stores tokens in httpOnly cookies. Keeps the
 * API URL and tokens off the client entirely.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.text();
  const apiRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const data = await apiRes.json().catch(() => ({}));
  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const { accessToken, refreshToken, user } = data as {
    accessToken: string;
    refreshToken: string;
    user: unknown;
  };
  const res = NextResponse.json({ ok: true, user });
  const base = { httpOnly: true, secure: COOKIE_SECURE, sameSite: 'lax' as const, path: '/' };
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...base, maxAge: 60 * 15 });
  res.cookies.set(REFRESH_COOKIE, refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  return res;
}
