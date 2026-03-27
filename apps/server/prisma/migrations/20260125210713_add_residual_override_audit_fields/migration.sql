-- Add override audit trail fields to RiskScenario
ALTER TABLE "RiskScenario" ADD COLUMN IF NOT EXISTS "residualOverriddenById" TEXT;
ALTER TABLE "RiskScenario" ADD COLUMN IF NOT EXISTS "residualOverriddenAt" TIMESTAMP(3);
ALTER TABLE "RiskScenario" ADD COLUMN IF NOT EXISTS "residualPreviousScore" INTEGER;

-- Add foreign key constraint for residualOverriddenBy
ALTER TABLE "RiskScenario" ADD CONSTRAINT "RiskScenario_residualOverriddenById_fkey"
    FOREIGN KEY ("residualOverriddenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS "RiskScenario_residualOverriddenById_idx" ON "RiskScenario"("residualOverriddenById");
