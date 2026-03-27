-- Add missing schema elements to fix TypeScript errors

-- 1. Add ACTIVE to RTSStatus enum (safe - IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ACTIVE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'RTSStatus')) THEN
        ALTER TYPE "RTSStatus" ADD VALUE 'ACTIVE' AFTER 'APPROVED';
    END IF;
END $$;

-- 2. Add missing fields to RiskToleranceStatement
ALTER TABLE "RiskToleranceStatement" ADD COLUMN IF NOT EXISTS "appetiteLevel" TEXT;
ALTER TABLE "RiskToleranceStatement" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "RiskToleranceStatement" ADD COLUMN IF NOT EXISTS "toleranceThreshold" INTEGER;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "RiskToleranceStatement_appetiteLevel_idx" ON "RiskToleranceStatement"("appetiteLevel");
CREATE INDEX IF NOT EXISTS "RiskToleranceStatement_category_idx" ON "RiskToleranceStatement"("category");

-- 3. Create OrganisationSelectedAppetite table (only if not exists)
CREATE TABLE IF NOT EXISTS "OrganisationSelectedAppetite" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "selectedLevel" TEXT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectedById" TEXT,
    "previousLevel" TEXT,
    "previousChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationSelectedAppetite_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on organisationId (drop first if exists, then create)
DROP INDEX IF EXISTS "OrganisationSelectedAppetite_organisationId_key";
CREATE UNIQUE INDEX "OrganisationSelectedAppetite_organisationId_key" ON "OrganisationSelectedAppetite"("organisationId");

-- Create indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "OrganisationSelectedAppetite_organisationId_idx" ON "OrganisationSelectedAppetite"("organisationId");
CREATE INDEX IF NOT EXISTS "OrganisationSelectedAppetite_selectedLevel_idx" ON "OrganisationSelectedAppetite"("selectedLevel");

-- Add foreign key constraints (drop first if exist, then create)
ALTER TABLE "OrganisationSelectedAppetite" DROP CONSTRAINT IF EXISTS "OrganisationSelectedAppetite_organisationId_fkey";
ALTER TABLE "OrganisationSelectedAppetite" ADD CONSTRAINT "OrganisationSelectedAppetite_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "OrganisationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganisationSelectedAppetite" DROP CONSTRAINT IF EXISTS "OrganisationSelectedAppetite_selectedById_fkey";
ALTER TABLE "OrganisationSelectedAppetite" ADD CONSTRAINT "OrganisationSelectedAppetite_selectedById_fkey"
    FOREIGN KEY ("selectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
