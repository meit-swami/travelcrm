'use client';

import { useRouter } from 'next/navigation';
import { clientFetch } from '@/lib/client';

export function PortalLogout() {
  const router = useRouter();
  async function logout() {
    await clientFetch('/api/portal-session', { method: 'DELETE' });
    router.push('/portal/login');
    router.refresh();
  }
  return (
    <button onClick={logout} className="text-xs text-muted-foreground hover:underline">
      Sign out
    </button>
  );
}
