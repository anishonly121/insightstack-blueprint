-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "cacheKey" TEXT;

-- CreateIndex
CREATE INDEX "Insight_datasetId_cacheKey_createdAt_idx" ON "Insight"("datasetId", "cacheKey", "createdAt");
