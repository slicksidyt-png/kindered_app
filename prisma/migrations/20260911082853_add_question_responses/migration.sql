-- CreateTable
CREATE TABLE "question_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "question_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_responses_question_id_idx" ON "question_responses"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_responses_session_id_question_id_key" ON "question_responses"("session_id", "question_id");

-- AddForeignKey
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
