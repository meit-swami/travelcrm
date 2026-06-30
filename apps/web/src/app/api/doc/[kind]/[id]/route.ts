import { API_BASE } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

// Streams a generated document (PDF or HTML) from the API to the browser, so the
// browser never needs to reach internal object storage. kind ∈ voucher | quotation | invoice.
const ENDPOINT: Record<string, (id: string) => string> = {
  voucher: (id) => `vouchers/${id}/file`,
  quotation: (id) => `quotations/${id}/document`,
  invoice: (id) => `invoices/${id}/document`,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
): Promise<Response> {
  const { kind, id } = await params;
  const build = ENDPOINT[kind];
  if (!build) return new Response('Unknown document type', { status: 404 });

  const token = await getAccessToken();
  if (!token) return new Response('Unauthorized', { status: 401 });

  const res = await fetch(`${API_BASE}/api/v1/${build(id)}`, {
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
