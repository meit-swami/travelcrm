import Link from 'next/link';
import { getAccessToken } from '@/lib/session';
import { api, STAGE_LABELS } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const result = token ? await api.listLeads(token).catch(() => null) : null;
  const leads = result?.data ?? [];

  return (
    <div className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} lead(s) in your pipeline</p>
        </div>
        <Link href="/leads/new"><Button>+ New Lead</Button></Link>
      </header>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
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
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No leads yet. Capture some via the API, or create one manually.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/leads/${lead.id}`} className="text-primary hover:underline">
                    {lead.referenceCode}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-xs text-muted-foreground">{lead.phone ?? '—'}</div>
                </td>
                <td className="px-4 py-3">{lead.destination ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      STAGE_STYLES[lead.stage] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {STAGE_LABELS[lead.stage] ?? lead.stage}
                  </span>
                </td>
                <td className="px-4 py-3">{lead.assignedUser?.fullName ?? 'Unassigned'}</td>
                <td className="px-4 py-3 text-muted-foreground">{lead.source?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
