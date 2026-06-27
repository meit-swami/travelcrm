'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function post(path: string, body?: unknown) {
  const res = await fetch(`/api/proxy/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error((await res.json())?.detail ?? 'Action failed');
  return res.json();
}

export function LeadActions({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const run = (label: string, fn: () => Promise<unknown>) => async () => {
    setBusy(label);
    setMsg(null);
    try {
      await fn();
      start(() => router.refresh());
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!!busy} onClick={run('score', () => post(`ai/leads/${leadId}/score`))}>
          {busy === 'score' ? '…' : '🤖 AI Score'}
        </Button>
        <Button size="sm" variant="outline" disabled={!!busy} onClick={run('summary', () => post(`ai/leads/${leadId}/summarize`))}>
          {busy === 'summary' ? '…' : '🤖 Summarize'}
        </Button>
        <Button size="sm" variant="outline" disabled={!!busy} onClick={run('extract', () => post(`ai/leads/${leadId}/extract`))}>
          {busy === 'extract' ? '…' : '🤖 Extract'}
        </Button>
        <Link href={`/leads/${leadId}/quotations/new`}><Button size="sm">+ Quotation</Button></Link>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!note.trim()) return;
          run('note', async () => {
            await post(`leads/${leadId}/notes`, { body: note });
            setNote('');
          })();
        }}
      >
        <input
          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button size="sm" variant="outline" type="submit" disabled={pending || !note.trim()}>Add</Button>
      </form>
      {msg && <p className="text-xs text-destructive">{msg}</p>}
    </div>
  );
}
