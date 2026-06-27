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

