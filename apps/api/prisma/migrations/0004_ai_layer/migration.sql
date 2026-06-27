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

