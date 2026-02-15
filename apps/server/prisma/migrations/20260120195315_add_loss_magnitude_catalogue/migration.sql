-- ============================================
-- Loss Magnitude Catalogue Migration
-- For FAIR Monte Carlo simulations
-- ============================================

-- Create SizeTier enum
CREATE TYPE "SizeTier" AS ENUM ('SMB', 'MID_MARKET', 'ENTERPRISE');

-- Create LossMagnitudeCatalog table
CREATE TABLE "LossMagnitudeCatalog" (
    "id" TEXT NOT NULL,
    "threatId" TEXT NOT NULL,
    "sizeTier" "SizeTier" NOT NULL,
    "primaryLossMin" DECIMAL(15,2) NOT NULL,
    "primaryLossMode" DECIMAL(15,2) NOT NULL,
    "primaryLossMax" DECIMAL(15,2) NOT NULL,
    "secondaryLossMin" DECIMAL(15,2) NOT NULL,
    "secondaryLossMode" DECIMAL(15,2) NOT NULL,
    "secondaryLossMax" DECIMAL(15,2) NOT NULL,
    "secondaryLossProbability" DECIMAL(3,2) NOT NULL DEFAULT 0.30,
    "source" TEXT NOT NULL DEFAULT 'IBM Cost of Data Breach 2025',
    "notes" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LossMagnitudeCatalog_pkey" PRIMARY KEY ("id")
);

-- Create IndustryMultiplier table
CREATE TABLE "IndustryMultiplier" (
    "id" TEXT NOT NULL,
    "industryCode" TEXT NOT NULL,
    "industryName" TEXT NOT NULL,
    "multiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    "source" TEXT NOT NULL DEFAULT 'IBM Cost of Data Breach 2025',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryMultiplier_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for LossMagnitudeCatalog
CREATE UNIQUE INDEX "LossMagnitudeCatalog_threatId_sizeTier_key" ON "LossMagnitudeCatalog"("threatId", "sizeTier");

-- Create indexes for LossMagnitudeCatalog
CREATE INDEX "LossMagnitudeCatalog_threatId_idx" ON "LossMagnitudeCatalog"("threatId");
CREATE INDEX "LossMagnitudeCatalog_sizeTier_idx" ON "LossMagnitudeCatalog"("sizeTier");

-- Create unique constraint for IndustryMultiplier
CREATE UNIQUE INDEX "IndustryMultiplier_industryCode_key" ON "IndustryMultiplier"("industryCode");
