import { redirect } from 'next/navigation';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportCsv } from '@/components/export-csv';

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  quotation_sent: 'Quotation Sent',
  negotiation: 'Negotiation',
  follow_up: 'Follow Up',
  confirmed: 'Confirmed',
  lost: 'Lost',
  cancelled: 'Cancelled',
};
const STAGE_ORDER = Object.keys(STAGE_LABELS);
const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default async function ReportsPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const [funnel, conversion, sources, employees, revByDest, revByMonth] = await Promise.all([
    api.reportFunnel(token).catch(() => []),
    api.reportConversion(token).catch(() => null),
    api.reportSources(token).catch(() => []),
    api.reportEmployees(token).catch(() => []),
    api.reportRevenue(token, 'destination').catch(() => []),
    api.reportRevenue(token, 'month').catch(() => []),
  ]);

  const funnelSorted = [...funnel].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
  );
  const funnelMax = Math.max(1, ...funnelSorted.map((f) => f.count));
  const destMax = Math.max(1, ...revByDest.map((r) => r.revenue));

  return (
    <div className="space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reports &amp; Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pipeline, conversion, sources, team performance and revenue.
        </p>
      </header>

      {/* Conversion KPIs */}
      {conversion && (
        <div className="grid gap-4 sm:grid-cols-4">
          <KpiCard label="Total Leads" value={conversion.total} />
          <KpiCard label="Won" value={conversion.won} tint="text-emerald-600" />
          <KpiCard label="Lost" value={conversion.lost} tint="text-rose-600" />
          <KpiCard label="Conversion Rate" value={`${conversion.conversionRate}%`} tint="text-primary" />
        </div>
      )}

      {/* Lead funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {funnelSorted.length === 0 && <Empty />}
          {funnelSorted.map((f) => (
            <BarRow
              key={f.stage}
              label={STAGE_LABELS[f.stage] ?? f.stage}
              value={String(f.count)}
              pct={(f.count / funnelMax) * 100}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source performance */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Source performance</CardTitle>
            <ExportCsv
              rows={sources}
              columns={[
                { key: 'source', label: 'Source' },
                { key: 'total', label: 'Total' },
                { key: 'won', label: 'Won' },
              ]}
              filename="source-performance.csv"
            />
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <Empty />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                    <th className="pb-2 text-right font-medium">Won</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.source} className="border-t border-border">
                      <td className="py-2">{s.source}</td>
                      <td className="py-2 text-right">{s.total}</td>
                      <td className="py-2 text-right font-medium text-emerald-600">{s.won}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Employee performance */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Team performance</CardTitle>
            <ExportCsv
              rows={employees}
              columns={[
                { key: 'user', label: 'User' },
                { key: 'handled', label: 'Handled' },
                { key: 'won', label: 'Won' },
                { key: 'conversionRate', label: 'Conversion %' },
              ]}
              filename="team-performance.csv"
            />
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <Empty />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="pb-2 font-medium">Member</th>
                    <th className="pb-2 text-right font-medium">Handled</th>
                    <th className="pb-2 text-right font-medium">Won</th>
                    <th className="pb-2 text-right font-medium">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.user} className="border-t border-border">
                      <td className="py-2">{e.user}</td>
                      <td className="py-2 text-right">{e.handled}</td>
                      <td className="py-2 text-right">{e.won}</td>
                      <td className="py-2 text-right font-medium text-primary">{e.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by destination */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Revenue by destination</CardTitle>
          <ExportCsv
            rows={revByDest}
            columns={[
              { key: 'key', label: 'Destination' },
              { key: 'revenue', label: 'Revenue' },
            ]}
            filename="revenue-by-destination.csv"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {revByDest.length === 0 && <Empty />}
          {revByDest.map((r) => (
            <BarRow key={r.key} label={r.key} value={inr(r.revenue)} pct={(r.revenue / destMax) * 100} />
          ))}
          {revByMonth.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">By month</div>
              <div className="flex flex-wrap gap-3 text-sm">
                {revByMonth.map((m) => (
                  <span key={m.key} className="rounded-md bg-muted px-3 py-1">
                    {m.key}: <b>{inr(m.revenue)}</b>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, tint }: { label: string; value: number | string; tint?: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold ${tint ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function BarRow({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 flex-shrink-0 truncate text-sm">{label}</div>
      <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
        <div className="theme-gradient h-full rounded" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <div className="w-24 flex-shrink-0 text-right text-sm font-medium">{value}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">No data yet.</p>;
}
