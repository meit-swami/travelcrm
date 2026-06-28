'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { clientFetch } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function InviteUser() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await clientFetch('/api/proxy/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      });
      if (!res.ok) throw new ApiError(await res.json());
      setEmail('');
      setFullName('');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail ?? err.problem.title : 'Failed to invite');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return <Button onClick={() => setOpen(true)}>+ Invite user</Button>;

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-40" />
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-52" />
      <Button type="submit" disabled={loading}>{loading ? '…' : 'Invite'}</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  );
}
