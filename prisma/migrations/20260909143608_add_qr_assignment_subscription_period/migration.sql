/*
  Warnings:

  - You are about to drop the column `subscription_ends_at` on the `qr_code_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_starts_at` on the `qr_code_assignments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "qr_code_assignments_business_id_subscription_ends_at_idx";

-- AlterTable
ALTER TABLE "qr_code_assignments" DROP COLUMN "subscription_ends_at",
DROP COLUMN "subscription_starts_at",
ADD COLUMN     "subscription_end_at" TIMESTAMPTZ(6),
ADD COLUMN     "subscription_start_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "qr_code_assignments_business_id_subscription_end_at_idx" ON "qr_code_assignments"("business_id", "subscription_end_at");
