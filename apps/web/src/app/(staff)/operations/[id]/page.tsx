import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { appUrl } from '@/lib/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerateVoucher } from '@/components/operations/generate-voucher';

const OPS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  hotel_procurement: 'Hotel Procurement',
  transport_procurement: 'Transport Procurement',
  voucher_generation: 'Voucher Generation',
  final_itinerary: 'Final Itinerary',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const fmtMoney = (amt: string, cur = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number(amt));
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAccessToken();
  const booking = token ? await api.getBooking(token, id).catch(() => null) : null;
  if (!booking) notFound();

  return (
    <div className="space-y-6 p-8">
      <Link href="/operations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Operations
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{booking.lead?.name ?? 'Booking'}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{booking.referenceCode}</span> · {booking.destination ?? '—'}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {OPS_LABELS[booking.opsStage] ?? booking.opsStage}
        </span>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Travel dates" value={`${fmtDate(booking.travelStart)} → ${fmtDate(booking.travelEnd)}`} />
        <Info label="Travellers" value={`${booking.paxAdults} adults · ${booking.paxChildren} children`} />
        <Info label="Value" value={fmtMoney(booking.totalValue, booking.currency)} />
        <Info label="Contact" value={booking.lead?.phone ?? '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ops tasks */}
        <Card>
          <CardHeader><CardTitle className="text-base">Operations checklist</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {booking.operationTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks.</p>}
            {booking.operationTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span>{t.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.status === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vouchers */}
        <Card>
          <CardHeader><CardTitle className="text-base">Vouchers</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <GenerateVoucher bookingId={booking.id} />
            <div className="divide-y divide-border">
              {booking.vouchers.length === 0 && (
                <p className="py-2 text-sm text-muted-foreground">No vouchers generated yet.</p>
              )}
              {booking.vouchers.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium capitalize">{v.type} voucher</div>
                    <div className="font-mono text-xs text-muted-foreground">{v.referenceCode}</div>
                  </div>
                  <a
                    href={appUrl(`/api/voucher-download/${v.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-medium">{value}</div>
      </CardContent>
    </Card>
  );
}
