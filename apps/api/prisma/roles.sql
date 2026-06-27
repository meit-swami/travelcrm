-- TravelCRM — application DB role for RLS-enforced request queries.
--
-- Run ONCE as a superuser after migrations (it grants on existing tables).
-- The app then connects with APP_DATABASE_URL using this NON-superuser,
-- NOBYPASSRLS role so PostgreSQL RLS policies are actually enforced for
-- request data access. DATABASE_URL keeps using the privileged role for
-- migrations + system/cross-tenant operations.
--
-- Usage:
--   psql "$DATABASE_URL" -v app_password="'<strong-password>'" -f prisma/roles.sql
--   APP_DATABASE_URL=postgresql://travelcrm_app:<password>@host:5432/travelcrm?schema=public

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'travelcrm_app') THEN
    EXECUTE format('CREATE ROLE travelcrm_app LOGIN NOBYPASSRLS PASSWORD %L', :'app_password');
  END IF;
END
$$;

-- Connect + schema usage.
GRANT USAGE ON SCHEMA public TO travelcrm_app;

-- DML on all current and future tables/sequences (NOT ownership — owner could
-- bypass FORCE RLS in some configs; a plain grantee with NOBYPASSRLS cannot).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO travelcrm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO travelcrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO travelcrm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO travelcrm_app;

-- Allow the role to read the helper function used by RLS policies.
GRANT EXECUTE ON FUNCTION current_tenant_id() TO travelcrm_app;
