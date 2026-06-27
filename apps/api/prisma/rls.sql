-- TravelOS AI — Row-Level Security policies (Phase 0)
-- Applied after `prisma migrate deploy` via prisma/apply-rls.mjs.
--
-- Strategy: every tenant-scoped table restricts rows to the tenant set on the
-- session via `SET LOCAL app.current_tenant = '<uuid>'`. FORCE ROW LEVEL
-- SECURITY ensures even the table owner is subject to the policy, so the
-- application connection cannot read across tenants.
--
-- `current_tenant_id()` returns the session tenant, or NULL if unset.

-- Required extensions.
CREATE EXTENSION IF NOT EXISTS citext;

-- Helper: read the session tenant safely (NULL when not set).
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN nullif(current_setting('app.current_tenant', true), '')::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

-- Apply a strict tenant policy to a table with a `tenant_id` column.
DO $$
DECLARE
  t text;
  strict_tables text[] := ARRAY[
    'user', 'team', 'user_role', 'session', 'login_history',
    'otp_challenge', 'audit_log', 'notification', 'file',
    -- Leads domain (Phase 1)
    'lead_source', 'lead', 'lead_activity', 'note', 'task', 'tag',
    'lead_tag', 'lost_reason', 'assignment_rule', 'lead_dedupe_match',
    'attachment',
    -- Quotations (Phase 2)
    'quotation', 'quotation_version',
    -- Email automation (Phase 2)
    'email_template', 'email_log', 'automation',
    -- AI layer (Phase 2)
    'ai_insight', 'ai_extracted_requirement', 'ai_job',
    -- WhatsApp / conversations (Phase 2)
    'conversation', 'message',
    -- Itinerary (Phase 2)
    'itinerary', 'itinerary_version',
    -- Operations / Vendors / Vouchers / Calls (Phase 3)
    'booking', 'operation_task', 'vendor', 'vendor_rate', 'hotel_booking',
    'transport_booking', 'vendor_communication', 'voucher', 'call',
    -- Payments & Portal (Phase 4)
    'invoice', 'payment', 'portal_identity', 'portal_access_grant'
  ];
BEGIN
  FOREACH t IN ARRAY strict_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (tenant_id = current_tenant_id())
         WITH CHECK (tenant_id = current_tenant_id());', t);
  END LOOP;
END;
$$;

-- `role` is special: system roles (tenant_id IS NULL) are visible to every
-- tenant; tenant custom roles are isolated.
ALTER TABLE "role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "role";
CREATE POLICY tenant_isolation ON "role"
  USING (tenant_id IS NULL OR tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Note: `permission` and `role_permission` are a global catalogue (no RLS).
-- `team_member` is scoped transitively through `team` and enforced in the app layer.
