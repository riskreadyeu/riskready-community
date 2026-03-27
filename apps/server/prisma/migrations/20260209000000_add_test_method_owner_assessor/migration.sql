-- CreateEnum
CREATE TYPE "TestMethod" AS ENUM ('MANUAL', 'SELF_ASSESSMENT', 'AUTOMATED');

-- AlterTable
ALTER TABLE "AssessmentTest" ADD COLUMN "testMethod" "TestMethod",
ADD COLUMN "ownerId" TEXT,
ADD COLUMN "assessorId" TEXT;

-- CreateIndex
CREATE INDEX "AssessmentTest_ownerId_idx" ON "AssessmentTest"("ownerId");

-- CreateIndex
CREATE INDEX "AssessmentTest_assessorId_idx" ON "AssessmentTest"("assessorId");

-- AddForeignKey
ALTER TABLE "AssessmentTest" ADD CONSTRAINT "AssessmentTest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentTest" ADD CONSTRAINT "AssessmentTest_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
