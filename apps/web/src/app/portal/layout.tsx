import { Plane } from 'lucide-react';
import { getPortalToken } from '@/lib/portal-session';
import { PortalLogout } from '@/components/portal/portal-logout';
import { PortalNav } from '@/components/portal/portal-nav';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // The login route renders without this guard via its own segment check.
  const token = await getPortalToken();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-muted/20">
      <header className="theme-gradient flex items-center justify-between px-5 py-4 text-white shadow-sm">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Plane className="h-5 w-5" /> TravelOS
        </span>
        {token && <PortalLogout />}
      </header>

      <main className="flex-1 pb-24">{children}</main>

      {token && <PortalNav />}
    </div>
  );
}
