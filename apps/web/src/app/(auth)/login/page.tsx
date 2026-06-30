'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Sparkles, ShieldCheck, BarChart3 } from 'lucide-react';
import { clientFetch, appUrl } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [tenantSlug, setTenantSlug] = useState('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await clientFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, email, password }),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.detail ?? p.title ?? 'Invalid credentials');
      }
      router.push(params.get('next') ?? '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="theme-gradient relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-white">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Plane className="h-6 w-6" /> TravelOS&nbsp;AI
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Run your travel business,<br />end&nbsp;to&nbsp;end.
          </h1>
          <p className="max-w-md text-white/80">
            Leads, AI enrichment, quotations, operations, payments and a customer portal — one platform.
          </p>
          <ul className="space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-3"><Sparkles className="h-5 w-5" /> AI summarizes chats & scores hot leads</li>
            <li className="flex items-center gap-3"><BarChart3 className="h-5 w-5" /> Quote → confirm → operate → get paid</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Multi-tenant, role-based & fully audited</li>
          </ul>
        </div>
        <p className="text-xs text-white/60">© TravelOS AI</p>
        {/* decorative glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 text-xl font-semibold text-primary">
              <Plane className="h-6 w-6" /> TravelOS&nbsp;AI
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Sign in to your workspace</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="tenant">Workspace</label>
              <Input id="tenant" value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Customer?{' '}
            <a href={appUrl('/portal/login')} className="font-medium text-primary hover:underline">Go to the trip portal →</a>
          </p>
        </div>
      </div>
    </main>
  );
}
