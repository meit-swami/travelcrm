// Creates the travelcrm_app RLS role after migrations.
// Password is parsed from APP_DATABASE_URL; uses DATABASE_URL (privileged).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appUrl = process.env.APP_DATABASE_URL;
if (!appUrl) {
  console.log('• Skipping roles (APP_DATABASE_URL not set).');
  process.exit(0);
}

const password = decodeURIComponent(new URL(appUrl).password);
const sql = readFileSync(join(__dirname, 'roles.sql'), 'utf8')
  .replace(/\\gexec/g, '')
  .replace(
    /SELECT format\('CREATE ROLE travelcrm_app LOGIN NOBYPASSRLS PASSWORD %L', :'app_password'\)\s*WHERE NOT EXISTS \(SELECT 1 FROM pg_roles WHERE rolname = 'travelcrm_app'\);/,
    `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'travelcrm_app') THEN
    EXECUTE format('CREATE ROLE travelcrm_app LOGIN NOBYPASSRLS PASSWORD %L', '${password.replace(/'/g, "''")}');
  ELSE
    EXECUTE format('ALTER ROLE travelcrm_app WITH LOGIN PASSWORD %L', '${password.replace(/'/g, "''")}');
  END IF;
END $$;`,
  );

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

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
