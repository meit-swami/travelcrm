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

