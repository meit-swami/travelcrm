import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAccessToken } from '@/lib/session';
import { api, STAGE_LABELS } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadActions } from '@/components/leads/lead-actions';
import { QuotationActions } from '@/components/leads/quotation-actions';

const fmtMoney = (amt: string | null, cur = 'INR') =>
  amt == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number(amt));

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAccessToken();
  if (!token) notFound();

  const [lead, timeline, quotations, notes] = await Promise.all([
    api.getLead(token, id).catch(() => null),
    api.leadTimeline(token, id).catch(() => []),
    api.leadQuotations(token, id).catch(() => []),
    api.leadNotes(token, id).catch(() => []),
  ]);
  if (!lead) notFound();

  return (
    <div className="p-8">
      <Link href="/leads" className="text-sm text-muted-foreground hover:underline">← Leads</Link>

      <header className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {STAGE_LABELS[lead.stage] ?? lead.stage}
            </span>
            {lead.priority === 'hot' && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">🔥 Hot</span>
            )}
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{lead.referenceCode}</p>
        </div>
        {lead.score != null && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">AI conversion score</div>
            <div className="text-3xl font-semibold">{lead.score}</div>
          </div>
        )}
      </header>

      <Card className="mb-6">
        <CardContent className="pt-6"><LeadActions leadId={lead.id} /></CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Phone" value={lead.phone} />
              <Row label="Email" value={lead.email} />
              <Row label="Destination" value={lead.destination} />
              <Row label="Travel date" value={lead.travelDate?.slice(0, 10) ?? null} />
              <Row label="Pax" value={`${lead.adults} adults, ${lead.children} children`} />
              <Row label="Budget" value={fmtMoney(lead.budgetAmount, lead.budgetCurrency)} />
              <Row label="Owner" value={lead.assignedUser?.fullName ?? 'Unassigned'} />
              <Row label="Source" value={lead.source?.name ?? null} />
              {lead.specialRequests && <Row label="Notes" value={lead.specialRequests} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Notes ({notes.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className="rounded-md bg-muted/40 p-3 text-sm">
                  <p>{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.author?.fullName ?? 'System'} · {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Middle: timeline */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Timeline</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-4">
              {timeline.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              {timeline.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{a.title}</p>
                  {a.body && <p className="text-xs text-muted-foreground">{a.body}</p>}
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {a.type} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Right: quotations */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Quotations ({quotations.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {quotations.length === 0 && <p className="text-sm text-muted-foreground">No quotations yet.</p>}
            {quotations.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <div>
                  <div className="font-medium">{q.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">{q.referenceCode}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{fmtMoney(q.totalAmount, q.currency)}</div>
                  <div className="text-xs text-muted-foreground capitalize">{q.status}</div>
                  <div className="mt-1 flex justify-end"><QuotationActions id={q.id} status={q.status} /></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? '—'}</span>
    </div>
  );
}
