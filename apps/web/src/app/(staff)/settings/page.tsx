import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

const SECTIONS = [
  { href: '/settings/access', title: 'My Access', desc: 'Your role & permissions', emoji: '🔑' },
  { href: '/settings/appearance', title: 'Appearance', desc: 'Theme & colour palettes', emoji: '🎨' },
  { href: '/settings/users', title: 'Users', desc: 'Team members & access', emoji: '👥' },
  { href: '/settings/sources', title: 'Lead Sources & Rules', desc: 'Capture sources, assignment', emoji: '🎯' },
  { href: '/settings/email', title: 'Email & Automation', desc: 'Templates and delivery logs', emoji: '✉️' },
  { href: '/settings/integrations', title: 'Integrations', desc: 'AI, payments, WhatsApp, email', emoji: '🔌' },
  { href: '/settings/audit', title: 'Audit Log', desc: 'Every action, who & when', emoji: '🛡️' },
  { href: '/settings/project-status', title: 'Project Status', desc: 'Modules done & remaining', emoji: '📊' },
];

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex items-start gap-3 py-5">
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.desc}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
