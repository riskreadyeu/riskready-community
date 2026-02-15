/*
  Warnings:

  - You are about to drop the column `evidenceLocation` on the `CapabilityAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `testDate` on the `CapabilityAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `testNotes` on the `CapabilityAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `testResult` on the `CapabilityAssessment` table. All the data in the column will be lost.
  - You are about to drop the column `tester` on the `CapabilityAssessment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EffectivenessTestType" AS ENUM ('DESIGN', 'IMPLEMENTATION', 'OPERATING');

-- DropIndex
DROP INDEX "CapabilityAssessment_testResult_idx";

-- AlterTable
ALTER TABLE "CapabilityAssessment" DROP COLUMN "evidenceLocation",
DROP COLUMN "testDate",
DROP COLUMN "testNotes",
DROP COLUMN "testResult",
DROP COLUMN "tester";

-- CreateTable
CREATE TABLE "CapabilityEffectivenessTest" (
    "id" TEXT NOT NULL,
    "testType" "EffectivenessTestType" NOT NULL,
    "testResult" "TestResult" NOT NULL DEFAULT 'NOT_TESTED',
    "testDate" TIMESTAMP(3),
    "tester" TEXT,
    "testCriteria" TEXT,
    "evidenceRequired" TEXT,
    "evidenceLocation" TEXT,
    "evidenceNotes" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "capabilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "CapabilityEffectivenessTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CapabilityEffectivenessTest_testType_idx" ON "CapabilityEffectivenessTest"("testType");

-- CreateIndex
CREATE INDEX "CapabilityEffectivenessTest_testResult_idx" ON "CapabilityEffectivenessTest"("testResult");

-- CreateIndex
CREATE INDEX "CapabilityEffectivenessTest_capabilityId_idx" ON "CapabilityEffectivenessTest"("capabilityId");

-- CreateIndex
CREATE INDEX "CapabilityEffectivenessTest_testDate_idx" ON "CapabilityEffectivenessTest"("testDate");

-- AddForeignKey
ALTER TABLE "CapabilityEffectivenessTest" ADD CONSTRAINT "CapabilityEffectivenessTest_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityEffectivenessTest" ADD CONSTRAINT "CapabilityEffectivenessTest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityEffectivenessTest" ADD CONSTRAINT "CapabilityEffectivenessTest_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
