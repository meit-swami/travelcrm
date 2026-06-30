import { API_BASE } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

/**
 * Streams a voucher document (PDF/HTML) to the browser. The API reads it from
 * internal object storage and streams the bytes; we pipe them through so the
 * browser never needs to reach the storage host directly.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const res = await fetch(`${API_BASE}/api/v1/vouchers/${id}/file`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok || !res.body) {
    return new Response('Document not available', { status: res.status || 502 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/octet-stream',
      'content-disposition': res.headers.get('content-disposition') ?? 'attachment',
    },
  });
}
