-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'invited', 'disabled');

-- CreateEnum
CREATE TYPE "BusinessRole" AS ENUM ('owner', 'admin', 'manager', 'viewer');

-- CreateEnum
CREATE TYPE "QrStatus" AS ENUM ('active', 'inactive', 'retired');

-- CreateEnum
CREATE TYPE "QrScanOutcome" AS ENUM ('accepted', 'inactive', 'unassigned', 'not_found');

-- CreateEnum
CREATE TYPE "ReviewSessionStatus" AS ENUM ('started', 'feedback_submitted', 'google_clicked', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "PrivateFeedbackStatus" AS ENUM ('new', 'in_progress', 'resolved', 'archived');

-- CreateEnum
CREATE TYPE "ReviewDraftKind" AS ENUM ('ai_generated', 'manual');

-- CreateEnum
CREATE TYPE "ReviewLanguage" AS ENUM ('English', 'Hindi', 'Marathi', 'Minglish', 'Hinglish');

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "location" VARCHAR(255),
    "initial" VARCHAR(4),
    "status" "BusinessStatus" NOT NULL DEFAULT 'active',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(320) NOT NULL,
    "name" VARCHAR(160),
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "BusinessRole" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "business_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_google_destinations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "review_url" TEXT NOT NULL,
    "label" VARCHAR(100),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retired_at" TIMESTAMPTZ(6),

    CONSTRAINT "business_google_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "public_code" VARCHAR(40) NOT NULL,
    "business_id" UUID,
    "label" VARCHAR(120),
    "dynamic_url" TEXT NOT NULL,
    "status" "QrStatus" NOT NULL DEFAULT 'inactive',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "activated_at" TIMESTAMPTZ(6),
    "deactivated_at" TIMESTAMPTZ(6),

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_code_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "qr_code_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "assigned_by_user_id" UUID,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_code_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_scans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "qr_code_id" UUID NOT NULL,
    "business_id" UUID,
    "outcome" "QrScanOutcome" NOT NULL,
    "scanned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_hash" VARCHAR(128),
    "referrer" TEXT,
    "country_code" VARCHAR(2),
    "session_id" UUID,

    CONSTRAINT "qr_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "qr_scan_id" UUID NOT NULL,
    "qr_code_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "google_destination_id" UUID,
    "language" "ReviewLanguage" NOT NULL DEFAULT 'English',
    "status" "ReviewSessionStatus" NOT NULL DEFAULT 'started',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "comment" TEXT,
    "highlight" TEXT,
    "moment" TEXT,
    "recommendation_text" TEXT,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "feedback_submission_id" UUID,
    "kind" "ReviewDraftKind" NOT NULL,
    "content" TEXT NOT NULL,
    "language" "ReviewLanguage" NOT NULL,
    "model_name" VARCHAR(100),
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selected_at" TIMESTAMPTZ(6),

    CONSTRAINT "review_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "feedback_submission_id" UUID,
    "business_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "customer_name" VARCHAR(160),
    "customer_contact" VARCHAR(320),
    "status" "PrivateFeedbackStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by_user_id" UUID,

    CONSTRAINT "private_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_review_clicks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "qr_code_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "destination_id" UUID,
    "clicked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "draft_id" UUID,

    CONSTRAINT "google_review_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "business_memberships_business_id_role_idx" ON "business_memberships"("business_id", "role");

-- CreateIndex
CREATE INDEX "business_memberships_user_id_idx" ON "business_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_memberships_business_id_user_id_key" ON "business_memberships"("business_id", "user_id");

-- CreateIndex
CREATE INDEX "business_google_destinations_business_id_is_current_idx" ON "business_google_destinations"("business_id", "is_current");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_public_code_key" ON "qr_codes"("public_code");

-- CreateIndex
CREATE INDEX "qr_codes_business_id_status_idx" ON "qr_codes"("business_id", "status");

-- CreateIndex
CREATE INDEX "qr_codes_status_idx" ON "qr_codes"("status");

-- CreateIndex
CREATE INDEX "qr_code_assignments_qr_code_id_assigned_at_idx" ON "qr_code_assignments"("qr_code_id", "assigned_at");

-- CreateIndex
CREATE INDEX "qr_code_assignments_business_id_assigned_at_idx" ON "qr_code_assignments"("business_id", "assigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "qr_scans_session_id_key" ON "qr_scans"("session_id");

-- CreateIndex
CREATE INDEX "qr_scans_qr_code_id_scanned_at_idx" ON "qr_scans"("qr_code_id", "scanned_at");

-- CreateIndex
CREATE INDEX "qr_scans_business_id_scanned_at_idx" ON "qr_scans"("business_id", "scanned_at");

-- CreateIndex
CREATE INDEX "qr_scans_outcome_scanned_at_idx" ON "qr_scans"("outcome", "scanned_at");

-- CreateIndex
CREATE INDEX "qr_scans_scanned_at_idx" ON "qr_scans"("scanned_at");

-- CreateIndex
CREATE UNIQUE INDEX "review_sessions_qr_scan_id_key" ON "review_sessions"("qr_scan_id");

-- CreateIndex
CREATE INDEX "review_sessions_business_id_started_at_idx" ON "review_sessions"("business_id", "started_at");

-- CreateIndex
CREATE INDEX "review_sessions_qr_code_id_started_at_idx" ON "review_sessions"("qr_code_id", "started_at");

-- CreateIndex
CREATE INDEX "review_sessions_status_started_at_idx" ON "review_sessions"("status", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_submissions_session_id_key" ON "feedback_submissions"("session_id");

-- CreateIndex
CREATE INDEX "feedback_submissions_business_id_submitted_at_idx" ON "feedback_submissions"("business_id", "submitted_at");

-- CreateIndex
CREATE INDEX "feedback_submissions_business_id_rating_idx" ON "feedback_submissions"("business_id", "rating");

-- CreateIndex
CREATE INDEX "feedback_submissions_rating_submitted_at_idx" ON "feedback_submissions"("rating", "submitted_at");

-- CreateIndex
CREATE INDEX "review_drafts_session_id_created_at_idx" ON "review_drafts"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "review_drafts_feedback_submission_id_idx" ON "review_drafts"("feedback_submission_id");

-- CreateIndex
CREATE INDEX "review_drafts_is_selected_idx" ON "review_drafts"("is_selected");

-- CreateIndex
CREATE UNIQUE INDEX "private_feedback_session_id_key" ON "private_feedback"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "private_feedback_feedback_submission_id_key" ON "private_feedback"("feedback_submission_id");

-- CreateIndex
CREATE INDEX "private_feedback_business_id_status_created_at_idx" ON "private_feedback"("business_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "private_feedback_status_created_at_idx" ON "private_feedback"("status", "created_at");

-- CreateIndex
CREATE INDEX "google_review_clicks_business_id_clicked_at_idx" ON "google_review_clicks"("business_id", "clicked_at");

-- CreateIndex
CREATE INDEX "google_review_clicks_qr_code_id_clicked_at_idx" ON "google_review_clicks"("qr_code_id", "clicked_at");

-- CreateIndex
CREATE INDEX "google_review_clicks_clicked_at_idx" ON "google_review_clicks"("clicked_at");

-- AddForeignKey
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_google_destinations" ADD CONSTRAINT "business_google_destinations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_google_destinations" ADD CONSTRAINT "business_google_destinations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_code_assignments" ADD CONSTRAINT "qr_code_assignments_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_code_assignments" ADD CONSTRAINT "qr_code_assignments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_code_assignments" ADD CONSTRAINT "qr_code_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scans" ADD CONSTRAINT "qr_scans_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scans" ADD CONSTRAINT "qr_scans_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scans" ADD CONSTRAINT "qr_scans_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_google_destination_id_fkey" FOREIGN KEY ("google_destination_id") REFERENCES "business_google_destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_drafts" ADD CONSTRAINT "review_drafts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_drafts" ADD CONSTRAINT "review_drafts_feedback_submission_id_fkey" FOREIGN KEY ("feedback_submission_id") REFERENCES "feedback_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_feedback" ADD CONSTRAINT "private_feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_feedback" ADD CONSTRAINT "private_feedback_feedback_submission_id_fkey" FOREIGN KEY ("feedback_submission_id") REFERENCES "feedback_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_feedback" ADD CONSTRAINT "private_feedback_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_feedback" ADD CONSTRAINT "private_feedback_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_review_clicks" ADD CONSTRAINT "google_review_clicks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_review_clicks" ADD CONSTRAINT "google_review_clicks_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "qr_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_review_clicks" ADD CONSTRAINT "google_review_clicks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_review_clicks" ADD CONSTRAINT "google_review_clicks_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "business_google_destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_review_clicks" ADD CONSTRAINT "google_review_clicks_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "review_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
