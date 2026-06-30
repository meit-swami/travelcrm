import { Card, CardContent } from '@/components/ui/card';

// ─────────────────────────────────────────────────────────────────────────────
// Living project-status board. Update the `MODULES` data as work progresses.
// status: 'done' | 'partial' | 'planned'
// Last updated: 2026-06-30
// ─────────────────────────────────────────────────────────────────────────────

type Status = 'done' | 'partial' | 'planned';

interface Item {
  name: string;
  status: Status;
  note?: string;
}
interface Module {
  title: string;
  items: Item[];
}

const MODULES: Module[] = [
  {
    title: 'Platform & Foundation',
    items: [
      { name: 'Multi-tenant architecture (RLS isolation)', status: 'done' },
      { name: 'Auth — JWT + refresh + OTP, 2FA-ready', status: 'done' },
      { name: 'RBAC — 9 system roles, 98 permissions', status: 'done' },
      { name: 'Audit log (every action, who & when)', status: 'done' },
      { name: 'Self-contained Docker deployment', status: 'done' },
      { name: 'Theme palettes & appearance settings', status: 'done' },
    ],
  },
  {
    title: 'Leads CRM',
    items: [
      { name: 'Lead capture (manual, website, sources)', status: 'done' },
      { name: 'Pipeline stages & kanban-style board', status: 'done' },
      { name: 'Dedupe + assignment engine', status: 'done' },
      { name: 'Timeline, notes, tasks, tags', status: 'done' },
      { name: 'Lead scoring (AI-assisted)', status: 'partial', note: 'stub scoring; live model pending keys' },
    ],
  },
  {
    title: 'Sales & Quotations',
    items: [
      { name: 'Quotation builder + versioning', status: 'done' },
      { name: 'Accept / reject / expiry flow', status: 'done' },
      { name: 'Quotation → booking conversion', status: 'done' },
      { name: 'True PDF rendering', status: 'planned', note: 'HTML ready; headless-Chrome render pending' },
    ],
  },
  {
    title: 'Conversations & Engagement',
    items: [
      { name: 'WhatsApp inbox (Cloud API)', status: 'partial', note: 'flows + stubs; needs live WhatsApp token' },
      { name: 'Email templates & automation', status: 'done' },
      { name: 'AI chat summaries & reply drafts', status: 'partial', note: 'stub provider; add OpenAI/Gemini key' },
      { name: 'Telephony / call logging', status: 'partial', note: 'data model done; provider pending' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Booking handover & ops stages', status: 'done' },
      { name: 'Vendors & vendor rates', status: 'done' },
      { name: 'Hotel / transport bookings', status: 'done' },
      { name: 'Vouchers & vendor comms', status: 'done' },
      { name: 'Itinerary builder', status: 'done' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Invoices (partial / full)', status: 'done' },
      { name: 'Payments + ledger', status: 'done' },
      { name: 'Razorpay / Cashfree gateways', status: 'partial', note: 'stub gateway live; add real keys' },
    ],
  },
  {
    title: 'Customer Portal',
    items: [
      { name: 'OTP login', status: 'done' },
      { name: 'Trip, quotations, invoices, vouchers', status: 'done' },
      { name: 'Online payment from portal', status: 'partial', note: 'wired to stub gateway' },
    ],
  },
  {
    title: 'Insights & Automation',
    items: [
      { name: 'Dashboard KPIs & pipeline', status: 'done' },
      { name: 'Scheduler (reminders, expiry, SLAs)', status: 'done' },
      { name: 'Reports — charts & CSV exports', status: 'done' },
      { name: 'AI loss / win analytics', status: 'done', note: 'stub provider; add OpenAI/Gemini key for richer output' },
    ],
  },
];

const STATUS_META: Record<Status, { label: string; dot: string; text: string }> = {
  done: { label: 'Done', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  partial: { label: 'In progress', dot: 'bg-amber-500', text: 'text-amber-700' },
  planned: { label: 'Planned', dot: 'bg-slate-300', text: 'text-slate-500' },
};

export default function ProjectStatusPage() {
  const all = MODULES.flatMap((m) => m.items);
  const done = all.filter((i) => i.status === 'done').length;
  const partial = all.filter((i) => i.status === 'partial').length;
  const planned = all.filter((i) => i.status === 'planned').length;
  const pct = Math.round((done / all.length) * 100);

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Project Status</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live map of modules, sub-modules and what&apos;s remaining. Last updated 30 Jun 2026.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-3xl font-bold">{pct}%</div>
              <div className="text-xs text-muted-foreground">core scope complete</div>
            </div>
            <div className="flex gap-5 text-sm">
              <Legend dot="bg-emerald-500" label={`${done} done`} />
              <Legend dot="bg-amber-500" label={`${partial} in progress`} />
              <Legend dot="bg-slate-300" label={`${planned} planned`} />
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full theme-gradient" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="grid gap-5 lg:grid-cols-2">
        {MODULES.map((m) => (
          <Card key={m.title}>
            <CardContent className="py-5">
              <h2 className="mb-3 font-semibold">{m.title}</h2>
              <ul className="space-y-2.5">
                {m.items.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <li key={item.name} className="flex items-start gap-3 text-sm">
                      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${meta.dot}`} />
                      <span className="flex-1">
                        <span className={item.status === 'planned' ? 'text-muted-foreground' : ''}>
                          {item.name}
                        </span>
                        {item.note && (
                          <span className="block text-xs text-muted-foreground">{item.note}</span>
                        )}
                      </span>
                      <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
