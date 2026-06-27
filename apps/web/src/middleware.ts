import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/session';

/**
 * Guards the staff app: routes outside the auth/landing set require a session
 * cookie. Authoritative authorization still happens server-side in the API.
 */
const PUBLIC_PATHS = ['/login', '/verify-otp'];

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, the session API, and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/session).*)'],
};
