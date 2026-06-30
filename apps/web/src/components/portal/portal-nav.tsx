'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Receipt, Ticket } from 'lucide-react';

const NAV = [
  { href: '/portal', label: 'Home', icon: Home },
  { href: '/portal/quotations', label: 'Quotes', icon: FileText },
  { href: '/portal/invoices', label: 'Invoices', icon: Receipt },
  { href: '/portal/vouchers', label: 'Vouchers', icon: Ticket },
];

export function PortalNav() {
  const pathname = usePathname();
  // Strip the optional base path so matching works under /travelcrm.
  const path = pathname.replace(/^\/travelcrm/, '') || '/';

  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t border-border bg-card py-2">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/portal' ? path === '/portal' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-xs transition-colors ${
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={active ? 'accent-soft rounded-full p-1.5' : 'p-1.5'}>
              <Icon className="h-5 w-5" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
