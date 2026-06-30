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
    <button onClick={logout} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/25">
      Sign out
    </button>
  );
}
