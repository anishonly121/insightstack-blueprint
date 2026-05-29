-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "shared" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Insight_shared_idx" ON "Insight"("shared");
