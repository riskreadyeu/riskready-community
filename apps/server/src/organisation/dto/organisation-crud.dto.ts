import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateApplicableFrameworkDto {
  @IsString()
  frameworkCode!: string;

  @IsString()
  name!: string;

  @IsString()
  frameworkType!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  isApplicable?: boolean;

  @IsOptional()
  @IsString()
  applicabilityReason?: string;

  @IsOptional()
  @IsDateString()
  applicabilityDate?: string;

  @IsOptional()
  @IsString()
  assessedById?: string;

  @IsOptional()
  @IsString()
  complianceStatus?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  compliancePercentage?: number;

  @IsOptional()
  @IsDateString()
  lastAssessmentDate?: string;

  @IsOptional()
  @IsDateString()
  nextAssessmentDate?: string;

  @IsOptional()
  @IsString()
  supervisoryAuthority?: string;

  @IsOptional()
  @IsString()
  authorityContact?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @IsOptional()
  @IsBoolean()
  isCertifiable?: boolean;

  @IsOptional()
  @IsString()
  certificationStatus?: string;

  @IsOptional()
  @IsString()
  certificationBody?: string;

  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @IsOptional()
  @IsDateString()
  certificationDate?: string;

  @IsOptional()
  @IsDateString()
  certificationExpiry?: string;

  @IsOptional()
  @IsArray()
  keyRequirements?: unknown[];

  @IsOptional()
  @IsArray()
  applicableControls?: unknown[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateApplicableFrameworkDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  frameworkType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  isApplicable?: boolean;

  @IsOptional()
  @IsString()
  applicabilityReason?: string;

  @IsOptional()
  @IsDateString()
  applicabilityDate?: string;

  @IsOptional()
  @IsString()
  assessedById?: string;

  @IsOptional()
  @IsString()
  complianceStatus?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  compliancePercentage?: number;

  @IsOptional()
  @IsDateString()
  lastAssessmentDate?: string;

  @IsOptional()
  @IsDateString()
  nextAssessmentDate?: string;

  @IsOptional()
  @IsString()
  supervisoryAuthority?: string;

  @IsOptional()
  @IsString()
  authorityContact?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @IsOptional()
  @IsBoolean()
  isCertifiable?: boolean;

  @IsOptional()
  @IsString()
  certificationStatus?: string;

  @IsOptional()
  @IsString()
  certificationBody?: string;

  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @IsOptional()
  @IsDateString()
  certificationDate?: string;

  @IsOptional()
  @IsDateString()
  certificationExpiry?: string;

  @IsOptional()
  @IsArray()
  keyRequirements?: unknown[];

  @IsOptional()
  @IsArray()
  applicableControls?: unknown[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBusinessProcessDto {
  @IsString()
  name!: string;

  @IsString()
  processCode!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  processType!: string;

  @IsOptional()
  @IsString()
  criticalityLevel?: string;

  @IsOptional()
  @IsString()
  processOwnerId?: string;

  @IsOptional()
  @IsString()
  processManagerId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  inputs?: unknown[];

  @IsOptional()
  @IsArray()
  outputs?: unknown[];

  @IsOptional()
  @IsArray()
  keyActivities?: unknown[];

  @IsOptional()
  @IsArray()
  stakeholders?: unknown[];

  @IsOptional()
  @IsArray()
  kpis?: unknown[];

  @IsOptional()
  @IsInt()
  @Min(0)
  cycleTimeHours?: number;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  automationLevel?: string;

  @IsOptional()
  @IsArray()
  complianceRequirements?: unknown[];

  @IsOptional()
  @IsString()
  riskRating?: string;

  @IsOptional()
  @IsDateString()
  lastReviewDate?: string;

  @IsOptional()
  @IsDateString()
  nextReviewDate?: string;

  @IsOptional()
  @IsString()
  sopReference?: string;

  @IsOptional()
  @IsString()
  processMapUrl?: string;

  @IsOptional()
  @IsArray()
  documentation?: unknown[];

  @IsOptional()
  @IsString()
  improvementOpportunities?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  biaStatus?: string;

  @IsOptional()
  @IsDateString()
  biaCompletedAt?: string;

  @IsOptional()
  @IsString()
  biaCompletedById?: string;

  @IsOptional()
  @IsDateString()
  biaLastReviewedAt?: string;

  @IsOptional()
  @IsDateString()
  biaNextReviewDue?: string;

  @IsOptional()
  @IsBoolean()
  bcpEnabled?: boolean;

  @IsOptional()
  @IsString()
  bcpCriticality?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  recoveryTimeObjectiveMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recoveryPointObjectiveMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maximumTolerableDowntimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStaff?: number;

  @IsOptional()
  @IsString()
  backupOwnerId?: string;

  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  peakPeriods?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  criticalRoles?: unknown[];

  @IsOptional()
  @IsArray()
  requiredSkills?: unknown[];

  @IsOptional()
  @IsArray()
  systemDependencies?: unknown[];

  @IsOptional()
  @IsArray()
  supplierDependencies?: unknown[];

  @IsOptional()
  @IsString()
  alternateProcesses?: string;

  @IsOptional()
  @IsString()
  workaroundProcedures?: string;

  @IsOptional()
  @IsString()
  manualProcedures?: string;

  @IsOptional()
  @IsArray()
  recoveryStrategies?: unknown[];

  @IsOptional()
  @IsInt()
  @Min(0)
  workRecoveryTimeMinutes?: number;

  @IsOptional()
  @IsString()
  minimumBusinessContinuityObjective?: string;

  @IsOptional()
  @IsObject()
  volumeMetrics?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  performanceIndicators?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  seasonalVariations?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  parentProcessId?: string;

  @IsOptional()
  @IsString()
  upstreamBias?: string;

  @IsOptional()
  @IsString()
  downstreamBias?: string;
}

export class UpdateBusinessProcessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  processType?: string;

  @IsOptional()
  @IsString()
  criticalityLevel?: string;

  @IsOptional()
  @IsString()
  processOwnerId?: string;

  @IsOptional()
  @IsString()
  processManagerId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  inputs?: unknown[];

  @IsOptional()
  @IsArray()
  outputs?: unknown[];

  @IsOptional()
  @IsArray()
  keyActivities?: unknown[];

  @IsOptional()
  @IsArray()
  stakeholders?: unknown[];

  @IsOptional()
  @IsArray()
  kpis?: unknown[];

  @IsOptional()
  @IsInt()
  @Min(0)
  cycleTimeHours?: number;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  automationLevel?: string;

  @IsOptional()
  @IsArray()
  complianceRequirements?: unknown[];

  @IsOptional()
  @IsString()
  riskRating?: string;

  @IsOptional()
  @IsDateString()
  lastReviewDate?: string;

  @IsOptional()
  @IsDateString()
  nextReviewDate?: string;

  @IsOptional()
  @IsString()
  sopReference?: string;

  @IsOptional()
  @IsString()
  processMapUrl?: string;

  @IsOptional()
  @IsArray()
  documentation?: unknown[];

  @IsOptional()
  @IsString()
  improvementOpportunities?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  biaStatus?: string;

  @IsOptional()
  @IsDateString()
  biaCompletedAt?: string;

  @IsOptional()
  @IsString()
  biaCompletedById?: string;

  @IsOptional()
  @IsDateString()
  biaLastReviewedAt?: string;

  @IsOptional()
  @IsDateString()
  biaNextReviewDue?: string;

  @IsOptional()
  @IsBoolean()
  bcpEnabled?: boolean;

  @IsOptional()
  @IsString()
  bcpCriticality?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  recoveryTimeObjectiveMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recoveryPointObjectiveMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maximumTolerableDowntimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minimumStaff?: number;

  @IsOptional()
  @IsString()
  backupOwnerId?: string;

  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  peakPeriods?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  criticalRoles?: unknown[];

  @IsOptional()
  @IsArray()
  requiredSkills?: unknown[];

  @IsOptional()
  @IsArray()
  systemDependencies?: unknown[];

  @IsOptional()
  @IsArray()
  supplierDependencies?: unknown[];

  @IsOptional()
  @IsString()
  alternateProcesses?: string;

  @IsOptional()
  @IsString()
  workaroundProcedures?: string;

  @IsOptional()
  @IsString()
  manualProcedures?: string;

  @IsOptional()
  @IsArray()
  recoveryStrategies?: unknown[];

  @IsOptional()
  @IsInt()
  @Min(0)
  workRecoveryTimeMinutes?: number;

  @IsOptional()
  @IsString()
  minimumBusinessContinuityObjective?: string;

  @IsOptional()
  @IsObject()
  volumeMetrics?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  performanceIndicators?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  seasonalVariations?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  parentProcessId?: string;

  @IsOptional()
  @IsString()
  upstreamBias?: string;

  @IsOptional()
  @IsString()
  downstreamBias?: string;
}

export class CreateCommitteeMeetingDto {
  @IsString()
  committeeId!: string;

  @IsOptional()
  @IsString()
  meetingNumber?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  meetingType?: string;

  @IsDateString()
  meetingDate!: string;

  @IsString()
  startTime!: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  locationType?: string;

  @IsOptional()
  @IsString()
  physicalLocation?: string;

  @IsOptional()
  @IsString()
  virtualMeetingLink?: string;

  @IsOptional()
  @IsString()
  virtualMeetingId?: string;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  minutes?: string;

  @IsOptional()
  @IsString()
  chairId?: string;

  @IsOptional()
  @IsString()
  secretaryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedAttendeesCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  actualAttendeesCount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  quorumAchieved?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  quorumRequirement?: number;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  nextMeetingScheduled?: boolean;

  @IsOptional()
  @IsArray()
  attachments?: unknown[];

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsDateString()
  postponedToDate?: string;
}

export class UpdateCommitteeMeetingDto {
  @IsOptional()
  @IsString()
  committeeId?: string;

  @IsOptional()
  @IsString()
  meetingNumber?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  meetingType?: string;

  @IsOptional()
  @IsDateString()
  meetingDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  locationType?: string;

  @IsOptional()
  @IsString()
  physicalLocation?: string;

  @IsOptional()
  @IsString()
  virtualMeetingLink?: string;

  @IsOptional()
  @IsString()
  virtualMeetingId?: string;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  minutes?: string;

  @IsOptional()
  @IsString()
  chairId?: string;

  @IsOptional()
  @IsString()
  secretaryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedAttendeesCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  actualAttendeesCount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  quorumAchieved?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  quorumRequirement?: number;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  nextMeetingScheduled?: boolean;

  @IsOptional()
  @IsArray()
  attachments?: unknown[];

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsDateString()
  postponedToDate?: string;
}

export class CreateCommitteeMembershipDto {
  @IsString()
  userId!: string;

  @IsString()
  committeeId!: string;

  @IsString()
  role!: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsBoolean()
  votingRights?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateCommitteeMembershipDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  committeeId?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsBoolean()
  votingRights?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateContextIssueDto {
  @IsString()
  issueCode!: string;

  @IsString()
  issueType!: string;

  @IsString()
  category!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  impactType?: string;

  @IsOptional()
  @IsString()
  impactLevel?: string;

  @IsOptional()
  @IsString()
  likelihood?: string;

  @IsOptional()
  @IsString()
  ismsRelevance?: string;

  @IsOptional()
  @IsArray()
  affectedAreas?: unknown[];

  @IsOptional()
  @IsString()
  controlImplications?: string;

  @IsOptional()
  @IsString()
  responseStrategy?: string;

  @IsOptional()
  @IsArray()
  mitigationActions?: unknown[];

  @IsOptional()
  @IsString()
  responsiblePartyId?: string;

  @IsOptional()
  @IsString()
  monitoringFrequency?: string;

  @IsOptional()
  @IsDateString()
  lastReviewDate?: string;

  @IsOptional()
  @IsDateString()
  nextReviewDate?: string;

  @IsOptional()
  @IsString()
  trendDirection?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  escalatedToRisk?: boolean;

  @IsOptional()
  @IsString()
  linkedRiskId?: string;
}

export class UpdateContextIssueDto {
  @IsOptional()
  @IsString()
  issueType?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  impactType?: string;

  @IsOptional()
  @IsString()
  impactLevel?: string;

  @IsOptional()
  @IsString()
  likelihood?: string;

  @IsOptional()
  @IsString()
  ismsRelevance?: string;

  @IsOptional()
  @IsArray()
  affectedAreas?: unknown[];

  @IsOptional()
  @IsString()
  controlImplications?: string;

  @IsOptional()
  @IsString()
  responseStrategy?: string;

  @IsOptional()
  @IsArray()
  mitigationActions?: unknown[];

  @IsOptional()
  @IsString()
  responsiblePartyId?: string;

  @IsOptional()
  @IsString()
  monitoringFrequency?: string;

  @IsOptional()
  @IsDateString()
  lastReviewDate?: string;

  @IsOptional()
  @IsDateString()
  nextReviewDate?: string;

  @IsOptional()
  @IsString()
  trendDirection?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  escalatedToRisk?: boolean;

  @IsOptional()
  @IsString()
  linkedRiskId?: string;
}

export class CreateExecutivePositionDto {
  @IsString()
  title!: string;

  @IsString()
  executiveLevel!: string;

  @IsOptional()
  @IsString()
  personId?: string;

  @IsOptional()
  @IsString()
  reportsToId?: string;

  @IsOptional()
  @IsString()
  authorityLevel?: string;

  @IsOptional()
  @IsString()
  securityResponsibilities?: string;

  @IsOptional()
  @IsString()
  riskAuthorityLevel?: string;

  @IsOptional()
  @IsBoolean()
  budgetAuthority?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isCeo?: boolean;

  @IsOptional()
  @IsBoolean()
  isSecurityCommitteeMember?: boolean;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateExecutivePositionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  executiveLevel?: string;

  @IsOptional()
  @IsString()
  personId?: string;

  @IsOptional()
  @IsString()
  reportsToId?: string;

  @IsOptional()
  @IsString()
  authorityLevel?: string;

  @IsOptional()
  @IsString()
  securityResponsibilities?: string;

  @IsOptional()
  @IsString()
  riskAuthorityLevel?: string;

  @IsOptional()
  @IsBoolean()
  budgetAuthority?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isCeo?: boolean;

  @IsOptional()
  @IsBoolean()
  isSecurityCommitteeMember?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateExternalDependencyDto {
  @IsString()
  name!: string;

  @IsString()
  dependencyType!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  vendorWebsite?: string;

  @IsString()
  criticalityLevel!: string;

  @IsOptional()
  @IsString()
  businessImpact?: string;

  @IsOptional()
  @IsBoolean()
  singlePointOfFailure?: boolean;

  @IsOptional()
  @IsString()
  contractReference?: string;

  @IsDateString()
  contractStart!: string;

  @IsDateString()
  contractEnd!: string;

  @IsOptional()
  @IsNumber()
  annualCost?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsObject()
  slaDetails?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  dataProcessed?: unknown[];

  @IsOptional()
  @IsString()
  dataLocation?: string;

  @IsOptional()
  @IsArray()
  complianceCertifications?: unknown[];

  @IsOptional()
  @IsDateString()
  lastAssessmentDate?: string;

  @IsOptional()
  @IsString()
  riskRating?: string;

  @IsOptional()
  @IsString()
  primaryContact?: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsArray()
  alternativeProviders?: unknown[];

  @IsOptional()
  @IsString()
  exitStrategy?: string;

  @IsOptional()
  @IsString()
  dataRecoveryProcedure?: string;
}

export class UpdateExternalDependencyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  dependencyType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendorWebsite?: string;

  @IsOptional()
  @IsString()
  criticalityLevel?: string;

  @IsOptional()
  @IsString()
  businessImpact?: string;

  @IsOptional()
  @IsBoolean()
  singlePointOfFailure?: boolean;

  @IsOptional()
  @IsString()
  contractReference?: string;

  @IsOptional()
  @IsDateString()
  contractStart?: string;

  @IsOptional()
  @IsDateString()
  contractEnd?: string;

  @IsOptional()
  @IsNumber()
  annualCost?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsObject()
  slaDetails?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  dataProcessed?: unknown[];

  @IsOptional()
  @IsString()
  dataLocation?: string;

  @IsOptional()
  @IsArray()
  complianceCertifications?: unknown[];

  @IsOptional()
  @IsDateString()
  lastAssessmentDate?: string;

  @IsOptional()
  @IsString()
  riskRating?: string;

  @IsOptional()
  @IsString()
  primaryContact?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsArray()
  alternativeProviders?: unknown[];

  @IsOptional()
  @IsString()
  exitStrategy?: string;

  @IsOptional()
  @IsString()
  dataRecoveryProcedure?: string;
}

export class CreateKeyPersonnelDto {
  @IsString()
  personCode!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  name!: string;

  @IsString()
  jobTitle!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsString()
  ismsRole!: string;

  @IsOptional()
  @IsString()
  securityResponsibilities?: string;

  @IsOptional()
  @IsString()
  authorityLevel?: string;

  @IsOptional()
  @IsString()
  backupPersonId?: string;

  @IsOptional()
  @IsBoolean()
  trainingCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  lastTrainingDate?: string;

  @IsOptional()
  @IsArray()
  certifications?: unknown[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateKeyPersonnelDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  ismsRole?: string;

  @IsOptional()
  @IsString()
  securityResponsibilities?: string;

  @IsOptional()
  @IsString()
  authorityLevel?: string;

  @IsOptional()
  @IsString()
  backupPersonId?: string;

  @IsOptional()
  @IsBoolean()
  trainingCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  lastTrainingDate?: string;

  @IsOptional()
  @IsArray()
  certifications?: unknown[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateMeetingActionItemDto {
  @IsString()
  meetingId!: string;

  @IsOptional()
  @IsString()
  actionNumber?: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  assignedById?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @IsOptional()
  @IsString()
  completionNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  progressPercentage?: number;

  @IsOptional()
  @IsString()
  lastUpdateNotes?: string;

  @IsOptional()
  @IsString()
  dependsOnId?: string;

  @IsOptional()
  @IsString()
  blockingReason?: string;

  @IsOptional()
  @IsBoolean()
  requiresCommitteeReview?: boolean;

  @IsOptional()
  @IsBoolean()
  reviewed?: boolean;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;
}

export class UpdateMeetingActionItemDto {
  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsString()
  actionNumber?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  assignedById?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @IsOptional()
  @IsString()
  completionNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  progressPercentage?: number;

  @IsOptional()
  @IsString()
  lastUpdateNotes?: string;

  @IsOptional()
  @IsString()
  dependsOnId?: string;

  @IsOptional()
  @IsString()
  blockingReason?: string;

  @IsOptional()
  @IsBoolean()
  requiresCommitteeReview?: boolean;

  @IsOptional()
  @IsBoolean()
  reviewed?: boolean;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;
}

export class CreateMeetingAttendanceDto {
  @IsString()
  meetingId!: string;

  @IsString()
  memberId!: string;

  @IsOptional()
  @IsString()
  membershipId?: string;

  @IsOptional()
  @IsString()
  attendanceStatus?: string;

  @IsOptional()
  @IsString()
  arrivalTime?: string;

  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsOptional()
  @IsBoolean()
  participatedInVoting?: boolean;

  @IsOptional()
  @IsBoolean()
  contributedToDiscussion?: boolean;

  @IsOptional()
  @IsString()
  absenceReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  proxyAttendeeId?: string;
}

export class UpdateMeetingAttendanceDto {
  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  membershipId?: string;

  @IsOptional()
  @IsString()
  attendanceStatus?: string;

  @IsOptional()
  @IsString()
  arrivalTime?: string;

  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsOptional()
  @IsBoolean()
  participatedInVoting?: boolean;

  @IsOptional()
  @IsBoolean()
  contributedToDiscussion?: boolean;

  @IsOptional()
  @IsString()
  absenceReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  proxyAttendeeId?: string;
}

export class BulkMeetingAttendanceItemDto {
  @IsString()
  memberId!: string;

  @IsString()
  attendanceStatus!: string;
}

export class BulkMeetingAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMeetingAttendanceItemDto)
  attendances!: BulkMeetingAttendanceItemDto[];
}

export class CreateMeetingDecisionDto {
  @IsString()
  meetingId!: string;

  @IsOptional()
  @IsString()
  decisionNumber?: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  decisionType!: string;

  @IsOptional()
  @IsString()
  rationale?: string;

  @IsOptional()
  @IsString()
  voteType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  votesFor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  votesAgainst?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  votesAbstain?: number;

  @IsOptional()
  @IsString()
  responsiblePartyId?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @IsOptional()
  @IsDateString()
  implementationDeadline?: string;

  @IsOptional()
  @IsBoolean()
  implemented?: boolean;

  @IsOptional()
  @IsDateString()
  implementationDate?: string;

  @IsOptional()
  @IsString()
  implementationNotes?: string;

  @IsOptional()
  @IsArray()
  relatedDocuments?: unknown[];
}

export class UpdateMeetingDecisionDto {
  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsString()
  decisionNumber?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  decisionType?: string;

  @IsOptional()
  @IsString()
  rationale?: string;

  @IsOptional()
  @IsString()
  voteType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  votesFor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  votesAgainst?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  votesAbstain?: number;

  @IsOptional()
  @IsString()
  responsiblePartyId?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @IsOptional()
  @IsDateString()
  implementationDeadline?: string;

  @IsOptional()
  @IsBoolean()
  implemented?: boolean;

  @IsOptional()
  @IsDateString()
  implementationDate?: string;

  @IsOptional()
  @IsString()
  implementationNotes?: string;

  @IsOptional()
  @IsArray()
  relatedDocuments?: unknown[];
}

export class CreateOrganisationalUnitDto {
  @IsString()
  name!: string;

  @IsString()
  unitType!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  headId?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  budgetCurrency?: string;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  establishedDate?: string;
}

export class UpdateOrganisationalUnitDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  unitType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  headId?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  budgetCurrency?: string;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  establishedDate?: string;
}

export class CreateProductServiceDto {
  @IsString()
  productCode!: string;

  @IsString()
  name!: string;

  @IsString()
  productType!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  customerFacing?: boolean;

  @IsOptional()
  @IsBoolean()
  internalOnly?: boolean;

  @IsOptional()
  @IsString()
  revenueContribution?: string;

  @IsOptional()
  @IsString()
  pricingModel?: string;

  @IsOptional()
  @IsString()
  targetMarket?: string;

  @IsOptional()
  @IsString()
  lifecycleStage?: string;

  @IsOptional()
  @IsDateString()
  launchDate?: string;

  @IsOptional()
  @IsDateString()
  sunsetDate?: string;

  @IsOptional()
  @IsString()
  productOwnerId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  dataClassification?: string;

  @IsOptional()
  @IsBoolean()
  containsPersonalData?: boolean;

  @IsOptional()
  @IsBoolean()
  containsSensitiveData?: boolean;

  @IsOptional()
  @IsArray()
  complianceRequirements?: unknown[];

  @IsOptional()
  @IsBoolean()
  inIsmsScope?: boolean;

  @IsOptional()
  @IsString()
  scopeJustification?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  customerFacing?: boolean;

  @IsOptional()
  @IsBoolean()
  internalOnly?: boolean;

  @IsOptional()
  @IsString()
  revenueContribution?: string;

  @IsOptional()
  @IsString()
  pricingModel?: string;

  @IsOptional()
  @IsString()
  targetMarket?: string;

  @IsOptional()
  @IsString()
  lifecycleStage?: string;

  @IsOptional()
  @IsDateString()
  launchDate?: string;

  @IsOptional()
  @IsDateString()
  sunsetDate?: string;

  @IsOptional()
  @IsString()
  productOwnerId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  dataClassification?: string;

  @IsOptional()
  @IsBoolean()
  containsPersonalData?: boolean;

  @IsOptional()
  @IsBoolean()
  containsSensitiveData?: boolean;

  @IsOptional()
  @IsArray()
  complianceRequirements?: unknown[];

  @IsOptional()
  @IsBoolean()
  inIsmsScope?: boolean;

  @IsOptional()
  @IsString()
  scopeJustification?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRegulatorDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  acronym?: string;

  @IsString()
  regulatorType!: string;

  @IsString()
  jurisdiction!: string;

  @IsString()
  jurisdictionLevel!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactAddress?: string;

  @IsOptional()
  @IsArray()
  keyRegulations?: unknown[];

  @IsOptional()
  @IsArray()
  applicableStandards?: unknown[];

  @IsOptional()
  @IsString()
  registrationStatus?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @IsOptional()
  @IsDateString()
  lastInspectionDate?: string;

  @IsOptional()
  @IsDateString()
  nextInspectionDate?: string;

  @IsOptional()
  @IsString()
  reportingFrequency?: string;

  @IsOptional()
  @IsDateString()
  lastReportDate?: string;

  @IsOptional()
  @IsDateString()
  nextReportDate?: string;

  @IsOptional()
  @IsArray()
  penaltiesFines?: unknown[];

  @IsOptional()
  @IsString()
  complianceNotes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRegulatorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  acronym?: string;

  @IsOptional()
  @IsString()
  regulatorType?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  jurisdictionLevel?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactAddress?: string;

  @IsOptional()
  @IsArray()
  keyRegulations?: unknown[];

  @IsOptional()
  @IsArray()
  applicableStandards?: unknown[];

  @IsOptional()
  @IsString()
  registrationStatus?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsDateString()
  registrationDate?: string;

  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @IsOptional()
  @IsDateString()
  lastInspectionDate?: string;

  @IsOptional()
  @IsDateString()
  nextInspectionDate?: string;

  @IsOptional()
  @IsString()
  reportingFrequency?: string;

  @IsOptional()
  @IsDateString()
  lastReportDate?: string;

  @IsOptional()
  @IsDateString()
  nextReportDate?: string;

  @IsOptional()
  @IsArray()
  penaltiesFines?: unknown[];

  @IsOptional()
  @IsString()
  complianceNotes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRegulatoryEligibilitySurveyDto {
  @IsString()
  surveyType!: string;

  @IsOptional()
  @IsString()
  surveyVersion?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsBoolean()
  isApplicable?: boolean;

  @IsOptional()
  @IsString()
  applicabilityReason?: string;

  @IsOptional()
  @IsString()
  entityClassification?: string;

  @IsOptional()
  @IsString()
  regulatoryRegime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRegulatoryEligibilitySurveyDto {
  @IsOptional()
  @IsString()
  surveyType?: string;

  @IsOptional()
  @IsString()
  surveyVersion?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsBoolean()
  isApplicable?: boolean;

  @IsOptional()
  @IsString()
  applicabilityReason?: string;

  @IsOptional()
  @IsString()
  entityClassification?: string;

  @IsOptional()
  @IsString()
  regulatoryRegime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSurveyQuestionDto {
  @IsString()
  surveyType!: string;

  @IsString()
  stepNumber!: string;

  @IsString()
  stepCategory!: string;

  @IsString()
  questionText!: string;

  @IsOptional()
  @IsString()
  ifYes?: string;

  @IsOptional()
  @IsString()
  ifNo?: string;

  @IsOptional()
  @IsString()
  legalReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  sortOrder!: number;
}

export class UpdateSurveyQuestionDto {
  @IsOptional()
  @IsString()
  surveyType?: string;

  @IsOptional()
  @IsString()
  stepNumber?: string;

  @IsOptional()
  @IsString()
  stepCategory?: string;

  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsString()
  ifYes?: string;

  @IsOptional()
  @IsString()
  ifNo?: string;

  @IsOptional()
  @IsString()
  legalReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateSurveyResponseDto {
  @IsString()
  questionId!: string;

  @IsString()
  answer!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SeedSurveyQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions!: CreateSurveyQuestionDto[];
}

export class CompleteSurveyDto {
  @IsOptional()
  @IsBoolean()
  isApplicable?: boolean;

  @IsOptional()
  @IsString()
  applicabilityReason?: string;

  @IsOptional()
  @IsString()
  entityClassification?: string;

  @IsOptional()
  @IsString()
  regulatoryRegime?: string;

  @IsOptional()
  @IsString()
  organisationId?: string;

  @IsOptional()
  @IsBoolean()
  propagateScope?: boolean;
}

export class PropagateScopeDto {
  @IsOptional()
  @IsString()
  organisationId?: string;
}

export class CreateSecurityChampionDto {
  @IsString()
  userId!: string;

  @IsString()
  departmentId!: string;

  @IsString()
  championLevel!: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsBoolean()
  trainingCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  lastTrainingDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateSecurityChampionDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  championLevel?: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsBoolean()
  trainingCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  lastTrainingDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateSecurityCommitteeDto {
  @IsString()
  name!: string;

  @IsString()
  committeeType!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  chairId?: string;

  @IsOptional()
  @IsString()
  authorityLevel?: string;

  @IsString()
  meetingFrequency!: string;

  @IsOptional()
  @IsDateString()
  nextMeetingDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsDateString()
  establishedDate!: string;

  @IsOptional()
  @IsDateString()
  dissolvedDate?: string;
}

export class UpdateSecurityCommitteeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  committeeType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  chairId?: string;

  @IsOptional()
  @IsString()
  authorityLevel?: string;

  @IsOptional()
  @IsString()
  meetingFrequency?: string;

  @IsOptional()
  @IsDateString()
  nextMeetingDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  establishedDate?: string;

  @IsOptional()
  @IsDateString()
  dissolvedDate?: string;
}

export class CreateTechnologyPlatformDto {
  @IsString()
  platformCode!: string;

  @IsString()
  name!: string;

  @IsString()
  platformType!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  vendorWebsite?: string;

  @IsOptional()
  @IsString()
  supportContact?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsOptional()
  @IsString()
  hostingLocation?: string;

  @IsOptional()
  @IsString()
  cloudProvider?: string;

  @IsOptional()
  @IsString()
  deploymentModel?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  architecture?: string;

  @IsOptional()
  @IsArray()
  integrations?: unknown[];

  @IsOptional()
  @IsString()
  dataStorageLocation?: string;

  @IsOptional()
  @IsString()
  criticalityLevel?: string;

  @IsOptional()
  @IsString()
  businessImpact?: string;

  @IsOptional()
  @IsString()
  riskRating?: string;

  @IsOptional()
  @IsDateString()
  implementationDate?: string;

  @IsOptional()
  @IsDateString()
  endOfLifeDate?: string;

  @IsOptional()
  @IsDateString()
  lastUpgradeDate?: string;

  @IsOptional()
  @IsDateString()
  nextUpgradeDate?: string;

  @IsOptional()
  @IsString()
  technicalOwnerId?: string;

  @IsOptional()
  @IsString()
  businessOwnerId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  complianceCertifications?: unknown[];

  @IsOptional()
  @IsString()
  dataClassification?: string;

  @IsOptional()
  @IsBoolean()
  inIsmsScope?: boolean;

  @IsOptional()
  @IsString()
  scopeJustification?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  environments?: unknown[];
}

export class UpdateTechnologyPlatformDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  platformType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  vendorWebsite?: string;

  @IsOptional()
  @IsString()
  supportContact?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsOptional()
  @IsString()
  hostingLocation?: string;

  @IsOptional()
  @IsString()
  cloudProvider?: string;

  @IsOptional()
  @IsString()
  deploymentModel?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  architecture?: string;

  @IsOptional()
  @IsArray()
  integrations?: unknown[];

  @IsOptional()
  @IsString()
  dataStorageLocation?: string;

  @IsOptional()
  @IsString()
  criticalityLevel?: string;

  @IsOptional()
  @IsString()
  businessImpact?: string;

  @IsOptional()
  @IsString()
  riskRating?: string;

  @IsOptional()
  @IsDateString()
  implementationDate?: string;

  @IsOptional()
  @IsDateString()
  endOfLifeDate?: string;

  @IsOptional()
  @IsDateString()
  lastUpgradeDate?: string;

  @IsOptional()
  @IsDateString()
  nextUpgradeDate?: string;

  @IsOptional()
  @IsString()
  technicalOwnerId?: string;

  @IsOptional()
  @IsString()
  businessOwnerId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  complianceCertifications?: unknown[];

  @IsOptional()
  @IsString()
  dataClassification?: string;

  @IsOptional()
  @IsBoolean()
  inIsmsScope?: boolean;

  @IsOptional()
  @IsString()
  scopeJustification?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  environments?: unknown[];
}
