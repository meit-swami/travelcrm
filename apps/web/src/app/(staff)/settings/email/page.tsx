import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function EmailSettingsPage() {
  const token = await getAccessToken();
  const [templates, logs] = token
    ? await Promise.all([api.listEmailTemplates(token).catch(() => []), api.listEmailLogs(token).catch(() => [])])
    : [[], []];

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Email & Automation</h1>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Templates ({templates.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {templates.length === 0 && <p className="text-sm text-muted-foreground">No templates.</p>}
          {templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div>
                <span className="font-mono text-xs text-muted-foreground">{t.key}</span>
                <div className="font-medium">{t.subject}</div>
              </div>
              <span className={`text-xs ${t.isActive ? 'text-green-700' : 'text-muted-foreground'}`}>
                {t.isActive ? 'active' : 'inactive'}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recent deliveries ({logs.length})</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {logs.length === 0 && <p className="text-sm text-muted-foreground">No emails sent yet.</p>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{l.subject} → {l.toEmail}</span>
              <span className={`text-xs ${l.status === 'sent' ? 'text-green-700' : l.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}>
                {l.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
