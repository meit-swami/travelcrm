import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';

const ACTION_STYLES: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  deleted: 'bg-red-100 text-red-700',
  login: 'bg-gray-100 text-gray-600',
  status_changed: 'bg-amber-100 text-amber-700',
  payment_updated: 'bg-violet-100 text-violet-700',
  quotation_updated: 'bg-cyan-100 text-cyan-700',
  assigned: 'bg-indigo-100 text-indigo-700',
};

export default async function AuditPage() {
  const token = await getAccessToken();
  const entries = token ? await api.listAudit(token).catch(() => []) : [];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Most recent {entries.length} action(s)</p>
      </header>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Resource</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No audit entries.</td></tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[e.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {e.action.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{e.resourceType}</td>
                <td className="px-4 py-3">{e.actor?.fullName ?? e.actorType}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
