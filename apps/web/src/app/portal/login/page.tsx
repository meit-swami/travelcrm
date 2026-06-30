'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane } from 'lucide-react';
import { clientFetch } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [tenantSlug, setTenantSlug] = useState('demo');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await clientFetch('/api/proxy/portal/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, phone }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? 'Could not send code');
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const verifyRes = await clientFetch('/api/proxy/portal/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, phone, code }),
      });
      if (!verifyRes.ok) throw new Error((await verifyRes.json().catch(() => ({}))).detail ?? 'Invalid code');
      const { accessToken } = await verifyRes.json();
      await clientFetch('/api/portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      router.push('/portal');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm overflow-hidden">
        <div className="theme-gradient px-6 py-8 text-white">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Plane className="h-4 w-4" /> TravelOS
          </div>
          <h1 className="mt-3 text-2xl font-bold">Your Trip Portal</h1>
          <p className="mt-1 text-sm text-white/80">
            {step === 'phone' ? 'Sign in with your phone number' : `Enter the code sent to ${phone}`}
          </p>
        </div>
        <CardContent className="pt-6">
          {step === 'phone' ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Workspace</label>
                <Input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending…' : 'Send code'}</Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Verification code</label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Verifying…' : 'Verify & continue'}</Button>
              <button type="button" className="w-full text-xs text-muted-foreground hover:underline" onClick={() => setStep('phone')}>
                ← Use a different number
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
