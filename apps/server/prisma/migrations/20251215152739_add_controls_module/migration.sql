-- CreateEnum
CREATE TYPE "ControlTheme" AS ENUM ('ORGANISATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNOLOGICAL');

-- CreateEnum
CREATE TYPE "CapabilityType" AS ENUM ('PROCESS', 'TECHNOLOGY', 'PEOPLE', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "ImplementationStatus" AS ENUM ('NOT_STARTED', 'PARTIAL', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('PASS', 'PARTIAL', 'FAIL', 'NOT_TESTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "RAGStatus" AS ENUM ('GREEN', 'AMBER', 'RED', 'NOT_MEASURED');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING', 'NEW');

-- CreateEnum
CREATE TYPE "CollectionFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'PER_EVENT', 'PER_INCIDENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Control" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "theme" "ControlTheme" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "applicable" BOOLEAN NOT NULL DEFAULT true,
    "justificationIfNa" TEXT,
    "implementationStatus" "ImplementationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "implementationDesc" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CapabilityType" NOT NULL,
    "description" TEXT,
    "testCriteria" TEXT NOT NULL,
    "evidenceRequired" TEXT NOT NULL,
    "maxMaturityLevel" INTEGER NOT NULL DEFAULT 5,
    "dependsOn" TEXT,
    "l1Criteria" TEXT,
    "l1Evidence" TEXT,
    "l2Criteria" TEXT,
    "l2Evidence" TEXT,
    "l3Criteria" TEXT,
    "l3Evidence" TEXT,
    "l4Criteria" TEXT,
    "l4Evidence" TEXT,
    "l5Criteria" TEXT,
    "l5Evidence" TEXT,
    "controlId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityMetric" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "greenThreshold" TEXT NOT NULL,
    "amberThreshold" TEXT NOT NULL,
    "redThreshold" TEXT NOT NULL,
    "collectionFrequency" "CollectionFrequency" NOT NULL,
    "dataSource" TEXT NOT NULL,
    "currentValue" TEXT,
    "status" "RAGStatus",
    "trend" "TrendDirection",
    "lastCollection" TIMESTAMP(3),
    "owner" TEXT,
    "notes" TEXT,
    "capabilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "CapabilityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityAssessment" (
    "id" TEXT NOT NULL,
    "testResult" "TestResult",
    "testDate" TIMESTAMP(3),
    "tester" TEXT,
    "evidenceLocation" TEXT,
    "testNotes" TEXT,
    "currentMaturity" INTEGER,
    "targetMaturity" INTEGER,
    "gap" INTEGER,
    "l1Met" BOOLEAN,
    "l2Met" BOOLEAN,
    "l3Met" BOOLEAN,
    "l4Met" BOOLEAN,
    "l5Met" BOOLEAN,
    "assessor" TEXT,
    "assessmentDate" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3),
    "notes" TEXT,
    "capabilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "CapabilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricHistory" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" "RAGStatus" NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "collectedBy" TEXT,
    "notes" TEXT,
    "metricId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "industrySector" TEXT,
    "industrySubsector" TEXT,
    "industryCode" TEXT,
    "marketPosition" TEXT,
    "primaryCompetitors" JSONB DEFAULT '[]',
    "annualRevenue" DECIMAL(20,2),
    "revenueCurrency" TEXT NOT NULL DEFAULT 'USD',
    "revenueStreams" JSONB DEFAULT '[]',
    "revenueTrend" TEXT,
    "fiscalYearStart" TEXT,
    "fiscalYearEnd" TIMESTAMP(3),
    "reportingCurrency" TEXT NOT NULL DEFAULT 'USD',
    "employeeCount" INTEGER NOT NULL,
    "employeeCategories" JSONB DEFAULT '[]',
    "employeeLocations" JSONB DEFAULT '[]',
    "employeeGrowthRate" DECIMAL(5,2),
    "remoteWorkPercentage" INTEGER,
    "size" TEXT,
    "parentOrganization" TEXT,
    "subsidiaries" JSONB DEFAULT '[]',
    "operatingCountries" JSONB DEFAULT '[]',
    "headquartersAddress" TEXT,
    "registeredAddress" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "registrationNumber" TEXT,
    "taxIdentification" TEXT,
    "dunsNumber" TEXT,
    "stockSymbol" TEXT,
    "leiCode" TEXT,
    "naceCode" TEXT,
    "sicCode" TEXT,
    "foundedYear" INTEGER,
    "missionStatement" TEXT,
    "visionStatement" TEXT,
    "coreValues" JSONB DEFAULT '[]',
    "strategicObjectives" JSONB DEFAULT '[]',
    "businessModel" TEXT,
    "valueProposition" TEXT,
    "ismsScope" TEXT,
    "ismsPolicy" TEXT,
    "ismsObjectives" JSONB DEFAULT '[]',
    "productsServicesInScope" JSONB DEFAULT '[]',
    "departmentsInScope" JSONB DEFAULT '[]',
    "locationsInScope" JSONB DEFAULT '[]',
    "processesInScope" JSONB DEFAULT '[]',
    "systemsInScope" JSONB DEFAULT '[]',
    "scopeExclusions" TEXT,
    "exclusionJustification" TEXT,
    "scopeBoundaries" TEXT,
    "isoCertificationStatus" TEXT NOT NULL DEFAULT 'not_certified',
    "certificationBody" TEXT,
    "certificationDate" TIMESTAMP(3),
    "certificationExpiry" TIMESTAMP(3),
    "certificateNumber" TEXT,
    "nextAuditDate" TIMESTAMP(3),
    "riskAppetite" TEXT,
    "riskTolerance" JSONB DEFAULT '{}',
    "digitalTransformationStage" TEXT,
    "technologyAdoptionRate" INTEGER,
    "innovationFocus" JSONB DEFAULT '[]',
    "sustainabilityGoals" JSONB DEFAULT '[]',
    "esgRating" TEXT,

    CONSTRAINT "OrganisationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "name" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "departmentCategory" TEXT,
    "functionType" TEXT,
    "criticalityLevel" TEXT,
    "departmentHeadId" TEXT,
    "deputyHeadId" TEXT,
    "headcount" INTEGER,
    "contractorCount" INTEGER,
    "keyResponsibilities" JSONB DEFAULT '[]',
    "regulatoryObligations" JSONB DEFAULT '[]',
    "externalInterfaces" JSONB DEFAULT '[]',
    "costCenter" TEXT,
    "budget" DECIMAL(15,2),
    "budgetCurrency" TEXT NOT NULL DEFAULT 'USD',
    "location" TEXT,
    "floorPlanReference" TEXT,
    "businessHours" JSONB DEFAULT '{}',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "emergencyContact" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "establishedDate" TIMESTAMP(3),
    "closureDate" TIMESTAMP(3),
    "handlesPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "handlesFinancialData" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentMember" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartmentMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationalUnit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "name" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "headId" TEXT,
    "budget" DECIMAL(15,2),
    "budgetCurrency" TEXT NOT NULL DEFAULT 'USD',
    "costCenter" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "establishedDate" TIMESTAMP(3),

    CONSTRAINT "OrganisationalUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "locationCode" TEXT,
    "name" TEXT NOT NULL,
    "locationType" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "region" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "timezone" TEXT,
    "employeeCount" INTEGER,
    "maxCapacity" INTEGER,
    "floorSpace" DECIMAL(10,2),
    "floorSpaceUnit" TEXT NOT NULL DEFAULT 'sqm',
    "physicalSecurityLevel" TEXT,
    "accessControlType" TEXT,
    "securityFeatures" JSONB DEFAULT '[]',
    "isDataCenter" BOOLEAN NOT NULL DEFAULT false,
    "hasServerRoom" BOOLEAN NOT NULL DEFAULT false,
    "networkType" TEXT,
    "internetProvider" TEXT,
    "backupPower" BOOLEAN NOT NULL DEFAULT false,
    "complianceCertifications" JSONB DEFAULT '[]',
    "inIsmsScope" BOOLEAN NOT NULL DEFAULT true,
    "scopeJustification" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "operationalSince" TIMESTAMP(3),
    "closureDate" TIMESTAMP(3),

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutivePosition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "title" TEXT NOT NULL,
    "executiveLevel" TEXT NOT NULL,
    "personId" TEXT,
    "reportsToId" TEXT,
    "authorityLevel" TEXT,
    "securityResponsibilities" TEXT,
    "riskAuthorityLevel" TEXT,
    "budgetAuthority" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCeo" BOOLEAN NOT NULL DEFAULT false,
    "isSecurityCommitteeMember" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "ExecutivePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityChampion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "championLevel" TEXT NOT NULL,
    "responsibilities" TEXT,
    "trainingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastTrainingDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "SecurityChampion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProcess" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "name" TEXT NOT NULL,
    "processCode" TEXT NOT NULL,
    "description" TEXT,
    "processType" TEXT NOT NULL,
    "criticalityLevel" TEXT NOT NULL DEFAULT 'medium',
    "processOwnerId" TEXT,
    "processManagerId" TEXT,
    "departmentId" TEXT,
    "inputs" JSONB DEFAULT '[]',
    "outputs" JSONB DEFAULT '[]',
    "keyActivities" JSONB DEFAULT '[]',
    "stakeholders" JSONB DEFAULT '[]',
    "kpis" JSONB DEFAULT '[]',
    "cycleTimeHours" INTEGER,
    "frequency" TEXT,
    "automationLevel" TEXT,
    "complianceRequirements" JSONB DEFAULT '[]',
    "riskRating" TEXT,
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "sopReference" TEXT,
    "processMapUrl" TEXT,
    "documentation" JSONB DEFAULT '[]',
    "improvementOpportunities" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bcpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bcpCriticality" TEXT,
    "recoveryTimeObjectiveMinutes" INTEGER,
    "recoveryPointObjectiveMinutes" INTEGER,
    "maximumTolerableDowntimeMinutes" INTEGER,
    "minimumStaff" INTEGER,
    "backupOwnerId" TEXT,
    "operatingHours" JSONB DEFAULT '{}',
    "peakPeriods" JSONB DEFAULT '{}',
    "criticalRoles" JSONB DEFAULT '[]',
    "requiredSkills" JSONB DEFAULT '[]',
    "systemDependencies" JSONB DEFAULT '[]',
    "supplierDependencies" JSONB DEFAULT '[]',
    "alternateProcesses" TEXT,
    "workaroundProcedures" TEXT,
    "manualProcedures" TEXT,
    "recoveryStrategies" JSONB DEFAULT '[]',
    "workRecoveryTimeMinutes" INTEGER,
    "minimumBusinessContinuityObjective" TEXT,
    "volumeMetrics" JSONB DEFAULT '{}',
    "performanceIndicators" JSONB DEFAULT '{}',
    "seasonalVariations" JSONB DEFAULT '{}',
    "parentProcessId" TEXT,
    "upstreamBias" TEXT,
    "downstreamBias" TEXT,

    CONSTRAINT "BusinessProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalDependency" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "name" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vendorWebsite" TEXT,
    "criticalityLevel" TEXT NOT NULL,
    "businessImpact" TEXT,
    "singlePointOfFailure" BOOLEAN NOT NULL DEFAULT false,
    "contractReference" TEXT,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3) NOT NULL,
    "annualCost" DECIMAL(15,2),
    "paymentTerms" TEXT,
    "slaDetails" JSONB DEFAULT '{}',
    "dataProcessed" JSONB DEFAULT '[]',
    "dataLocation" TEXT,
    "complianceCertifications" JSONB DEFAULT '[]',
    "lastAssessmentDate" TIMESTAMP(3),
    "riskRating" TEXT,
    "primaryContact" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "alternativeProviders" JSONB DEFAULT '[]',
    "exitStrategy" TEXT,
    "dataRecoveryProcedure" TEXT,

    CONSTRAINT "ExternalDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regulator" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "regulatorType" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "jurisdictionLevel" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactAddress" TEXT,
    "keyRegulations" JSONB DEFAULT '[]',
    "applicableStandards" JSONB DEFAULT '[]',
    "registrationStatus" TEXT NOT NULL DEFAULT 'not_required',
    "registrationNumber" TEXT,
    "registrationDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDate" TIMESTAMP(3),
    "reportingFrequency" TEXT,
    "lastReportDate" TIMESTAMP(3),
    "nextReportDate" TIMESTAMP(3),
    "penaltiesFines" JSONB DEFAULT '[]',
    "complianceNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Regulator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityCommittee" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "name" TEXT NOT NULL,
    "committeeType" TEXT NOT NULL,
    "description" TEXT,
    "chairId" TEXT,
    "authorityLevel" TEXT,
    "meetingFrequency" TEXT NOT NULL,
    "nextMeetingDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "establishedDate" TIMESTAMP(3) NOT NULL,
    "dissolvedDate" TIMESTAMP(3),

    CONSTRAINT "SecurityCommittee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMembership" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "userId" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "responsibilities" TEXT,
    "votingRights" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "CommitteeMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMeeting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "committeeId" TEXT NOT NULL,
    "meetingNumber" TEXT,
    "title" TEXT NOT NULL,
    "meetingType" TEXT NOT NULL DEFAULT 'regular',
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "durationMinutes" INTEGER,
    "locationType" TEXT NOT NULL DEFAULT 'virtual',
    "physicalLocation" TEXT,
    "virtualMeetingLink" TEXT,
    "virtualMeetingId" TEXT,
    "agenda" TEXT,
    "objectives" TEXT,
    "minutes" TEXT,
    "chairId" TEXT,
    "secretaryId" TEXT,
    "expectedAttendeesCount" INTEGER NOT NULL DEFAULT 0,
    "actualAttendeesCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "quorumAchieved" BOOLEAN NOT NULL DEFAULT false,
    "quorumRequirement" INTEGER,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "nextMeetingScheduled" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB DEFAULT '[]',
    "cancellationReason" TEXT,
    "postponedToDate" TIMESTAMP(3),

    CONSTRAINT "CommitteeMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendance" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "membershipId" TEXT,
    "attendanceStatus" TEXT NOT NULL DEFAULT 'present',
    "arrivalTime" TEXT,
    "departureTime" TEXT,
    "participatedInVoting" BOOLEAN NOT NULL DEFAULT false,
    "contributedToDiscussion" BOOLEAN NOT NULL DEFAULT false,
    "absenceReason" TEXT,
    "notes" TEXT,
    "proxyAttendeeId" TEXT,

    CONSTRAINT "MeetingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingDecision" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "meetingId" TEXT NOT NULL,
    "decisionNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "rationale" TEXT,
    "voteType" TEXT NOT NULL DEFAULT 'majority',
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "votesAbstain" INTEGER NOT NULL DEFAULT 0,
    "responsiblePartyId" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "implementationDeadline" TIMESTAMP(3),
    "implemented" BOOLEAN NOT NULL DEFAULT false,
    "implementationDate" TIMESTAMP(3),
    "implementationNotes" TEXT,
    "relatedDocuments" JSONB DEFAULT '[]',

    CONSTRAINT "MeetingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingActionItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "meetingId" TEXT NOT NULL,
    "actionNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedById" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "estimatedHours" DECIMAL(5,1),
    "status" TEXT NOT NULL DEFAULT 'open',
    "completionDate" TIMESTAMP(3),
    "completionNotes" TEXT,
    "progressPercentage" INTEGER NOT NULL DEFAULT 0,
    "lastUpdateNotes" TEXT,
    "dependsOnId" TEXT,
    "blockingReason" TEXT,
    "requiresCommitteeReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewDate" TIMESTAMP(3),

    CONSTRAINT "MeetingActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductService" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "productCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "customerFacing" BOOLEAN NOT NULL DEFAULT true,
    "internalOnly" BOOLEAN NOT NULL DEFAULT false,
    "revenueContribution" TEXT,
    "pricingModel" TEXT,
    "targetMarket" TEXT,
    "lifecycleStage" TEXT,
    "launchDate" TIMESTAMP(3),
    "sunsetDate" TIMESTAMP(3),
    "productOwnerId" TEXT,
    "departmentId" TEXT,
    "dataClassification" TEXT,
    "containsPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "complianceRequirements" JSONB DEFAULT '[]',
    "inIsmsScope" BOOLEAN NOT NULL DEFAULT true,
    "scopeJustification" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnologyPlatform" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "platformCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platformType" TEXT NOT NULL,
    "description" TEXT,
    "vendor" TEXT,
    "vendorWebsite" TEXT,
    "supportContact" TEXT,
    "licenseType" TEXT,
    "hostingLocation" TEXT,
    "cloudProvider" TEXT,
    "deploymentModel" TEXT,
    "version" TEXT,
    "architecture" TEXT,
    "integrations" JSONB DEFAULT '[]',
    "dataStorageLocation" TEXT,
    "criticalityLevel" TEXT,
    "businessImpact" TEXT,
    "riskRating" TEXT,
    "implementationDate" TIMESTAMP(3),
    "endOfLifeDate" TIMESTAMP(3),
    "lastUpgradeDate" TIMESTAMP(3),
    "nextUpgradeDate" TIMESTAMP(3),
    "technicalOwnerId" TEXT,
    "businessOwnerId" TEXT,
    "departmentId" TEXT,
    "complianceCertifications" JSONB DEFAULT '[]',
    "dataClassification" TEXT,
    "inIsmsScope" BOOLEAN NOT NULL DEFAULT true,
    "scopeJustification" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "environments" JSONB DEFAULT '[]',

    CONSTRAINT "TechnologyPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestedParty" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "partyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partyType" TEXT NOT NULL,
    "description" TEXT,
    "expectations" TEXT,
    "requirements" TEXT,
    "informationNeeds" JSONB DEFAULT '[]',
    "powerLevel" TEXT,
    "interestLevel" TEXT,
    "influenceLevel" TEXT,
    "engagementStrategy" TEXT,
    "communicationMethod" TEXT,
    "communicationFrequency" TEXT,
    "primaryContact" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "ismsRelevance" TEXT,
    "securityExpectations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InterestedParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextIssue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "issueCode" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "impactType" TEXT,
    "impactLevel" TEXT,
    "likelihood" TEXT,
    "ismsRelevance" TEXT,
    "affectedAreas" JSONB DEFAULT '[]',
    "controlImplications" TEXT,
    "responseStrategy" TEXT,
    "mitigationActions" JSONB DEFAULT '[]',
    "responsiblePartyId" TEXT,
    "monitoringFrequency" TEXT,
    "lastReviewDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "trendDirection" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "escalatedToRisk" BOOLEAN NOT NULL DEFAULT false,
    "linkedRiskId" TEXT,

    CONSTRAINT "ContextIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyPersonnel" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "personCode" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "departmentId" TEXT,
    "ismsRole" TEXT NOT NULL,
    "securityResponsibilities" TEXT,
    "authorityLevel" TEXT,
    "backupPersonId" TEXT,
    "trainingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastTrainingDate" TIMESTAMP(3),
    "certifications" JSONB DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "KeyPersonnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicableFramework" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "frameworkCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frameworkType" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT,
    "isApplicable" BOOLEAN NOT NULL DEFAULT false,
    "applicabilityReason" TEXT,
    "applicabilityDate" TIMESTAMP(3),
    "assessedById" TEXT,
    "complianceStatus" TEXT NOT NULL DEFAULT 'not_assessed',
    "compliancePercentage" INTEGER,
    "lastAssessmentDate" TIMESTAMP(3),
    "nextAssessmentDate" TIMESTAMP(3),
    "supervisoryAuthority" TEXT,
    "authorityContact" TEXT,
    "registrationNumber" TEXT,
    "registrationDate" TIMESTAMP(3),
    "isCertifiable" BOOLEAN NOT NULL DEFAULT false,
    "certificationStatus" TEXT,
    "certificationBody" TEXT,
    "certificateNumber" TEXT,
    "certificationDate" TIMESTAMP(3),
    "certificationExpiry" TIMESTAMP(3),
    "keyRequirements" JSONB DEFAULT '[]',
    "applicableControls" JSONB DEFAULT '[]',
    "notes" TEXT,

    CONSTRAINT "ApplicableFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryEligibilitySurvey" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "surveyType" TEXT NOT NULL,
    "surveyVersion" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "completedAt" TIMESTAMP(3),
    "isApplicable" BOOLEAN,
    "applicabilityReason" TEXT,
    "entityClassification" TEXT,
    "regulatoryRegime" TEXT,
    "notes" TEXT,

    CONSTRAINT "RegulatoryEligibilitySurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "surveyType" TEXT NOT NULL,
    "stepNumber" TEXT NOT NULL,
    "stepCategory" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "ifYes" TEXT,
    "ifNo" TEXT,
    "legalReference" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "surveyId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT,
    "notes" TEXT,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DepartmentToExternalDependency" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_BusinessProcessToExternalDependency" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");

-- CreateIndex
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_idx" ON "AuditEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Control_theme_idx" ON "Control"("theme");

-- CreateIndex
CREATE INDEX "Control_implementationStatus_idx" ON "Control"("implementationStatus");

-- CreateIndex
CREATE INDEX "Control_organisationId_idx" ON "Control"("organisationId");

-- CreateIndex
CREATE INDEX "Control_applicable_idx" ON "Control"("applicable");

-- CreateIndex
CREATE UNIQUE INDEX "Control_controlId_organisationId_key" ON "Control"("controlId", "organisationId");

-- CreateIndex
CREATE INDEX "Capability_type_idx" ON "Capability"("type");

-- CreateIndex
CREATE INDEX "Capability_controlId_idx" ON "Capability"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_capabilityId_controlId_key" ON "Capability"("capabilityId", "controlId");

-- CreateIndex
CREATE INDEX "CapabilityMetric_status_idx" ON "CapabilityMetric"("status");

-- CreateIndex
CREATE INDEX "CapabilityMetric_collectionFrequency_idx" ON "CapabilityMetric"("collectionFrequency");

-- CreateIndex
CREATE INDEX "CapabilityMetric_capabilityId_idx" ON "CapabilityMetric"("capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityMetric_metricId_capabilityId_key" ON "CapabilityMetric"("metricId", "capabilityId");

-- CreateIndex
CREATE INDEX "CapabilityAssessment_testResult_idx" ON "CapabilityAssessment"("testResult");

-- CreateIndex
CREATE INDEX "CapabilityAssessment_currentMaturity_idx" ON "CapabilityAssessment"("currentMaturity");

-- CreateIndex
CREATE INDEX "CapabilityAssessment_capabilityId_idx" ON "CapabilityAssessment"("capabilityId");

-- CreateIndex
CREATE INDEX "CapabilityAssessment_assessmentDate_idx" ON "CapabilityAssessment"("assessmentDate");

-- CreateIndex
CREATE INDEX "MetricHistory_metricId_idx" ON "MetricHistory"("metricId");

-- CreateIndex
CREATE INDEX "MetricHistory_collectedAt_idx" ON "MetricHistory"("collectedAt");

-- CreateIndex
CREATE INDEX "OrganisationProfile_name_idx" ON "OrganisationProfile"("name");

-- CreateIndex
CREATE INDEX "OrganisationProfile_industrySector_idx" ON "OrganisationProfile"("industrySector");

-- CreateIndex
CREATE UNIQUE INDEX "Department_departmentCode_key" ON "Department"("departmentCode");

-- CreateIndex
CREATE INDEX "Department_departmentCode_idx" ON "Department"("departmentCode");

-- CreateIndex
CREATE INDEX "Department_parentId_idx" ON "Department"("parentId");

-- CreateIndex
CREATE INDEX "Department_departmentHeadId_idx" ON "Department"("departmentHeadId");

-- CreateIndex
CREATE INDEX "Department_isActive_idx" ON "Department"("isActive");

-- CreateIndex
CREATE INDEX "DepartmentMember_userId_idx" ON "DepartmentMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentMember_departmentId_userId_key" ON "DepartmentMember"("departmentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationalUnit_code_key" ON "OrganisationalUnit"("code");

-- CreateIndex
CREATE INDEX "OrganisationalUnit_code_idx" ON "OrganisationalUnit"("code");

-- CreateIndex
CREATE INDEX "OrganisationalUnit_parentId_idx" ON "OrganisationalUnit"("parentId");

-- CreateIndex
CREATE INDEX "OrganisationalUnit_headId_idx" ON "OrganisationalUnit"("headId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_locationCode_key" ON "Location"("locationCode");

-- CreateIndex
CREATE INDEX "Location_locationCode_idx" ON "Location"("locationCode");

-- CreateIndex
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Location_country_idx" ON "Location"("country");

-- CreateIndex
CREATE INDEX "Location_locationType_idx" ON "Location"("locationType");

-- CreateIndex
CREATE INDEX "Location_isActive_idx" ON "Location"("isActive");

-- CreateIndex
CREATE INDEX "ExecutivePosition_executiveLevel_idx" ON "ExecutivePosition"("executiveLevel");

-- CreateIndex
CREATE INDEX "ExecutivePosition_personId_idx" ON "ExecutivePosition"("personId");

-- CreateIndex
CREATE INDEX "ExecutivePosition_isActive_idx" ON "ExecutivePosition"("isActive");

-- CreateIndex
CREATE INDEX "SecurityChampion_departmentId_idx" ON "SecurityChampion"("departmentId");

-- CreateIndex
CREATE INDEX "SecurityChampion_isActive_idx" ON "SecurityChampion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityChampion_userId_departmentId_key" ON "SecurityChampion"("userId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProcess_processCode_key" ON "BusinessProcess"("processCode");

-- CreateIndex
CREATE INDEX "BusinessProcess_processCode_idx" ON "BusinessProcess"("processCode");

-- CreateIndex
CREATE INDEX "BusinessProcess_processOwnerId_idx" ON "BusinessProcess"("processOwnerId");

-- CreateIndex
CREATE INDEX "BusinessProcess_departmentId_idx" ON "BusinessProcess"("departmentId");

-- CreateIndex
CREATE INDEX "BusinessProcess_bcpEnabled_bcpCriticality_idx" ON "BusinessProcess"("bcpEnabled", "bcpCriticality");

-- CreateIndex
CREATE INDEX "ExternalDependency_name_idx" ON "ExternalDependency"("name");

-- CreateIndex
CREATE INDEX "ExternalDependency_dependencyType_idx" ON "ExternalDependency"("dependencyType");

-- CreateIndex
CREATE INDEX "ExternalDependency_criticalityLevel_idx" ON "ExternalDependency"("criticalityLevel");

-- CreateIndex
CREATE INDEX "Regulator_name_idx" ON "Regulator"("name");

-- CreateIndex
CREATE INDEX "Regulator_regulatorType_idx" ON "Regulator"("regulatorType");

-- CreateIndex
CREATE INDEX "Regulator_jurisdiction_idx" ON "Regulator"("jurisdiction");

-- CreateIndex
CREATE INDEX "SecurityCommittee_committeeType_idx" ON "SecurityCommittee"("committeeType");

-- CreateIndex
CREATE INDEX "SecurityCommittee_chairId_idx" ON "SecurityCommittee"("chairId");

-- CreateIndex
CREATE INDEX "SecurityCommittee_isActive_idx" ON "SecurityCommittee"("isActive");

-- CreateIndex
CREATE INDEX "CommitteeMembership_committeeId_idx" ON "CommitteeMembership"("committeeId");

-- CreateIndex
CREATE INDEX "CommitteeMembership_isActive_idx" ON "CommitteeMembership"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeMembership_userId_committeeId_key" ON "CommitteeMembership"("userId", "committeeId");

-- CreateIndex
CREATE INDEX "CommitteeMeeting_committeeId_idx" ON "CommitteeMeeting"("committeeId");

-- CreateIndex
CREATE INDEX "CommitteeMeeting_meetingDate_idx" ON "CommitteeMeeting"("meetingDate");

-- CreateIndex
CREATE INDEX "CommitteeMeeting_status_idx" ON "CommitteeMeeting"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeMeeting_committeeId_meetingDate_startTime_key" ON "CommitteeMeeting"("committeeId", "meetingDate", "startTime");

-- CreateIndex
CREATE INDEX "MeetingAttendance_meetingId_idx" ON "MeetingAttendance"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingAttendance_attendanceStatus_idx" ON "MeetingAttendance"("attendanceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendance_meetingId_memberId_key" ON "MeetingAttendance"("meetingId", "memberId");

-- CreateIndex
CREATE INDEX "MeetingDecision_meetingId_idx" ON "MeetingDecision"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingDecision_decisionType_idx" ON "MeetingDecision"("decisionType");

-- CreateIndex
CREATE INDEX "MeetingDecision_implemented_idx" ON "MeetingDecision"("implemented");

-- CreateIndex
CREATE INDEX "MeetingActionItem_meetingId_idx" ON "MeetingActionItem"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingActionItem_assignedToId_idx" ON "MeetingActionItem"("assignedToId");

-- CreateIndex
CREATE INDEX "MeetingActionItem_status_idx" ON "MeetingActionItem"("status");

-- CreateIndex
CREATE INDEX "MeetingActionItem_priority_dueDate_idx" ON "MeetingActionItem"("priority", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "ProductService_productCode_key" ON "ProductService"("productCode");

-- CreateIndex
CREATE INDEX "ProductService_productCode_idx" ON "ProductService"("productCode");

-- CreateIndex
CREATE INDEX "ProductService_productType_idx" ON "ProductService"("productType");

-- CreateIndex
CREATE INDEX "ProductService_isActive_idx" ON "ProductService"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TechnologyPlatform_platformCode_key" ON "TechnologyPlatform"("platformCode");

-- CreateIndex
CREATE INDEX "TechnologyPlatform_platformCode_idx" ON "TechnologyPlatform"("platformCode");

-- CreateIndex
CREATE INDEX "TechnologyPlatform_platformType_idx" ON "TechnologyPlatform"("platformType");

-- CreateIndex
CREATE INDEX "TechnologyPlatform_criticalityLevel_idx" ON "TechnologyPlatform"("criticalityLevel");

-- CreateIndex
CREATE INDEX "TechnologyPlatform_isActive_idx" ON "TechnologyPlatform"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InterestedParty_partyCode_key" ON "InterestedParty"("partyCode");

-- CreateIndex
CREATE INDEX "InterestedParty_partyCode_idx" ON "InterestedParty"("partyCode");

-- CreateIndex
CREATE INDEX "InterestedParty_partyType_idx" ON "InterestedParty"("partyType");

-- CreateIndex
CREATE INDEX "InterestedParty_isActive_idx" ON "InterestedParty"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ContextIssue_issueCode_key" ON "ContextIssue"("issueCode");

-- CreateIndex
CREATE INDEX "ContextIssue_issueCode_idx" ON "ContextIssue"("issueCode");

-- CreateIndex
CREATE INDEX "ContextIssue_issueType_idx" ON "ContextIssue"("issueType");

-- CreateIndex
CREATE INDEX "ContextIssue_category_idx" ON "ContextIssue"("category");

-- CreateIndex
CREATE INDEX "ContextIssue_status_idx" ON "ContextIssue"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KeyPersonnel_personCode_key" ON "KeyPersonnel"("personCode");

-- CreateIndex
CREATE INDEX "KeyPersonnel_personCode_idx" ON "KeyPersonnel"("personCode");

-- CreateIndex
CREATE INDEX "KeyPersonnel_ismsRole_idx" ON "KeyPersonnel"("ismsRole");

-- CreateIndex
CREATE INDEX "KeyPersonnel_userId_idx" ON "KeyPersonnel"("userId");

-- CreateIndex
CREATE INDEX "KeyPersonnel_isActive_idx" ON "KeyPersonnel"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicableFramework_frameworkCode_key" ON "ApplicableFramework"("frameworkCode");

-- CreateIndex
CREATE INDEX "ApplicableFramework_frameworkCode_idx" ON "ApplicableFramework"("frameworkCode");

-- CreateIndex
CREATE INDEX "ApplicableFramework_frameworkType_idx" ON "ApplicableFramework"("frameworkType");

-- CreateIndex
CREATE INDEX "ApplicableFramework_isApplicable_idx" ON "ApplicableFramework"("isApplicable");

-- CreateIndex
CREATE INDEX "ApplicableFramework_complianceStatus_idx" ON "ApplicableFramework"("complianceStatus");

-- CreateIndex
CREATE INDEX "RegulatoryEligibilitySurvey_surveyType_idx" ON "RegulatoryEligibilitySurvey"("surveyType");

-- CreateIndex
CREATE INDEX "RegulatoryEligibilitySurvey_status_idx" ON "RegulatoryEligibilitySurvey"("status");

-- CreateIndex
CREATE INDEX "SurveyQuestion_surveyType_sortOrder_idx" ON "SurveyQuestion"("surveyType", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestion_surveyType_stepNumber_key" ON "SurveyQuestion"("surveyType", "stepNumber");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_idx" ON "SurveyResponse"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveyId_questionId_key" ON "SurveyResponse"("surveyId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentToExternalDependency_AB_unique" ON "_DepartmentToExternalDependency"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentToExternalDependency_B_index" ON "_DepartmentToExternalDependency"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BusinessProcessToExternalDependency_AB_unique" ON "_BusinessProcessToExternalDependency"("A", "B");

-- CreateIndex
CREATE INDEX "_BusinessProcessToExternalDependency_B_index" ON "_BusinessProcessToExternalDependency"("B");

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "OrganisationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityMetric" ADD CONSTRAINT "CapabilityMetric_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityMetric" ADD CONSTRAINT "CapabilityMetric_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityMetric" ADD CONSTRAINT "CapabilityMetric_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityAssessment" ADD CONSTRAINT "CapabilityAssessment_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityAssessment" ADD CONSTRAINT "CapabilityAssessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityAssessment" ADD CONSTRAINT "CapabilityAssessment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricHistory" ADD CONSTRAINT "MetricHistory_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "CapabilityMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationProfile" ADD CONSTRAINT "OrganisationProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationProfile" ADD CONSTRAINT "OrganisationProfile_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_departmentHeadId_fkey" FOREIGN KEY ("departmentHeadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_deputyHeadId_fkey" FOREIGN KEY ("deputyHeadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentMember" ADD CONSTRAINT "DepartmentMember_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentMember" ADD CONSTRAINT "DepartmentMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationalUnit" ADD CONSTRAINT "OrganisationalUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrganisationalUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationalUnit" ADD CONSTRAINT "OrganisationalUnit_headId_fkey" FOREIGN KEY ("headId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationalUnit" ADD CONSTRAINT "OrganisationalUnit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationalUnit" ADD CONSTRAINT "OrganisationalUnit_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePosition" ADD CONSTRAINT "ExecutivePosition_personId_fkey" FOREIGN KEY ("personId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePosition" ADD CONSTRAINT "ExecutivePosition_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "ExecutivePosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePosition" ADD CONSTRAINT "ExecutivePosition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutivePosition" ADD CONSTRAINT "ExecutivePosition_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityChampion" ADD CONSTRAINT "SecurityChampion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityChampion" ADD CONSTRAINT "SecurityChampion_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityChampion" ADD CONSTRAINT "SecurityChampion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityChampion" ADD CONSTRAINT "SecurityChampion_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_processOwnerId_fkey" FOREIGN KEY ("processOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_processManagerId_fkey" FOREIGN KEY ("processManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_backupOwnerId_fkey" FOREIGN KEY ("backupOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_parentProcessId_fkey" FOREIGN KEY ("parentProcessId") REFERENCES "BusinessProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalDependency" ADD CONSTRAINT "ExternalDependency_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalDependency" ADD CONSTRAINT "ExternalDependency_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Regulator" ADD CONSTRAINT "Regulator_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Regulator" ADD CONSTRAINT "Regulator_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityCommittee" ADD CONSTRAINT "SecurityCommittee_chairId_fkey" FOREIGN KEY ("chairId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityCommittee" ADD CONSTRAINT "SecurityCommittee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityCommittee" ADD CONSTRAINT "SecurityCommittee_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMembership" ADD CONSTRAINT "CommitteeMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMembership" ADD CONSTRAINT "CommitteeMembership_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "SecurityCommittee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMembership" ADD CONSTRAINT "CommitteeMembership_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMembership" ADD CONSTRAINT "CommitteeMembership_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "SecurityCommittee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_chairId_fkey" FOREIGN KEY ("chairId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CommitteeMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "CommitteeMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_proxyAttendeeId_fkey" FOREIGN KEY ("proxyAttendeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDecision" ADD CONSTRAINT "MeetingDecision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CommitteeMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDecision" ADD CONSTRAINT "MeetingDecision_responsiblePartyId_fkey" FOREIGN KEY ("responsiblePartyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDecision" ADD CONSTRAINT "MeetingDecision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDecision" ADD CONSTRAINT "MeetingDecision_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "CommitteeMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "MeetingActionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyPersonnel" ADD CONSTRAINT "KeyPersonnel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyPersonnel" ADD CONSTRAINT "KeyPersonnel_backupPersonId_fkey" FOREIGN KEY ("backupPersonId") REFERENCES "KeyPersonnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyPersonnel" ADD CONSTRAINT "KeyPersonnel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyPersonnel" ADD CONSTRAINT "KeyPersonnel_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicableFramework" ADD CONSTRAINT "ApplicableFramework_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicableFramework" ADD CONSTRAINT "ApplicableFramework_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryEligibilitySurvey" ADD CONSTRAINT "RegulatoryEligibilitySurvey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryEligibilitySurvey" ADD CONSTRAINT "RegulatoryEligibilitySurvey_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "RegulatoryEligibilitySurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToExternalDependency" ADD CONSTRAINT "_DepartmentToExternalDependency_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToExternalDependency" ADD CONSTRAINT "_DepartmentToExternalDependency_B_fkey" FOREIGN KEY ("B") REFERENCES "ExternalDependency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessProcessToExternalDependency" ADD CONSTRAINT "_BusinessProcessToExternalDependency_A_fkey" FOREIGN KEY ("A") REFERENCES "BusinessProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessProcessToExternalDependency" ADD CONSTRAINT "_BusinessProcessToExternalDependency_B_fkey" FOREIGN KEY ("B") REFERENCES "ExternalDependency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
