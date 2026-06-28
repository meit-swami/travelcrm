import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'travelos_access';
export const REFRESH_COOKIE = 'travelos_refresh';

/**
 * Whether session cookies are marked Secure. Defaults to true in production,
 * but can be forced off (COOKIE_SECURE=false) for HTTP-only testing. Use HTTPS
 * in real deployments — Secure cookies are dropped by browsers over plain HTTP.
 */
export const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : process.env.NODE_ENV === 'production';

/** Read the access token from the httpOnly cookie (server components only). */
export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}
