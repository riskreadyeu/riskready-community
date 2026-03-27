-- CreateEnum
CREATE TYPE "SOAStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "StatementOfApplicability" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "SOAStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT,
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "StatementOfApplicability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOAEntry" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "controlName" TEXT NOT NULL,
    "theme" "ControlTheme" NOT NULL,
    "applicable" BOOLEAN NOT NULL DEFAULT true,
    "justificationIfNa" TEXT,
    "implementationStatus" "ImplementationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "implementationDesc" TEXT,
    "parentRiskId" TEXT,
    "scenarioIds" TEXT,
    "soaId" TEXT NOT NULL,
    "controlRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SOAEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatementOfApplicability_status_idx" ON "StatementOfApplicability"("status");

-- CreateIndex
CREATE INDEX "StatementOfApplicability_organisationId_idx" ON "StatementOfApplicability"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "StatementOfApplicability_version_organisationId_key" ON "StatementOfApplicability"("version", "organisationId");

-- CreateIndex
CREATE INDEX "SOAEntry_soaId_idx" ON "SOAEntry"("soaId");

-- CreateIndex
CREATE INDEX "SOAEntry_applicable_idx" ON "SOAEntry"("applicable");

-- CreateIndex
CREATE INDEX "SOAEntry_implementationStatus_idx" ON "SOAEntry"("implementationStatus");

-- CreateIndex
CREATE INDEX "SOAEntry_controlRecordId_idx" ON "SOAEntry"("controlRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "SOAEntry_controlId_soaId_key" ON "SOAEntry"("controlId", "soaId");

-- AddForeignKey
ALTER TABLE "StatementOfApplicability" ADD CONSTRAINT "StatementOfApplicability_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementOfApplicability" ADD CONSTRAINT "StatementOfApplicability_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "OrganisationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementOfApplicability" ADD CONSTRAINT "StatementOfApplicability_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementOfApplicability" ADD CONSTRAINT "StatementOfApplicability_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOAEntry" ADD CONSTRAINT "SOAEntry_soaId_fkey" FOREIGN KEY ("soaId") REFERENCES "StatementOfApplicability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOAEntry" ADD CONSTRAINT "SOAEntry_controlRecordId_fkey" FOREIGN KEY ("controlRecordId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;
