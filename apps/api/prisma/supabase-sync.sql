-- ════════════════════════════════════════════════════════════════
-- TravelCRM — consolidated schema + RLS for Supabase
-- Generated from prisma/migrations/* (0000–0008) + rls.sql
-- Run in the Supabase SQL Editor, or: psql "$SUPABASE_DB_URL" -f supabase-sync.sql
-- Idempotent-ish: safe on an EMPTY project. Re-running on an existing
-- schema will error on duplicate objects (expected).
-- ════════════════════════════════════════════════════════════════

-- ─────────────── migrations/0000_init ───────────────
-- Required extensions (must precede CITEXT columns and gen_random_uuid defaults)
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'trial', 'suspended', 'cancelled');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('starter', 'growth', 'enterprise');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'invited', 'disabled');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('sales', 'operations', 'accounts', 'vendor');

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('sms', 'whatsapp', 'email');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('login', 'verify');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('created', 'updated', 'deleted', 'assigned', 'transferred', 'status_changed', 'payment_updated', 'quotation_updated', 'login', 'logout', 'export', 'permission_change');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('user', 'customer', 'system', 'integration');

-- CreateTable
CREATE TABLE "tenant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "custom_domain" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'trial',
    "plan" "TenantPlan" NOT NULL DEFAULT 'starter',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "billing_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "is_2fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret_enc" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TeamType" NOT NULL,
    "manager_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_in_team" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("team_id","user_id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "scope_team_id" UUID,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenge" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "identity_ref" TEXT NOT NULL,
    "channel" "OtpChannel" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'login',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_type" "AuditActorType" NOT NULL DEFAULT 'user',
    "action" "AuditAction" NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "ref_table" TEXT,
    "ref_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum" TEXT,
    "category" TEXT NOT NULL,
    "owner_resource_type" TEXT,
    "owner_resource_id" UUID,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_custom_domain_key" ON "tenant"("custom_domain");

-- CreateIndex
CREATE INDEX "user_tenant_id_status_idx" ON "user"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_tenant_id_email_key" ON "user"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "team_tenant_id_type_idx" ON "team"("tenant_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "role_tenant_id_key_key" ON "role"("tenant_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "permission"("key");

-- CreateIndex
CREATE INDEX "permission_resource_idx" ON "permission"("resource");

-- CreateIndex
CREATE INDEX "user_role_tenant_id_user_id_idx" ON "user_role"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_user_id_role_id_scope_team_id_key" ON "user_role"("user_id", "role_id", "scope_team_id");

-- CreateIndex
CREATE INDEX "session_tenant_id_user_id_idx" ON "session"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "session_refresh_token_hash_idx" ON "session"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "login_history_tenant_id_email_idx" ON "login_history"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "otp_challenge_tenant_id_identity_ref_idx" ON "otp_challenge"("tenant_id", "identity_ref");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_resource_type_resource_id_created_at_idx" ON "audit_log"("tenant_id", "resource_type", "resource_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_tenant_id_user_id_is_read_idx" ON "notification"("tenant_id", "user_id", "is_read");

-- CreateIndex
CREATE INDEX "file_tenant_id_category_idx" ON "file"("tenant_id", "category");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_manager_user_id_fkey" FOREIGN KEY ("manager_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_scope_team_id_fkey" FOREIGN KEY ("scope_team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenge" ADD CONSTRAINT "otp_challenge_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────── migrations/0001_leads_domain ───────────────
-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('new', 'contacted', 'interested', 'quotation_sent', 'negotiation', 'follow_up', 'confirmed', 'lost', 'cancelled');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('open', 'won', 'lost');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('low', 'medium', 'high', 'hot');

-- CreateEnum
CREATE TYPE "LeadSourceType" AS ENUM ('website', 'landing_page', 'contact_form', 'manual', 'whatsapp', 'facebook_ads', 'instagram_ads', 'google_forms', 'referral', 'import');

-- CreateEnum
CREATE TYPE "AssignmentStrategy" AS ENUM ('round_robin', 'team', 'destination', 'load_balanced', 'manual');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('stage_change', 'note', 'task', 'call', 'whatsapp', 'email', 'quotation', 'payment', 'assignment', 'ai_insight', 'system');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('call', 'follow_up', 'email', 'whatsapp', 'meeting', 'custom');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "DedupeMatchType" AS ENUM ('phone', 'email', 'fuzzy');

-- CreateTable
CREATE TABLE "lead_source" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "type" "LeadSourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "source_id" UUID,
    "reference_code" TEXT NOT NULL,
    "stage" "LeadStage" NOT NULL DEFAULT 'new',
    "status" "LeadStatus" NOT NULL DEFAULT 'open',
    "name" TEXT NOT NULL,
    "email" CITEXT,
    "phone" TEXT,
    "alt_phone" TEXT,
    "destination" TEXT,
    "travel_date" DATE,
    "return_date" DATE,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "budget_amount" DECIMAL(14,2),
    "budget_currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "hotel_preference" TEXT,
    "flight_required" BOOLEAN,
    "special_requests" TEXT,
    "assigned_user_id" UUID,
    "assigned_team_id" UUID,
    "priority" "LeadPriority" NOT NULL DEFAULT 'medium',
    "score" INTEGER,
    "lost_reason_id" UUID,
    "dedupe_hash" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "ref_table" TEXT,
    "ref_id" UUID,
    "actor_user_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "author_user_id" UUID,
    "body" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'follow_up',
    "due_at" TIMESTAMP(3),
    "remind_at" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "assignee_user_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tag" (
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "lead_tag_pkey" PRIMARY KEY ("lead_id","tag_id")
);

-- CreateTable
CREATE TABLE "lost_reason" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "lost_reason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_rule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" "AssignmentStrategy" NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "target_team_id" UUID,
    "target_user_ids" UUID[],
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_rule_state" (
    "rule_id" UUID NOT NULL,
    "last_user_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_rule_state_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "lead_dedupe_match" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "duplicate_of_lead_id" UUID NOT NULL,
    "match_type" "DedupeMatchType" NOT NULL,
    "confidence" DECIMAL(4,3) NOT NULL DEFAULT 1.0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_dedupe_match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "label" TEXT,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_source_tenant_id_type_idx" ON "lead_source"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "lead_tenant_id_stage_idx" ON "lead"("tenant_id", "stage");

-- CreateIndex
CREATE INDEX "lead_tenant_id_assigned_user_id_idx" ON "lead"("tenant_id", "assigned_user_id");

-- CreateIndex
CREATE INDEX "lead_tenant_id_phone_idx" ON "lead"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "lead_tenant_id_dedupe_hash_idx" ON "lead"("tenant_id", "dedupe_hash");

-- CreateIndex
CREATE INDEX "lead_tenant_id_destination_idx" ON "lead"("tenant_id", "destination");

-- CreateIndex
CREATE INDEX "lead_tenant_id_travel_date_idx" ON "lead"("tenant_id", "travel_date");

-- CreateIndex
CREATE UNIQUE INDEX "lead_tenant_id_reference_code_key" ON "lead"("tenant_id", "reference_code");

-- CreateIndex
CREATE INDEX "lead_activity_tenant_id_lead_id_created_at_idx" ON "lead_activity"("tenant_id", "lead_id", "created_at");

-- CreateIndex
CREATE INDEX "note_tenant_id_lead_id_idx" ON "note"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "task_tenant_id_assignee_user_id_due_at_idx" ON "task"("tenant_id", "assignee_user_id", "due_at");

-- CreateIndex
CREATE INDEX "task_tenant_id_status_remind_at_idx" ON "task"("tenant_id", "status", "remind_at");

-- CreateIndex
CREATE UNIQUE INDEX "tag_tenant_id_name_key" ON "tag"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "lost_reason_tenant_id_label_key" ON "lost_reason"("tenant_id", "label");

-- CreateIndex
CREATE INDEX "assignment_rule_tenant_id_priority_idx" ON "assignment_rule"("tenant_id", "priority");

-- CreateIndex
CREATE INDEX "lead_dedupe_match_tenant_id_lead_id_idx" ON "lead_dedupe_match"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "attachment_tenant_id_lead_id_idx" ON "attachment"("tenant_id", "lead_id");

-- AddForeignKey
ALTER TABLE "lead_source" ADD CONSTRAINT "lead_source_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "lead_source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_assigned_team_id_fkey" FOREIGN KEY ("assigned_team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_lost_reason_id_fkey" FOREIGN KEY ("lost_reason_id") REFERENCES "lost_reason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activity" ADD CONSTRAINT "lead_activity_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tag" ADD CONSTRAINT "lead_tag_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tag" ADD CONSTRAINT "lead_tag_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tag" ADD CONSTRAINT "lead_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_reason" ADD CONSTRAINT "lost_reason_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_rule" ADD CONSTRAINT "assignment_rule_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_rule_state" ADD CONSTRAINT "assignment_rule_state_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "assignment_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_dedupe_match" ADD CONSTRAINT "lead_dedupe_match_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_dedupe_match" ADD CONSTRAINT "lead_dedupe_match_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_dedupe_match" ADD CONSTRAINT "lead_dedupe_match_duplicate_of_lead_id_fkey" FOREIGN KEY ("duplicate_of_lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────── migrations/0002_quotations ───────────────
-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');

-- CreateTable
CREATE TABLE "quotation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "reference_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "current_version_id" UUID,
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
    "sent_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "decided_at" TIMESTAMP(3),
    "valid_until" DATE,
    "rejection_reason" TEXT,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "quotation_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "notes" TEXT,
    "pdf_file_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotation_tenant_id_lead_id_idx" ON "quotation"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "quotation_tenant_id_status_idx" ON "quotation"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "quotation_tenant_id_valid_until_idx" ON "quotation"("tenant_id", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_tenant_id_reference_code_key" ON "quotation"("tenant_id", "reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_version_quotation_id_version_no_key" ON "quotation_version"("quotation_id", "version_no");

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_version" ADD CONSTRAINT "quotation_version_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_version" ADD CONSTRAINT "quotation_version_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────── migrations/0003_email_automation ───────────────
-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('queued', 'sent', 'failed', 'bounced', 'opened');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('quotation_sent', 'payment_received', 'invoice_generated', 'voucher_generated', 'travel_reminder', 'feedback_request');

-- CreateTable
CREATE TABLE "email_template" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_body" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "template_key" TEXT,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'queued',
    "provider_message_id" TEXT,
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "trigger_event" "AutomationTrigger" NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "template_key" TEXT NOT NULL,
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_template_tenant_id_key_key" ON "email_template"("tenant_id", "key");

-- CreateIndex
CREATE INDEX "email_log_tenant_id_status_idx" ON "email_log"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "automation_tenant_id_trigger_event_idx" ON "automation"("tenant_id", "trigger_event");

-- AddForeignKey
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation" ADD CONSTRAINT "automation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────── migrations/0004_ai_layer ───────────────
-- CreateEnum
CREATE TYPE "AiInsightKind" AS ENUM ('lead_summary', 'call_summary', 'chat_summary', 'requirement_extract', 'conversion_score', 'hot_lead', 'loss_reason', 'quote_rejection', 'mgmt_insight');

-- CreateTable
CREATE TABLE "ai_insight" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "kind" "AiInsightKind" NOT NULL,
    "model" TEXT NOT NULL,
    "input_ref" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "confidence" DECIMAL(4,3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_extracted_requirement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "destination" TEXT,
    "travel_date" TEXT,
    "budget" TEXT,
    "adults" INTEGER,
    "children" INTEGER,
    "hotel_preference" TEXT,
    "flight_required" BOOLEAN,
    "special_requests" TEXT,
    "source_insight_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_extracted_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_job" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(10,5) NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_insight_tenant_id_lead_id_kind_idx" ON "ai_insight"("tenant_id", "lead_id", "kind");

-- CreateIndex
CREATE INDEX "ai_extracted_requirement_tenant_id_lead_id_idx" ON "ai_extracted_requirement"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "ai_job_tenant_id_kind_idx" ON "ai_job"("tenant_id", "kind");

-- AddForeignKey
ALTER TABLE "ai_insight" ADD CONSTRAINT "ai_insight_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insight" ADD CONSTRAINT "ai_insight_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_extracted_requirement" ADD CONSTRAINT "ai_extracted_requirement_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_extracted_requirement" ADD CONSTRAINT "ai_extracted_requirement_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_job" ADD CONSTRAINT "ai_job_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────── migrations/0005_whatsapp ───────────────
-- CreateEnum
CREATE TYPE "ConversationChannel" AS ENUM ('whatsapp', 'email', 'sms');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('open', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('text', 'image', 'audio', 'video', 'document', 'location', 'template');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "IntegrationEventStatus" AS ENUM ('received', 'processed', 'failed');

-- CreateTable
CREATE TABLE "conversation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "channel" "ConversationChannel" NOT NULL,
    "external_id" TEXT,
    "contact_handle" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "status" "ConversationStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "sender" TEXT NOT NULL,
    "body" TEXT,
    "content_type" "MessageContentType" NOT NULL DEFAULT 'text',
    "media_file_id" UUID,
    "transcription" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'queued',
    "external_id" TEXT,
    "template_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "signature_valid" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "IntegrationEventStatus" NOT NULL DEFAULT 'received',
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_tenant_id_last_message_at_idx" ON "conversation"("tenant_id", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_tenant_id_channel_contact_handle_key" ON "conversation"("tenant_id", "channel", "contact_handle");

-- CreateIndex
CREATE INDEX "message_tenant_id_conversation_id_created_at_idx" ON "message"("tenant_id", "conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "integration_event_provider_event_type_idx" ON "integration_event"("provider", "event_type");

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_event" ADD CONSTRAINT "integration_event_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────── migrations/0006_itinerary ───────────────
-- CreateEnum
CREATE TYPE "ItinerarySource" AS ENUM ('imported', 'built');

-- CreateTable
CREATE TABLE "itinerary" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "external_id" TEXT,
    "title" TEXT NOT NULL,
    "destination" TEXT,
    "duration_days" INTEGER,
    "current_version_id" UUID,
    "source" "ItinerarySource" NOT NULL DEFAULT 'imported',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_version" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "itinerary_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "external_version_ref" TEXT,
    "pdf_file_id" UUID,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "itinerary_tenant_id_lead_id_idx" ON "itinerary"("tenant_id", "lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_version_itinerary_id_version_no_key" ON "itinerary_version"("itinerary_id", "version_no");

-- AddForeignKey
ALTER TABLE "itinerary" ADD CONSTRAINT "itinerary_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary" ADD CONSTRAINT "itinerary_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_version" ADD CONSTRAINT "itinerary_version_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_version" ADD CONSTRAINT "itinerary_version_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────── migrations/0007_operations ───────────────
-- CreateEnum
CREATE TYPE "OpsStage" AS ENUM ('confirmed', 'hotel_procurement', 'transport_procurement', 'voucher_generation', 'final_itinerary', 'delivered', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "OperationTaskStatus" AS ENUM ('pending', 'in_progress', 'blocked', 'done');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('hotel', 'transport', 'activity', 'other');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('active', 'inactive', 'blacklisted');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('taxi', 'tempo_traveller', 'coach', 'other');

-- CreateEnum
CREATE TYPE "HotelBookingStatus" AS ENUM ('requested', 'quoted', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "TransportBookingStatus" AS ENUM ('requested', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('customer', 'hotel', 'transport', 'vendor');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('draft', 'generated', 'sent', 'void');

-- CreateEnum
CREATE TYPE "CallProvider" AS ENUM ('exotel', 'knowlarity', 'manual');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('ringing', 'answered', 'missed', 'busy', 'failed', 'completed');

-- CreateTable
CREATE TABLE "booking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "quotation_id" UUID,
    "reference_code" TEXT NOT NULL,
    "destination" TEXT,
    "travel_start" DATE,
    "travel_end" DATE,
    "pax_adults" INTEGER NOT NULL DEFAULT 1,
    "pax_children" INTEGER NOT NULL DEFAULT 0,
    "total_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "ops_stage" "OpsStage" NOT NULL DEFAULT 'confirmed',
    "ops_owner_user_id" UUID,
    "handover_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_task" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "stage" "OpsStage" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "OperationTaskStatus" NOT NULL DEFAULT 'pending',
    "assignee_user_id" UUID,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "type" "VendorType" NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'active',
    "rating" DECIMAL(2,1),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_rate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,
    "contract_rate" DECIMAL(14,2),
    "negotiated_rate" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "valid_from" DATE,
    "valid_to" DATE,
    "season" TEXT,
    "notes" TEXT,

    CONSTRAINT "vendor_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_booking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "vendor_id" UUID,
    "hotel_name" TEXT NOT NULL,
    "room_type" TEXT,
    "check_in" DATE,
    "check_out" DATE,
    "rooms" INTEGER NOT NULL DEFAULT 1,
    "nights" INTEGER NOT NULL DEFAULT 1,
    "rate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "HotelBookingStatus" NOT NULL DEFAULT 'requested',
    "confirmation_no" TEXT,
    "voucher_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_booking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "vendor_id" UUID,
    "vehicle_type" "VehicleType" NOT NULL,
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "pickup" TEXT,
    "drop" TEXT,
    "service_date" DATE,
    "rate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "TransportBookingStatus" NOT NULL DEFAULT 'requested',
    "voucher_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_communication" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "booking_id" UUID,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "ref_external_id" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "type" "VoucherType" NOT NULL,
    "reference_code" TEXT NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'draft',
    "pdf_file_id" UUID,
    "issued_to" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "generated_at" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "provider" "CallProvider" NOT NULL DEFAULT 'manual',
    "direction" "CallDirection" NOT NULL,
    "from_number" TEXT,
    "to_number" TEXT,
    "agent_user_id" UUID,
    "status" "CallStatus" NOT NULL DEFAULT 'completed',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "duration_sec" INTEGER NOT NULL DEFAULT 0,
    "recording_file_id" UUID,
    "transcription" TEXT,
    "summary" TEXT,
    "external_call_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_tenant_id_ops_stage_idx" ON "booking"("tenant_id", "ops_stage");

-- CreateIndex
CREATE UNIQUE INDEX "booking_tenant_id_reference_code_key" ON "booking"("tenant_id", "reference_code");

-- CreateIndex
CREATE INDEX "operation_task_tenant_id_booking_id_idx" ON "operation_task"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "vendor_tenant_id_type_idx" ON "vendor"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "vendor_rate_tenant_id_vendor_id_idx" ON "vendor_rate"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "hotel_booking_tenant_id_booking_id_idx" ON "hotel_booking"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "transport_booking_tenant_id_booking_id_idx" ON "transport_booking"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "vendor_communication_tenant_id_vendor_id_idx" ON "vendor_communication"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "voucher_tenant_id_booking_id_idx" ON "voucher"("tenant_id", "booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_tenant_id_reference_code_key" ON "voucher"("tenant_id", "reference_code");

-- CreateIndex
CREATE INDEX "call_tenant_id_lead_id_idx" ON "call"("tenant_id", "lead_id");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_task" ADD CONSTRAINT "operation_task_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_task" ADD CONSTRAINT "operation_task_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_rate" ADD CONSTRAINT "vendor_rate_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_rate" ADD CONSTRAINT "vendor_rate_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_booking" ADD CONSTRAINT "hotel_booking_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_booking" ADD CONSTRAINT "hotel_booking_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_booking" ADD CONSTRAINT "hotel_booking_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_booking" ADD CONSTRAINT "transport_booking_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_booking" ADD CONSTRAINT "transport_booking_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_booking" ADD CONSTRAINT "transport_booking_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_communication" ADD CONSTRAINT "vendor_communication_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_communication" ADD CONSTRAINT "vendor_communication_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_communication" ADD CONSTRAINT "vendor_communication_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call" ADD CONSTRAINT "call_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call" ADD CONSTRAINT "call_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ─────────────── migrations/0008_payments_portal ───────────────
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('advance', 'partial', 'final');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'partial', 'paid', 'refunded', 'cancelled', 'failed');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('razorpay', 'cashfree', 'manual', 'bank_transfer', 'cash');

-- CreateEnum
CREATE TYPE "PortalResourceType" AS ENUM ('quotation', 'itinerary', 'invoice', 'voucher', 'payment');

-- CreateTable
CREATE TABLE "invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "due_date" DATE,
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "pdf_file_id" UUID,
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "invoice_id" UUID,
    "type" "PaymentType" NOT NULL DEFAULT 'advance',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "gateway" "PaymentGateway" NOT NULL DEFAULT 'manual',
    "gateway_order_id" TEXT,
    "gateway_payment_id" TEXT,
    "method" TEXT,
    "paid_at" TIMESTAMP(3),
    "receipt_file_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID,
    "gateway" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "signature_valid" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "payment_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'received',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_identity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "phone" TEXT NOT NULL,
    "email" CITEXT,
    "last_login_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_access_grant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "portal_identity_id" UUID NOT NULL,
    "resource_type" "PortalResourceType" NOT NULL,
    "resource_id" UUID NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_download" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_access_grant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_tenant_id_booking_id_idx" ON "invoice"("tenant_id", "booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_tenant_id_invoice_no_key" ON "invoice"("tenant_id", "invoice_no");

-- CreateIndex
CREATE INDEX "payment_tenant_id_booking_id_idx" ON "payment"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "payment_tenant_id_status_idx" ON "payment"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_gateway_payment_id_key" ON "payment"("gateway", "gateway_payment_id");

-- CreateIndex
CREATE INDEX "payment_webhook_gateway_event_type_idx" ON "payment_webhook"("gateway", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "portal_identity_tenant_id_phone_key" ON "portal_identity"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "portal_access_grant_tenant_id_portal_identity_id_idx" ON "portal_access_grant"("tenant_id", "portal_identity_id");

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhook" ADD CONSTRAINT "payment_webhook_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_identity" ADD CONSTRAINT "portal_identity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_access_grant" ADD CONSTRAINT "portal_access_grant_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_access_grant" ADD CONSTRAINT "portal_access_grant_portal_identity_id_fkey" FOREIGN KEY ("portal_identity_id") REFERENCES "portal_identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────── Row-Level Security policies (rls.sql) ───────────────
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
