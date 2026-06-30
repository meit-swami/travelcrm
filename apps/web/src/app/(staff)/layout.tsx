import { redirect } from 'next/navigation';
import { Plane } from 'lucide-react';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { LogoutButton } from '@/components/logout-button';
import { StaffNav } from '@/components/staff-nav';
import { MobileNav } from '@/components/mobile-nav';

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
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="theme-gradient flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm">
            <Plane className="h-4 w-4" />
          </span>
          <span className="theme-gradient-text text-lg font-bold tracking-tight">TravelOS AI</span>
        </div>
        <StaffNav />
        <div className="border-t border-border p-4">
          <div className="mb-2 text-sm">
            <div className="font-medium">{me?.fullName}</div>
            <div className="truncate text-xs text-muted-foreground">{me?.email}</div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
