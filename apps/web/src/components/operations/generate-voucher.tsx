'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus2 } from 'lucide-react';
import { clientFetch } from '@/lib/client';
import { Button } from '@/components/ui/button';

const TYPES = ['customer', 'hotel', 'transport', 'vendor'] as const;

export function GenerateVoucher({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [type, setType] = useState<(typeof TYPES)[number]>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await clientFetch(`/api/proxy/bookings/${bookingId}/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('failed');
      router.refresh();
    } catch {
      setError('Could not generate voucher.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm capitalize"
      >
        {TYPES.map((t) => (
          <option key={t} value={t} className="capitalize">
            {t}
          </option>
        ))}
      </select>
      <Button onClick={generate} disabled={loading} className="gap-1.5">
        <FilePlus2 className="h-4 w-4" />
        {loading ? 'Generating…' : 'Generate voucher'}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
