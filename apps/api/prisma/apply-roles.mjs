// Creates (or updates) the travelcrm_app RLS role after migrations, then applies
// the GRANTs from roles.sql. Uses DATABASE_URL (privileged); the role name and
// password come from APP_DATABASE_URL.
//
// We build the CREATE/ALTER ROLE statement in JS rather than relying on psql's
// `:'app_password'` substitution + `\gexec` (node-postgres can't run those), and
// strip that psql-only block out of roles.sql before sending the rest.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePgClient } from './pg-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appUrl = process.env.APP_DATABASE_URL;
if (!appUrl) {
  console.log('• Skipping roles (APP_DATABASE_URL not set).');
  process.exit(0);
}

const parsed = new URL(appUrl);
const username = decodeURIComponent(parsed.username) || 'travelcrm_app';
const password = decodeURIComponent(parsed.password);
const lit = (s) => s.replace(/'/g, "''");

// Drop the psql-specific role-creation block (SELECT format(... :'app_password' ...)
// ... \gexec) and any stray \gexec; we create the role programmatically below. The
// remaining statements are the static GRANTs, which reference travelcrm_app by name.
const grants = readFileSync(join(__dirname, 'roles.sql'), 'utf8')
  .replace(/SELECT\s+format\([\s\S]*?\\gexec/m, '')
  .replace(/\\gexec/g, '');

const createRole = `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${lit(username)}') THEN
    EXECUTE format('CREATE ROLE %I LOGIN NOBYPASSRLS PASSWORD %L', '${lit(username)}', '${lit(password)}');
  ELSE
    EXECUTE format('ALTER ROLE %I WITH LOGIN NOBYPASSRLS PASSWORD %L', '${lit(username)}', '${lit(password)}');
  END IF;
END $$;`;

const sql = `${createRole}\n${grants}`;

const client = makePgClient(process.env.DATABASE_URL);

try {
  await client.connect();
  await client.query(sql);
  console.log('✓ Applied DB roles.');
} catch (err) {
  console.error('✗ Failed to apply roles:', err.message ?? err);
  process.exitCode = 1;
} finally {
  await client.end();
}
