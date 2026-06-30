import Link from 'next/link';
import { LayoutGrid, Briefcase } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api, STAGE_LABELS } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import { ImportLeads } from '@/components/leads/import-leads';

const STAGE_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-indigo-100 text-indigo-700',
  interested: 'bg-violet-100 text-violet-700',
  quotation_sent: 'bg-amber-100 text-amber-700',
  negotiation: 'bg-orange-100 text-orange-700',
  follow_up: 'bg-cyan-100 text-cyan-700',
  confirmed: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default async function LeadsPage() {
  const token = await getAccessToken();
  const result = token ? await api.listLeads(token, { limit: '100' }).catch(() => null) : null;
  const leads = result?.data ?? [];

  const open = leads.filter((l) => !['lost', 'cancelled', 'confirmed'].includes(l.stage)).length;
  const confirmed = leads.filter((l) => l.stage === 'confirmed').length;
  const hot = leads.filter((l) => l.priority === 'hot').length;

  return (
    <div className="p-8">
      <PageHeader icon={Briefcase} title="Leads" subtitle={`${leads.length} lead(s) in your pipeline`}>
        <ImportLeads />
        <Link href="/leads/board"><Button variant="outline" className="gap-1.5"><LayoutGrid className="h-4 w-4" /> Board</Button></Link>
        <Link href="/leads/new"><Button>+ New Lead</Button></Link>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={leads.length} />
        <Stat label="Open" value={open} tint="text-blue-600" />
        <Stat label="Confirmed" value={confirmed} tint="text-emerald-600" />
        <Stat label="Hot" value={hot} tint="text-rose-600" />
      </div>

      <Card className="overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No leads yet. Use <b>Import</b> to bring in a CSV, or <b>+ New Lead</b>.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-0 transition-colors hover:bg-primary/5">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/leads/${lead.id}`} className="text-primary hover:underline">{lead.referenceCode}</Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-xs text-muted-foreground">{lead.phone ?? '—'}</div>
                </td>
                <td className="px-4 py-3">{lead.destination ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLES[lead.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STAGE_LABELS[lead.stage] ?? lead.stage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {lead.assignedUser ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={lead.assignedUser.fullName} />
                      <span className="truncate">{lead.assignedUser.fullName}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{lead.source?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <Card className="shadow-sm">
      <div className="px-4 py-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold ${tint ?? ''}`}>{value}</div>
      </div>
    </Card>
  );
}
