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

