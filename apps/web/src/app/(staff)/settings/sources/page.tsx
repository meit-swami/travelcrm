import { Target } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { SourceManager } from '@/components/settings/source-manager';

export default async function SourcesSettingsPage() {
  const token = await getAccessToken();
  const [sources, rules] = token
    ? await Promise.all([api.listSources(token).catch(() => []), api.listRules(token).catch(() => [])])
    : [[], []];

  return (
    <div className="space-y-6 p-8">
      <PageHeader
        icon={Target}
        title="Lead Sources & Assignment"
        subtitle="Connect website forms, Facebook/Zapier and more — each source gets a capture URL."
      />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Sources ({sources.length})</CardTitle></CardHeader>
        <CardContent>
          <SourceManager sources={sources} />
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
