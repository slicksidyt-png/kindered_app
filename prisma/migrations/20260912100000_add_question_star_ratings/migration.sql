-- AlterTable
ALTER TABLE "questions"
ADD COLUMN "applicable_star_ratings" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];