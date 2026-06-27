import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STAGES = [
  'New',
  'Contacted',
  'Interested',
  'Quotation Sent',
  'Negotiation',
  'Follow Up',
  'Confirmed',
];

export default async function DashboardPage() {
  const token = await getAccessToken();
  const me = token ? await api.me(token).catch(() => null) : null;

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{me ? `, ${me.fullName}` : ''}. Phase 0 foundation is live —
          lead, sales and operations modules land in the next phases.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Open Leads', value: '—' },
          { label: 'Quotations Sent', value: '—' },
          { label: 'Confirmed Trips', value: '—' },
          { label: 'Revenue (MTD)', value: '—' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Lead pipeline</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {STAGES.map((stage) => (
            <Card key={stage} className="min-h-24">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{stage}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">0</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

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
