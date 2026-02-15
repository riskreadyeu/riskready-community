-- Add missing LayerTest columns (root cause analysis) - safe to run if columns already exist

-- Create enums if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RootCauseCategory') THEN
    CREATE TYPE "RootCauseCategory" AS ENUM ('PEOPLE', 'PROCESS', 'TECHNOLOGY', 'BUDGET', 'THIRD_PARTY', 'DESIGN', 'UNKNOWN');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RemediationEffort') THEN
    CREATE TYPE "RemediationEffort" AS ENUM ('TRIVIAL', 'MINOR', 'MODERATE', 'MAJOR', 'STRATEGIC');
  END IF;
END $$;

-- Add columns to LayerTest if they don't exist
ALTER TABLE "LayerTest" ADD COLUMN IF NOT EXISTS "rootCause" "RootCauseCategory";
ALTER TABLE "LayerTest" ADD COLUMN IF NOT EXISTS "rootCauseNotes" TEXT;
ALTER TABLE "LayerTest" ADD COLUMN IF NOT EXISTS "remediationEffort" "RemediationEffort";
ALTER TABLE "LayerTest" ADD COLUMN IF NOT EXISTS "estimatedHours" INTEGER;
ALTER TABLE "LayerTest" ADD COLUMN IF NOT EXISTS "estimatedCost" DECIMAL(10,2);
