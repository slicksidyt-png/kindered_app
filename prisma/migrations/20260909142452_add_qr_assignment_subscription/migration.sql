-- AlterTable
ALTER TABLE "qr_code_assignments" ADD COLUMN     "subscription_ends_at" TIMESTAMPTZ(6),
ADD COLUMN     "subscription_starts_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "qr_code_assignments_business_id_subscription_ends_at_idx" ON "qr_code_assignments"("business_id", "subscription_ends_at");
