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

