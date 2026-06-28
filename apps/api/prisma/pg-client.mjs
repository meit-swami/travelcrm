// Shared node-postgres client factory for the maintenance scripts
// (apply-rls.mjs, apply-roles.mjs).
//
// Managed Postgres (Supabase, RDS, etc.) requires SSL, and recent node-postgres
// treats sslmode=require/prefer/verify-ca as verify-full — which rejects a
// provider cert chain it doesn't have the CA for ("self-signed certificate in
// certificate chain"). We relax verification for those connections so the
// idempotent DDL scripts can run. Prisma migrate handles SSL itself, so this
// only affects the raw-SQL helpers.
//
// To pin the CA instead (stronger), set DATABASE_SSL_CA to the PEM path.
import { readFileSync } from 'node:fs';
import pg from 'pg';

export function makePgClient(connectionString) {
  const sslHinted =
    /sslmode=(require|verify-ca|verify-full|prefer)/.test(connectionString) ||
    /\.supabase\.(co|com)/.test(connectionString) ||
    /\.rds\.amazonaws\.com/.test(connectionString) ||
    process.env.DATABASE_SSL === 'true';

  let ssl;
  if (sslHinted) {
    ssl = process.env.DATABASE_SSL_CA
      ? { ca: readFileSync(process.env.DATABASE_SSL_CA, 'utf8') }
      : { rejectUnauthorized: false };
  }

  return new pg.Client({ connectionString, ...(ssl ? { ssl } : {}) });
}
