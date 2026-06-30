import Link from 'next/link';
import { LayoutList } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api, STAGE_LABELS } from '@/lib/api';
import { Button } from '@/components/ui/button';

const COLUMNS = [
  'new',
  'contacted',
  'interested',
  'quotation_sent',
  'negotiation',
  'follow_up',
  'confirmed',
] as const;

const COLUMN_ACCENT: Record<string, string> = {
  new: 'border-t-blue-400',
  contacted: 'border-t-indigo-400',
  interested: 'border-t-violet-400',
  quotation_sent: 'border-t-amber-400',
  negotiation: 'border-t-orange-400',
  follow_up: 'border-t-cyan-400',
  confirmed: 'border-t-emerald-400',
};

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-300',
  medium: 'bg-blue-400',
  high: 'bg-amber-500',
  hot: 'bg-rose-500',
};

export default async function LeadsBoardPage() {
  const token = await getAccessToken();
  const result = token ? await api.listLeads(token, { limit: '100' }).catch(() => null) : null;
  const leads = result?.data ?? [];

  const byStage = new Map<string, typeof leads>();
  for (const stage of COLUMNS) byStage.set(stage, []);
  for (const lead of leads) {
    if (byStage.has(lead.stage)) byStage.get(lead.stage)!.push(lead);
  }

  return (
    <div className="flex h-screen flex-col p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads board</h1>
          <p className="text-sm text-muted-foreground">{leads.length} lead(s) across the pipeline</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads">
            <Button variant="outline" className="gap-1.5">
              <LayoutList className="h-4 w-4" /> List view
            </Button>
          </Link>
          <Link href="/leads/new">
            <Button>+ New Lead</Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((stage) => {
          const items = byStage.get(stage) ?? [];
          return (
            <div key={stage} className="flex w-72 flex-shrink-0 flex-col">
              <div
                className={`mb-2 flex items-center justify-between rounded-t-lg border-t-4 bg-card px-3 py-2 ${
                  COLUMN_ACCENT[stage] ?? 'border-t-slate-300'
                }`}
              >
                <span className="text-sm font-semibold">{STAGE_LABELS[stage] ?? stage}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-muted/30 p-2">
                {items.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">No leads</div>
                )}
                {items.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="block rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium leading-tight">{lead.name}</span>
                      <span
                        className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[lead.priority] ?? 'bg-slate-300'}`}
                        title={`Priority: ${lead.priority}`}
                      />
                    </div>
                    {lead.destination && (
                      <div className="mt-1 text-xs text-muted-foreground">📍 {lead.destination}</div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{lead.referenceCode}</span>
                      <span className="truncate">{lead.assignedUser?.fullName ?? 'Unassigned'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
