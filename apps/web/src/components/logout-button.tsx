'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }
  return (
    <Button variant="outline" size="sm" className="w-full" onClick={logout}>
      Sign out
    </Button>
  );
}
