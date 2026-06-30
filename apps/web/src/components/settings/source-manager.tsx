'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Copy, Check } from 'lucide-react';
import { clientFetch, appUrl } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Source = { id: string; type: string; name: string; isActive: boolean; secret: string | null };

const TYPES = [
  'website', 'landing_page', 'contact_form', 'facebook_ads',
  'instagram_ads', 'google_forms', 'referral', 'manual',
];

function CopyBtn({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
    >
      {done ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

export function SourceManager({ sources }: { sources: Source[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('website');
  const [requireSecret, setRequireSecret] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureUrl = (id: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}${appUrl(`/capture/${id}`)}`;

  async function create() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await clientFetch('/api/proxy/lead-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type, requireSecret }),
      });
      if (!res.ok) throw new Error('failed');
      setName('');
      router.refresh();
    } catch {
      setError('Could not create source.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-muted-foreground">Source name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Facebook Lead Ads" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm">
          <input type="checkbox" checked={requireSecret} onChange={(e) => setRequireSecret(e.target.checked)} />
          Secure with secret
        </label>
        <Button onClick={create} disabled={loading || !name.trim()} className="gap-1.5">
          <Plus className="h-4 w-4" /> {loading ? 'Adding…' : 'Add source'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* List */}
      <div className="space-y-3">
        {sources.length === 0 && <p className="text-sm text-muted-foreground">No sources configured yet.</p>}
        {sources.map((s) => (
          <div key={s.id} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">{s.type}</span>
              </div>
              <span className={`text-xs ${s.isActive ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                {s.isActive ? 'active' : 'off'}
              </span>
            </div>

            {/* Capture endpoint */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-16 text-muted-foreground">POST URL</span>
                <code className="flex-1 truncate rounded bg-muted px-2 py-1">{captureUrl(s.id)}</code>
                <CopyBtn value={captureUrl(s.id)} />
              </div>
              {s.secret && (
                <div className="flex items-center gap-2">
                  <span className="w-16 text-muted-foreground">Secret</span>
                  <code className="flex-1 truncate rounded bg-muted px-2 py-1">{s.secret}</code>
                  <CopyBtn value={s.secret} />
                </div>
              )}
              <p className="text-muted-foreground">
                Send JSON <code className="rounded bg-muted px-1">{`{ name, email, phone, destination, message }`}</code>
                {s.secret ? <> with header <code className="rounded bg-muted px-1">x-capture-secret</code></> : null}. New leads
                auto-dedupe &amp; assign.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
