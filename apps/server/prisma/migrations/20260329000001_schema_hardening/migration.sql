-- Schema Hardening Migration
-- Generated: 2026-03-29
-- Description: Composite indexes, soft delete columns, updatedAt columns

-- ============================================
-- Fix 1: Composite indexes for common query patterns
-- ============================================

-- Risk: organisationId + status
CREATE INDEX "Risk_organisationId_status_idx" ON "Risk"("organisationId", "status");

-- Control: organisationId + implementationStatus
CREATE INDEX "Control_organisationId_implementationStatus_idx" ON "Control"("organisationId", "implementationStatus");

-- Incident: organisationId + status
CREATE INDEX "Incident_organisationId_status_idx" ON "Incident"("organisationId", "status");

-- ChatMessage: role
CREATE INDEX "ChatMessage_role_idx" ON "ChatMessage"("role");

-- ============================================
-- Fix 2: Soft delete support (nullable deletedAt columns)
-- ============================================

ALTER TABLE "Risk" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Control" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Incident" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Nonconformity" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "PolicyDocument" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Asset" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Evidence" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Indexes on deletedAt for efficient filtering
CREATE INDEX "Risk_deletedAt_idx" ON "Risk"("deletedAt");
CREATE INDEX "Control_deletedAt_idx" ON "Control"("deletedAt");
CREATE INDEX "Incident_deletedAt_idx" ON "Incident"("deletedAt");
CREATE INDEX "Nonconformity_deletedAt_idx" ON "Nonconformity"("deletedAt");
CREATE INDEX "PolicyDocument_deletedAt_idx" ON "PolicyDocument"("deletedAt");
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");
CREATE INDEX "Evidence_deletedAt_idx" ON "Evidence"("deletedAt");

-- ============================================
-- Fix 3: Add missing updatedAt columns
-- ============================================

ALTER TABLE "ToleranceEvaluation" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "McpApiKey" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
