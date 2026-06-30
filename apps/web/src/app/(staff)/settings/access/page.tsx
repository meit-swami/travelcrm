import { redirect } from 'next/navigation';
import {
  PERMISSION_CATALOGUE,
  ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  SystemRole,
} from '@travelos/types';
import { getAccessToken } from '@/lib/session';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_executive: 'Sales Executive',
  operations_manager: 'Operations Manager',
  operations_executive: 'Operations Executive',
  accounts_team: 'Accounts Team',
  vendor_team: 'Vendor Team',
  customer: 'Customer',
};

function permCount(roleKey: string): number {
  const grant = ROLE_PERMISSIONS[roleKey as keyof typeof ROLE_PERMISSIONS];
  if (!grant) return 0;
  return grant === ALL_PERMISSIONS ? PERMISSION_CATALOGUE.length : grant.length;
}

export default async function AccessPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  const me = await api.me(token).catch(() => null);
  if (!me) redirect('/login');

  // Group the current user's effective permissions by resource.
  const byResource = new Map<string, string[]>();
  for (const p of me.permissions ?? []) {
    const [resource, action] = p.split('.');
    if (!byResource.has(resource)) byResource.set(resource, []);
    byResource.get(resource)!.push(action);
  }
  const isSuper = (me.roles ?? []).some((r) => r === 'admin' || r === 'super_admin');

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Who you are signed in as, your roles, and exactly what you can do.
        </p>
      </div>

      {/* Identity + roles */}
      <Card>
        <CardContent className="space-y-4 py-6">
          <div>
            <div className="text-lg font-semibold">{me.fullName}</div>
            <div className="text-sm text-muted-foreground">{me.email}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(me.roles ?? []).map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
              >
                {ROLE_LABELS[role] ?? role}
              </span>
            ))}
          </div>
          <p className="text-sm">
            {isSuper ? (
              <span className="accent-soft rounded-md px-2 py-1 font-medium text-primary">
                Full administrative access — every module &amp; action ({me.permissions?.length ?? 0} permissions).
              </span>
            ) : (
              <>You have <b>{me.permissions?.length ?? 0}</b> permissions across{' '}
              <b>{byResource.size}</b> modules.</>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Effective permissions grouped by module */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Your permissions by module</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...byResource.entries()].sort().map(([resource, actions]) => (
            <Card key={resource}>
              <CardContent className="py-4">
                <div className="mb-2 font-medium capitalize">{resource.replace(/_/g, ' ')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {actions.sort().map((a) => (
                    <span key={a} className="accent-soft rounded px-1.5 py-0.5 text-xs text-primary">
                      {a}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Reference: all system roles */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-muted-foreground">All system roles (reference)</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          The platform ships these 9 roles. Super Admin and Admin both have every permission.
        </p>
        <Card>
          <CardContent className="divide-y divide-border py-2">
            {Object.values(SystemRole).map((roleKey) => {
              const count = permCount(roleKey);
              const mine = (me.roles ?? []).includes(roleKey);
              const all = ROLE_PERMISSIONS[roleKey as keyof typeof ROLE_PERMISSIONS] === ALL_PERMISSIONS;
              return (
                <div key={roleKey} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ROLE_LABELS[roleKey] ?? roleKey}</span>
                    {mine && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {all ? 'All permissions' : `${count} permissions`}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
