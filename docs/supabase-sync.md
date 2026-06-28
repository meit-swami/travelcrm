# Syncing the schema to Supabase

Supabase is plain PostgreSQL, so the TravelCRM schema + RLS apply directly. The
project is `bbwnwrgtiwpfewswjfhd` (see `.mcp.json`).

> ⚠️ I could not apply this from the build sandbox — the network policy blocks
> the Supabase API/MCP host. Run one of the options below from your machine
> (where you have the Supabase connection string), or have me apply it once the
> Supabase MCP is reachable.

## Option A — One-shot SQL (fastest)

A consolidated, verified script lives at
[`apps/api/prisma/supabase-sync.sql`](../apps/api/prisma/supabase-sync.sql) —
all 9 migrations (0000–0008) in order **+ RLS policies** (53 tables). It applies
cleanly to an empty database (verified against PostgreSQL 16).

**Supabase SQL Editor:** open the project → SQL Editor → paste the file → Run.

**Or via psql** (connection string from Supabase → Project Settings → Database):
```bash
psql "postgresql://postgres:[PASSWORD]@db.bbwnwrgtiwpfewswjfhd.supabase.co:5432/postgres" \
  -v ON_ERROR_STOP=1 -f apps/api/prisma/supabase-sync.sql
```

## Option B — Prisma (keeps migration history; best for ongoing changes)

Point Prisma at Supabase and deploy the tracked migrations + RLS:
```bash
cd apps/api
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.bbwnwrgtiwpfewswjfhd.supabase.co:5432/postgres"
pnpm exec prisma migrate deploy      # applies migrations/0000…0008
node prisma/apply-rls.mjs            # applies RLS policies (needs `pnpm add pg` once)
```
Future schema changes: add a Prisma migration and re-run `migrate deploy` — the
`supabase-sync.sql` is just a convenience snapshot, regenerate it after changes.

## Seed (required for the app to work)

The schema alone has no permissions/roles. Seed the RBAC catalogue + system
roles (and optionally a bootstrap admin) against Supabase:
```bash
cd apps/api
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.bbwnwrgtiwpfewswjfhd.supabase.co:5432/postgres"
# optional first-login admin:
export BOOTSTRAP_TENANT_SLUG=demo BOOTSTRAP_ADMIN_EMAIL=admin@demo.travelos.ai BOOTSTRAP_ADMIN_PASSWORD='Demo@12345'
pnpm exec tsx prisma/seed.ts
```

## Point the app at Supabase

In `infra/docker/.env` (or your runtime env):
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.bbwnwrgtiwpfewswjfhd.supabase.co:5432/postgres
# Optional RLS app role — on Supabase you can reuse the pooled connection; the
# tenant isolation works via the per-transaction `app.current_tenant` setting
# regardless of the role, but a NOBYPASSRLS role still gives defense in depth.
# APP_DATABASE_URL=postgresql://travelcrm_app:[PASSWORD]@db.bbwnwrgtiwpfewswjfhd.supabase.co:5432/postgres
```

## Supabase-specific notes
- **Extensions:** the script runs `CREATE EXTENSION IF NOT EXISTS citext/pgcrypto`
  — both are available on Supabase.
- **Connection pooling:** RLS uses `set_config('app.current_tenant', …, true)`
  (transaction-local) inside the same transaction as each query, so it works
  even through the Supabase transaction pooler (port 6543).
- **`gen_random_uuid()`**: built-in on Supabase — no change needed.
- **Supabase Auth**: not used; TravelCRM has its own JWT/OTP auth. The RLS
  policies depend only on the session `app.current_tenant`, not on Supabase
  `auth.uid()`.
