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

