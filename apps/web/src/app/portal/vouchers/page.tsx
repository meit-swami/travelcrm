import { requirePortalToken } from '@/lib/portal-session';
import { api } from '@/lib/api';
import { appUrl } from '@/lib/client';
import { Card, CardContent } from '@/components/ui/card';

export default async function PortalVouchers() {
  const token = await requirePortalToken();
  const vouchers = await api.portalVouchers(token).catch(() => []);

  return (
    <div className="space-y-4 p-5">
      <h1 className="text-xl font-semibold">Your vouchers</h1>
      {vouchers.length === 0 && <p className="text-sm text-muted-foreground">No vouchers available yet.</p>}
      {vouchers.map((v) => (
        <Card key={v.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <div className="font-medium capitalize">{v.type} voucher</div>
              <div className="font-mono text-xs text-muted-foreground">{v.referenceCode}</div>
            </div>
            <a
              href={appUrl(`/api/portal-download/${v.id}`)}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted"
            >
              Download
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
