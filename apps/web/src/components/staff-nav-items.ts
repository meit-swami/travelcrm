import {
  LayoutDashboard,
  Users,
  Phone,
  FileText,
  Settings,
  Briefcase,
  Truck,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const STAFF_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Briefcase },
  { href: '/conversations', label: 'Conversations', icon: Phone },
  { href: '/quotations', label: 'Quotations', icon: FileText },
  { href: '/operations', label: 'Operations', icon: Truck },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/** Active-route test shared by the desktop and mobile nav. */
export function isActive(pathname: string, href: string): boolean {
  const path = pathname.replace(/^\/travelcrm/, '') || '/';
  return href === '/settings' ? path === '/settings' : path.startsWith(href);
}
