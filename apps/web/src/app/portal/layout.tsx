import Link from 'next/link';
import { Home, FileText, Receipt, Ticket } from 'lucide-react';
import { getPortalToken } from '@/lib/portal-session';
import { PortalLogout } from '@/components/portal/portal-logout';

const NAV = [
  { href: '/portal', label: 'Home', icon: Home },
  { href: '/portal/quotations', label: 'Quotes', icon: FileText },
  { href: '/portal/invoices', label: 'Invoices', icon: Receipt },
  { href: '/portal/vouchers', label: 'Vouchers', icon: Ticket },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // The login route renders without this guard via its own segment check.
  const token = await getPortalToken();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-lg font-semibold tracking-tight">TravelOS</span>
        {token && <PortalLogout />}
      </header>

      <main className="flex-1 pb-20">{children}</main>

      {token && (
        <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t border-border bg-card py-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
