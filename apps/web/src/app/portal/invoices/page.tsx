import { requirePortalToken } from '@/lib/portal-session';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const fmt = (a: string, c = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(Number(a));

export default async function PortalInvoices() {
  const token = await requirePortalToken();
  const [invoices, payments] = await Promise.all([
    api.portalInvoices(token).catch(() => []),
    api.portalPayments(token).catch(() => []),
  ]);

  return (
    <div className="space-y-5 p-5">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold">Invoices</h1>
        {invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
        {invoices.map((inv) => (
          <Card key={inv.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{inv.invoiceNo}</span>
                <span className="text-xs capitalize text-muted-foreground">{inv.status.replace('_', ' ')}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paid {fmt(inv.amountPaid, inv.currency)} of</span>
                <span className="font-semibold">{fmt(inv.total, inv.currency)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Payments</h2>
        {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments recorded.</p>}
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
            <span className="capitalize">{p.type} · <span className="text-muted-foreground">{p.status}</span></span>
            <span className="font-semibold">{fmt(p.amount, p.currency)}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
