import Link from 'next/link';
import { requirePortalToken } from '@/lib/portal-session';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

export default async function PortalHome() {
  const token = await requirePortalToken();
  const me = await api.portalMe(token).catch(() => null);

  return (
    <div className="space-y-5 p-5">
      <div>
        <h1 className="text-xl font-semibold">Hi {me?.lead?.name ?? 'there'} 👋</h1>
        {me?.lead && (
          <p className="text-sm text-muted-foreground">
            {me.lead.destination ?? 'Your trip'}
            {me.lead.travelDate ? ` · ${me.lead.travelDate.slice(0, 10)}` : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile href="/portal/quotations" label="Quotations" emoji="📄" />
        <Tile href="/portal/itinerary" label="Itinerary" emoji="🗺️" />
        <Tile href="/portal/invoices" label="Invoices" emoji="🧾" />
        <Tile href="/portal/vouchers" label="Vouchers" emoji="🎫" />
      </div>
    </div>
  );
}

function Tile({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="flex flex-col items-center gap-2 py-6">
          <span className="text-2xl">{emoji}</span>
          <span className="text-sm font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
