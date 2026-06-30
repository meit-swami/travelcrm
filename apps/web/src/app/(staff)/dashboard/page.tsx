import { Briefcase, FileText, CheckCircle2, IndianRupee } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STAGES: { label: string; key: string }[] = [
  { label: 'New', key: 'new' },
  { label: 'Contacted', key: 'contacted' },
  { label: 'Interested', key: 'interested' },
  { label: 'Quotation Sent', key: 'quotation_sent' },
  { label: 'Negotiation', key: 'negotiation' },
  { label: 'Follow Up', key: 'follow_up' },
  { label: 'Confirmed', key: 'confirmed' },
];

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default async function DashboardPage() {
  const token = await getAccessToken();
  const [me, data] = await Promise.all([
    token ? api.me(token).catch(() => null) : Promise.resolve(null),
    token ? api.dashboard(token).catch(() => null) : Promise.resolve(null),
  ]);

  const funnel = new Map((data?.funnel ?? []).map((f) => [f.stage, f.count]));
  const k = data?.kpis;

  const KPIS = [
    { label: 'Open Leads', value: k ? String(k.openLeads) : '—', icon: Briefcase, tint: 'text-blue-600 bg-blue-50' },
    { label: 'Quotations Sent', value: k ? String(k.quotationsSent) : '—', icon: FileText, tint: 'text-violet-600 bg-violet-50' },
    { label: 'Confirmed Trips', value: k ? String(k.confirmedTrips) : '—', icon: CheckCircle2, tint: 'text-emerald-600 bg-emerald-50' },
    { label: 'Revenue (MTD)', value: k ? inr(k.revenueMtd) : '—', icon: IndianRupee, tint: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{me ? `, ${me.fullName}` : ''}. Here&apos;s your pipeline at a glance.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map(({ label, value, icon: Icon, tint }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="text-2xl font-semibold">{value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Lead pipeline</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {STAGES.map(({ label, key }) => {
            const count = funnel.get(key) ?? 0;
            return (
              <Card key={key} className="min-h-24">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-semibold ${count > 0 ? 'text-primary' : ''}`}>{count}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {data && (
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-8 py-2 text-sm">
              <Stat label="Total" value={data.conversion.total} />
              <Stat label="Won" value={data.conversion.won} />
              <Stat label="Lost" value={data.conversion.lost} />
              <Stat label="Rate" value={`${data.conversion.conversionRate}%`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top destinations (by booking value)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 py-2">
              {data.topDestinations.length === 0 && (
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
              )}
              {data.topDestinations.map((d) => (
                <div key={d.key} className="flex justify-between text-sm">
                  <span>{d.key}</span>
                  <span className="font-medium">{inr(d.revenue)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {me && (
        <section className="mt-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Roles: {me.roles.join(', ') || '—'}</p>
              <p className="text-sm text-muted-foreground">
                {me.permissions.includes('*')
                  ? 'Full administrative access'
                  : `${me.permissions.length} permissions`}
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
