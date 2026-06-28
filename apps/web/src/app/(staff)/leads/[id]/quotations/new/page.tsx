'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { clientFetch } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Line {
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function NewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [lines, setLines] = useState<Line[]>([{ description: '', quantity: '1', unitPrice: '' }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const total = Math.max(0, subtotal + (Number(tax) || 0) - (Number(discount) || 0));

  const setLine = (i: number, k: keyof Line, v: string) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await clientFetch(`/api/proxy/leads/${id}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          tax: Number(tax) || 0,
          discount: Number(discount) || 0,
          lineItems: lines
            .filter((l) => l.description && l.unitPrice)
            .map((l) => ({ description: l.description, quantity: Number(l.quantity) || 1, unitPrice: Number(l.unitPrice) || 0 })),
        }),
      });
      if (!res.ok) throw new ApiError(await res.json());
      router.push(`/leads/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail ?? err.problem.title : 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New Quotation</h1>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-base">Line items</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input placeholder="Quotation title (e.g. Goa 4N/5D Package)" value={title} onChange={(e) => setTitle(e.target.value)} required />

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_70px_110px_40px] gap-2 text-xs font-medium text-muted-foreground">
                <span>Description</span><span>Qty</span><span>Unit ₹</span><span></span>
              </div>
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_70px_110px_40px] gap-2">
                  <Input value={l.description} onChange={(e) => setLine(i, 'description', e.target.value)} placeholder="Hotel, transport…" />
                  <Input type="number" value={l.quantity} onChange={(e) => setLine(i, 'quantity', e.target.value)} />
                  <Input type="number" value={l.unitPrice} onChange={(e) => setLine(i, 'unitPrice', e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>✕</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { description: '', quantity: '1', unitPrice: '' }])}>
                + Add line
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium">Tax ₹</label><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">Discount ₹</label><Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
              <span className="text-sm text-muted-foreground">Subtotal {subtotal.toLocaleString('en-IN')} · Total</span>
              <span className="text-xl font-semibold">₹{total.toLocaleString('en-IN')}</span>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create quotation'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
