import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/api';
import { getPortalToken } from '@/lib/portal-session';

/**
 * Resolves a portal voucher download: reads the portal token (httpOnly cookie),
 * asks the API for a time-limited signed URL, and redirects the customer to it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const token = await getPortalToken();
  if (!token) return NextResponse.redirect(new URL('/portal/login', _req.url));
  const { id } = await params;

  const res = await fetch(`${API_BASE}/api/v1/portal/vouchers/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return NextResponse.json({ error: 'Not available' }, { status: res.status });
  const { url } = (await res.json()) as { url: string };
  return NextResponse.redirect(url);
}
