'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Phone,
  FileText,
  Settings,
  Briefcase,
  Truck,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Briefcase },
  { href: '/conversations', label: 'Conversations', icon: Phone },
  { href: '/quotations', label: 'Quotations', icon: FileText },
  { href: '/operations', label: 'Operations', icon: Truck },
  { href: '/settings/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function StaffNav() {
  const pathname = usePathname();
  const path = pathname.replace(/^\/travelcrm/, '') || '/';

  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/settings' ? path === '/settings' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
