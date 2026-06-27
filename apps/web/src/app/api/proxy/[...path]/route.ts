import { NextResponse } from 'next/server';
import { API_BASE } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

/**
 * Authenticated BFF proxy. Client components call `/api/proxy/<path>`; this
 * handler injects the access token from the httpOnly cookie and forwards to the
 * API, so the token is never exposed to client JS.
 */
async function forward(req: Request, path: string[]): Promise<NextResponse> {
  const token = await getAccessToken();
  const url = `${API_BASE}/api/v1/${path.join('/')}${new URL(req.url).search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  };
  if (!['GET', 'HEAD'].includes(req.method)) init.body = await req.text();

  const res = await fetch(url, init);
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function POST(req: Request, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function PATCH(req: Request, { params }: Ctx) {
  return forward(req, (await params).path);
}
export async function DELETE(req: Request, { params }: Ctx) {
  return forward(req, (await params).path);
}
