import { redirect } from 'next/navigation';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const META: Record<string, { title: string; desc: string }> = {
  ai: { title: 'AI (OpenAI / Gemini)', desc: 'Chat summaries, lead scoring, management insights' },
  payments: { title: 'Payments (Razorpay / Cashfree)', desc: 'Online payment collection & webhooks' },
  whatsapp: { title: 'WhatsApp Business', desc: 'Two-way WhatsApp inbox via Cloud API' },
  email: { title: 'Email (SMTP)', desc: 'Transactional email & automations' },
  itinerary: { title: 'Itinerary Builder', desc: 'External itinerary generation' },
};

export default async function IntegrationsPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  const status = await api.integrationsStatus(token).catch(() => null);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each integration runs on a built-in stub until you add real credentials to the server&apos;s
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">infra/docker/.env</code> and redeploy.
        </p>
      </div>

      {!status && <p className="text-sm text-destructive">Could not load integration status.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {status &&
          Object.entries(status).map(([key, info]) => {
            const meta = META[key] ?? { title: key, desc: '' };
            return (
              <Card key={key}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{meta.title}</div>
                      <div className="text-sm text-muted-foreground">{meta.desc}</div>
                    </div>
                    {info.configured ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <CircleDashed className="h-3.5 w-3.5" /> Stub
                      </span>
                    )}
                  </div>
                  {info.provider && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Active provider: <b>{info.provider}</b>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {info.envKeys.map((k) => (
                      <code key={k} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {k}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
