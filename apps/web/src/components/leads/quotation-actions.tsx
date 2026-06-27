'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

async function post(path: string) {
  const res = await fetch(`/api/proxy/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error((await res.json())?.detail ?? 'Action failed');
  return res.json();
}

export function QuotationActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const run = (label: string, path: string) => async () => {
    setBusy(label);
    try {
      await post(path);
      start(() => router.refresh());
    } finally {
      setBusy(null);
    }
  };

  if (status === 'accepted') return <span className="text-xs font-medium text-green-700">Accepted</span>;
  if (status === 'rejected' || status === 'expired') return null;

  return (
    <div className="flex gap-1">
      {status === 'draft' && (
        <Button size="sm" variant="outline" disabled={!!busy} onClick={run('send', `quotations/${id}/send`)}>
          {busy === 'send' ? '…' : 'Send'}
        </Button>
      )}
      {(status === 'sent' || status === 'viewed') && (
        <Button size="sm" disabled={!!busy} onClick={run('accept', `quotations/${id}/accept`)}>
          {busy === 'accept' ? '…' : 'Accept'}
        </Button>
      )}
    </div>
  );
}
