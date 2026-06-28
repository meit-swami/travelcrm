'use client';

import { useRouter } from 'next/navigation';

export function PortalLogout() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/portal-session', { method: 'DELETE' });
    router.push('/portal/login');
    router.refresh();
  }
  return (
    <button onClick={logout} className="text-xs text-muted-foreground hover:underline">
      Sign out
    </button>
  );
}
