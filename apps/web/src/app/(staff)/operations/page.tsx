import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';

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

export default async function OperationsPage() {
  const token = await getAccessToken();
  const bookings = token ? await api.listBookings(token).catch(() => []) : [];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-muted-foreground">{bookings.length} confirmed booking(s) in the pipeline</p>
      </header>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No bookings yet. Accept a quotation to create one.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{b.referenceCode}</td>
                <td className="px-4 py-3 font-medium">{b.lead?.name ?? '—'}</td>
                <td className="px-4 py-3">{b.destination ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {OPS_LABELS[b.opsStage] ?? b.opsStage}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">{fmtMoney(b.totalValue, b.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
