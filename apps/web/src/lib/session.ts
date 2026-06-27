import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'travelos_access';
export const REFRESH_COOKIE = 'travelos_refresh';

/** Read the access token from the httpOnly cookie (server components only). */
export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}
