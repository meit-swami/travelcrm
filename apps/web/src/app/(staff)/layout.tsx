import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, Phone, FileText, Settings, Briefcase, Truck } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { LogoutButton } from '@/components/logout-button';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Briefcase },
  { href: '/conversations', label: 'Conversations', icon: Phone },
  { href: '/quotations', label: 'Quotations', icon: FileText },
  { href: '/operations', label: 'Operations', icon: Truck },
  { href: '/settings/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  let me: { fullName: string; email: string; roles: string[] } | null = null;
  try {
    me = await api.me(token);
  } catch {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-border bg-card md:flex">
        <div className="px-6 py-5 text-lg font-semibold tracking-tight">TravelOS AI</div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-2 text-sm">
            <div className="font-medium">{me?.fullName}</div>
            <div className="truncate text-xs text-muted-foreground">{me?.email}</div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 bg-muted/20">{children}</main>
    </div>
  );
}
