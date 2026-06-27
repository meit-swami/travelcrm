import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/session';

const isProd = process.env.NODE_ENV === 'production';

/** Persist tokens in httpOnly cookies after a successful login. */
export async function POST(req: Request): Promise<NextResponse> {
  const { accessToken, refreshToken } = (await req.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...base, maxAge: 60 * 15 });
  res.cookies.set(REFRESH_COOKIE, refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  return res;
}

/** Clear the session (logout). */
export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
