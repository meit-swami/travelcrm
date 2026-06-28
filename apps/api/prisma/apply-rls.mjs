// Applies prisma/rls.sql after migrations. Run via: pnpm db:migrate:deploy
//
// Uses node-postgres (not Prisma) because the script contains DO $$...$$ blocks,
// a CREATE FUNCTION body and multiple statements — which Prisma's single-
// statement $executeRawUnsafe cannot run. node-postgres executes the whole
// script in one round-trip. Runs with DATABASE_URL (privileged role).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePgClient } from './pg-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, 'rls.sql'), 'utf8');

const client = makePgClient(process.env.DATABASE_URL);

try {
  await client.connect();
  await client.query(sql);
  console.log('✓ Applied RLS policies.');
} catch (err) {
  console.error('✗ Failed to apply RLS:', err.message ?? err);
  process.exitCode = 1;
} finally {
  await client.end();
}
