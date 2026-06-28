import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SourcesSettingsPage() {
  const token = await getAccessToken();
  const [sources, rules] = token
    ? await Promise.all([api.listSources(token).catch(() => []), api.listRules(token).catch(() => [])])
    : [[], []];

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Lead Sources & Assignment</h1>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Sources ({sources.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {sources.length === 0 && <p className="text-sm text-muted-foreground">No sources configured.</p>}
          {sources.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div>
                <div className="font-medium">{s.name}</div>
                <span className="font-mono text-xs text-muted-foreground">{s.type}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {s.secret && <code className="rounded bg-muted px-1.5 py-0.5">secret set</code>}
                <span className={s.isActive ? 'text-green-700' : 'text-muted-foreground'}>{s.isActive ? 'active' : 'off'}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Assignment rules ({rules.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rules.length === 0 && <p className="text-sm text-muted-foreground">No assignment rules — leads stay unassigned.</p>}
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div>
                <div className="font-medium">{r.name}</div>
                <span className="font-mono text-xs text-muted-foreground">{r.strategy} · priority {r.priority}</span>
              </div>
              <span className={`text-xs ${r.isActive ? 'text-green-700' : 'text-muted-foreground'}`}>{r.isActive ? 'active' : 'off'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
