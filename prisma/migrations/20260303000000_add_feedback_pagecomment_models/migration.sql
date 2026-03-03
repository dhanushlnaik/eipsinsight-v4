-- CreateEnum
CREATE TYPE "feedback_status" AS ENUM ('new', 'in-review', 'resolved');

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "page_path" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "user_id" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_comment" (
    "id" TEXT NOT NULL,
    "page_path" TEXT NOT NULL,
    "parent_id" TEXT,
    "user_id" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "page_comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_feedback_page_path" ON "feedback"("page_path");

-- CreateIndex
CREATE INDEX "idx_feedback_status" ON "feedback"("status");

-- CreateIndex
CREATE INDEX "idx_feedback_created_at" ON "feedback"("created_at");

-- CreateIndex
CREATE INDEX "idx_page_comment_page_path" ON "page_comment"("page_path");

-- CreateIndex
CREATE INDEX "idx_page_comment_parent_id" ON "page_comment"("parent_id");

-- CreateIndex
CREATE INDEX "idx_page_comment_created_at" ON "page_comment"("created_at");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_comment" ADD CONSTRAINT "page_comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "page_comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_comment" ADD CONSTRAINT "page_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
