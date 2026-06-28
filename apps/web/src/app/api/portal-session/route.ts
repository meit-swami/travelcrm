import { NextResponse } from 'next/server';
import { PORTAL_COOKIE } from '@/lib/portal-session';
import { COOKIE_SECURE } from '@/lib/session';

/** Persist the portal access token in an httpOnly cookie after OTP verify. */
export async function POST(req: Request): Promise<NextResponse> {
  const { accessToken } = (await req.json()) as { accessToken?: string };
  if (!accessToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE, accessToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // portal access token TTL
  });
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PORTAL_COOKIE);
  return res;
}
