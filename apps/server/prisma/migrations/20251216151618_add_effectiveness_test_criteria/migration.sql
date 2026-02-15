-- AlterTable
ALTER TABLE "Capability" ADD COLUMN     "designEvidenceRequired" TEXT,
ADD COLUMN     "designTestCriteria" TEXT,
ADD COLUMN     "implementationEvidenceRequired" TEXT,
ADD COLUMN     "implementationTestCriteria" TEXT,
ADD COLUMN     "operatingEvidenceRequired" TEXT,
ADD COLUMN     "operatingTestCriteria" TEXT;
