-- CreateEnum
CREATE TYPE "QuestionScope" AS ENUM ('GLOBAL', 'INDUSTRY', 'SUBCATEGORY', 'BUSINESS');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO', 'RATING', 'STAR_RATING', 'TEXT', 'NUMBER', 'SCALE');

-- CreateEnum
CREATE TYPE "KnowledgeBaseType" AS ENUM ('BUSINESS_INFORMATION', 'SERVICES', 'PRODUCTS', 'PRICING', 'FAQ', 'POLICIES', 'OPENING_HOURS', 'STAFF', 'CONTACT_INFORMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionDurationType" AS ENUM ('DAY', 'MONTH');

-- CreateEnum
CREATE TYPE "SubscriptionKind" AS ENUM ('TRIAL', 'PAID');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL_ACTIVE', 'TRIAL_EXPIRED', 'SUBSCRIPTION_ACTIVE', 'SUBSCRIPTION_EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "industry_id" UUID,
ADD COLUMN     "subcategory_id" UUID;

-- CreateTable
CREATE TABLE "industries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "industry_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT NOT NULL,
    "scope" "QuestionScope" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "industry_id" UUID,
    "subcategory_id" UUID,
    "business_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "label" VARCHAR(180) NOT NULL,
    "value" VARCHAR(180) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_keywords" (
    "question_id" UUID NOT NULL,
    "keyword_id" UUID NOT NULL,

    CONSTRAINT "question_keywords_pkey" PRIMARY KEY ("question_id","keyword_id")
);

-- CreateTable
CREATE TABLE "knowledge_base_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "KnowledgeBaseType" NOT NULL DEFAULT 'OTHER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "knowledge_base_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "duration_type" "SubscriptionDurationType" NOT NULL,
    "duration_value" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "plan_id" UUID,
    "kind" "SubscriptionKind" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "business_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_qr" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "public_token" VARCHAR(60) NOT NULL,
    "label" VARCHAR(120),
    "dynamic_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "super_qr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_qr_scans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "super_qr_id" UUID NOT NULL,
    "scanned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_hash" VARCHAR(128),

    CONSTRAINT "super_qr_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "industries_name_key" ON "industries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industries_slug_key" ON "industries"("slug");

-- CreateIndex
CREATE INDEX "industries_is_active_idx" ON "industries"("is_active");

-- CreateIndex
CREATE INDEX "subcategories_industry_id_is_active_idx" ON "subcategories"("industry_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_industry_id_name_key" ON "subcategories"("industry_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_industry_id_slug_key" ON "subcategories"("industry_id", "slug");

-- CreateIndex
CREATE INDEX "questions_scope_is_active_display_order_idx" ON "questions"("scope", "is_active", "display_order");

-- CreateIndex
CREATE INDEX "questions_industry_id_is_active_idx" ON "questions"("industry_id", "is_active");

-- CreateIndex
CREATE INDEX "questions_subcategory_id_is_active_idx" ON "questions"("subcategory_id", "is_active");

-- CreateIndex
CREATE INDEX "questions_business_id_is_active_idx" ON "questions"("business_id", "is_active");

-- CreateIndex
CREATE INDEX "question_options_question_id_display_order_idx" ON "question_options"("question_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_value_key" ON "question_options"("question_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_value_key" ON "keywords"("value");

-- CreateIndex
CREATE INDEX "question_keywords_keyword_id_idx" ON "question_keywords"("keyword_id");

-- CreateIndex
CREATE INDEX "knowledge_base_entries_business_id_is_active_idx" ON "knowledge_base_entries"("business_id", "is_active");

-- CreateIndex
CREATE INDEX "knowledge_base_entries_business_id_type_idx" ON "knowledge_base_entries"("business_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE INDEX "subscription_plans_is_active_idx" ON "subscription_plans"("is_active");

-- CreateIndex
CREATE INDEX "business_subscriptions_business_id_start_date_end_date_idx" ON "business_subscriptions"("business_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "business_subscriptions_status_end_date_idx" ON "business_subscriptions"("status", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "super_qr_public_token_key" ON "super_qr"("public_token");

-- CreateIndex
CREATE INDEX "super_qr_scans_super_qr_id_scanned_at_idx" ON "super_qr_scans"("super_qr_id", "scanned_at");

-- CreateIndex
CREATE INDEX "businesses_industry_id_idx" ON "businesses"("industry_id");

-- CreateIndex
CREATE INDEX "businesses_subcategory_id_idx" ON "businesses"("subcategory_id");

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_keywords" ADD CONSTRAINT "question_keywords_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_keywords" ADD CONSTRAINT "question_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_entries" ADD CONSTRAINT "knowledge_base_entries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "super_qr_scans" ADD CONSTRAINT "super_qr_scans_super_qr_id_fkey" FOREIGN KEY ("super_qr_id") REFERENCES "super_qr"("id") ON DELETE CASCADE ON UPDATE CASCADE;
