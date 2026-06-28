import { requirePortalToken } from '@/lib/portal-session';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const fmt = (a: string, c = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(Number(a));

export default async function PortalQuotations() {
  const token = await requirePortalToken();
  const quotes = await api.portalQuotations(token).catch(() => []);

  return (
    <div className="space-y-4 p-5">
      <h1 className="text-xl font-semibold">Your quotations</h1>
      {quotes.length === 0 && <p className="text-sm text-muted-foreground">No quotations shared yet.</p>}
      {quotes.map((q) => (
        <Card key={q.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <div className="font-medium">{q.title}</div>
              <div className="font-mono text-xs text-muted-foreground">{q.referenceCode}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{fmt(q.totalAmount, q.currency)}</div>
              <div className="text-xs capitalize text-muted-foreground">{q.status}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
