'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', email: '', destination: '', adults: '2', budgetAmount: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Authenticated via the server-side BFF proxy (httpOnly cookie → bearer).
      const res = await fetch('/api/proxy/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          email: form.email || undefined,
          destination: form.destination || undefined,
          adults: Number(form.adults) || 1,
          budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
        }),
      });
      if (!res.ok) throw new ApiError(await res.json());
      const lead = await res.json();
      router.push(`/leads/${lead.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail ?? err.problem.title : 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New Lead</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-base">Lead details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Name *"><Input value={form.name} onChange={set('name')} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={set('phone')} placeholder="+91…" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="Destination"><Input value={form.destination} onChange={set('destination')} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Adults"><Input type="number" value={form.adults} onChange={set('adults')} /></Field>
              <Field label="Budget (₹)"><Input type="number" value={form.budgetAmount} onChange={set('budgetAmount')} /></Field>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create lead'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
