'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { STAFF_NAV, isActive } from './staff-nav-items';

export function StaffNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3">
      {STAFF_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
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
