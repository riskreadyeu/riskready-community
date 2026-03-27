-- SimplifyRiskMethodology
-- Remove F1-F6 likelihood factors, I1-I5 BIRT impact dimensions,
-- FAIR quantitative fields, and ScenarioImpactAssessment model.
-- Replace with simple 5x5 risk matrix: likelihood (1-5) x impact (1-5) = score (1-25).

-- DropForeignKey
ALTER TABLE "RiskScenario" DROP CONSTRAINT "RiskScenario_lastCalculatedById_fkey";

-- DropForeignKey
ALTER TABLE "ScenarioImpactAssessment" DROP CONSTRAINT "ScenarioImpactAssessment_scenarioId_fkey";

-- DropIndex
DROP INDEX "RiskScenario_calculationTrigger_idx";

-- DropIndex
DROP INDEX "RiskScenario_f1Override_f2Override_f3Override_idx";

-- DropIndex
DROP INDEX "RiskScenario_lastCalculatedAt_idx";

-- AlterTable
ALTER TABLE "RiskCalculationHistory" DROP COLUMN "f1ThreatFrequency",
DROP COLUMN "f2ControlEffectiveness",
DROP COLUMN "f3GapVulnerability",
DROP COLUMN "f4IncidentHistory",
DROP COLUMN "f5AttackSurface",
DROP COLUMN "f6Environmental",
DROP COLUMN "i1Financial",
DROP COLUMN "i2Operational",
DROP COLUMN "i3Regulatory",
DROP COLUMN "i4Reputational",
DROP COLUMN "i5Strategic";

-- AlterTable
ALTER TABLE "RiskScenario" DROP COLUMN "ale",
DROP COLUMN "aleMean",
DROP COLUMN "aleMedian",
DROP COLUMN "aleP90",
DROP COLUMN "aleP95",
DROP COLUMN "aleP99",
DROP COLUMN "aro",
DROP COLUMN "calculatedImpact",
DROP COLUMN "calculatedLikelihood",
DROP COLUMN "calculationTrace",
DROP COLUMN "calculationTrigger",
DROP COLUMN "f1Override",
DROP COLUMN "f1OverrideJustification",
DROP COLUMN "f1Source",
DROP COLUMN "f1ThreatFrequency",
DROP COLUMN "f2ControlEffectiveness",
DROP COLUMN "f2Override",
DROP COLUMN "f2OverrideJustification",
DROP COLUMN "f2Source",
DROP COLUMN "f3GapVulnerability",
DROP COLUMN "f3Override",
DROP COLUMN "f3OverrideJustification",
DROP COLUMN "f3Source",
DROP COLUMN "f4IncidentHistory",
DROP COLUMN "f4Override",
DROP COLUMN "f4OverrideJustification",
DROP COLUMN "f4Source",
DROP COLUMN "f5AttackSurface",
DROP COLUMN "f5Override",
DROP COLUMN "f5OverrideJustification",
DROP COLUMN "f5Source",
DROP COLUMN "f6Environmental",
DROP COLUMN "f6Override",
DROP COLUMN "f6OverrideJustification",
DROP COLUMN "f6Source",
DROP COLUMN "fairVulnerability",
DROP COLUMN "i1Breakdown",
DROP COLUMN "i1Financial",
DROP COLUMN "i2Breakdown",
DROP COLUMN "i2Operational",
DROP COLUMN "i3Breakdown",
DROP COLUMN "i3Regulatory",
DROP COLUMN "i4Breakdown",
DROP COLUMN "i4Reputational",
DROP COLUMN "i5Breakdown",
DROP COLUMN "i5Strategic",
DROP COLUMN "lastCalculatedAt",
DROP COLUMN "lastCalculatedById",
DROP COLUMN "lastSimulationAt",
DROP COLUMN "lefMean",
DROP COLUMN "primaryLossMax",
DROP COLUMN "primaryLossMin",
DROP COLUMN "primaryLossMode",
DROP COLUMN "probabilityOfLoss",
DROP COLUMN "quantitativeMode",
DROP COLUMN "residualWeightedImpact",
DROP COLUMN "secondaryLossMax",
DROP COLUMN "secondaryLossMin",
DROP COLUMN "secondaryLossMode",
DROP COLUMN "secondaryLossProbability",
DROP COLUMN "simulationIterations",
DROP COLUMN "simulationResult",
DROP COLUMN "sleHigh",
DROP COLUMN "sleLikely",
DROP COLUMN "sleLow",
DROP COLUMN "tefMax",
DROP COLUMN "tefMin",
DROP COLUMN "tefMode",
DROP COLUMN "weightedImpact";

-- AlterTable
ALTER TABLE "RiskScenarioAsset" DROP COLUMN "feedsF3",
DROP COLUMN "feedsF5",
DROP COLUMN "feedsI1",
DROP COLUMN "feedsI2";

-- DropTable
DROP TABLE "ScenarioImpactAssessment";
