import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const PORTAL_COOKIE = 'travelos_portal';

/** Read the portal access token (server components only). */
export async function getPortalToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(PORTAL_COOKIE)?.value;
}

/** Require a portal session or redirect to the portal login. */
export async function requirePortalToken(): Promise<string> {
  const token = await getPortalToken();
  if (!token) redirect('/portal/login');
  return token;
}
