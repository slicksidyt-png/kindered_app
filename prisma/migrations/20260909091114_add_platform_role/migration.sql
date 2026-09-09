-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "platform_role" "PlatformRole";

ALTER TABLE "feedback_submissions"
ADD CONSTRAINT "feedback_submissions_rating_check"
CHECK ("rating" >= 1 AND "rating" <= 5);

CREATE UNIQUE INDEX "business_google_destinations_one_current_per_business"
ON "business_google_destinations" ("business_id")
WHERE "is_current" = true;

CREATE UNIQUE INDEX "qr_code_assignments_one_open_per_qr_code"
ON "qr_code_assignments" ("qr_code_id")
WHERE "unassigned_at" IS NULL;
