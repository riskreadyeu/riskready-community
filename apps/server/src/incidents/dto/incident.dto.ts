import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsArray,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  IncidentSeverity,
  IncidentCategory,
  IncidentSource,
  IncidentStatus,
  IncidentResolutionType,
  LessonsLearnedCategory,
  LessonsLearnedStatus,
} from '@prisma/client';

export class CreateIncidentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description!: string;

  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @IsEnum(IncidentCategory)
  @IsOptional()
  category?: IncidentCategory;

  @IsEnum(IncidentSource)
  source!: IncidentSource;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sourceRef?: string;

  @IsDateString()
  detectedAt!: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;

  @IsString()
  @IsOptional()
  incidentTypeId?: string;

  @IsString()
  @IsOptional()
  attackVectorId?: string;

  @IsString()
  @IsOptional()
  handlerId?: string;

  @IsString()
  @IsOptional()
  incidentManagerId?: string;

  @IsString()
  @IsOptional()
  reporterId?: string;

  @IsString()
  @IsOptional()
  organisationId?: string;

  @IsBoolean()
  @IsOptional()
  confidentialityBreach?: boolean;

  @IsBoolean()
  @IsOptional()
  integrityBreach?: boolean;

  @IsBoolean()
  @IsOptional()
  availabilityBreach?: boolean;
}

export class UpdateIncidentDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsEnum(IncidentSeverity)
  @IsOptional()
  severity?: IncidentSeverity;

  @IsEnum(IncidentCategory)
  @IsOptional()
  category?: IncidentCategory;

  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @IsEnum(IncidentSource)
  @IsOptional()
  source?: IncidentSource;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sourceRef?: string;

  @IsDateString()
  @IsOptional()
  detectedAt?: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;

  @IsDateString()
  @IsOptional()
  reportedAt?: string;

  @IsDateString()
  @IsOptional()
  classifiedAt?: string;

  @IsDateString()
  @IsOptional()
  containedAt?: string;

  @IsDateString()
  @IsOptional()
  eradicatedAt?: string;

  @IsDateString()
  @IsOptional()
  recoveredAt?: string;

  @IsDateString()
  @IsOptional()
  closedAt?: string;

  @IsString()
  @IsOptional()
  reporterId?: string;

  @IsString()
  @IsOptional()
  handlerId?: string;

  @IsString()
  @IsOptional()
  incidentManagerId?: string;

  @IsString()
  @IsOptional()
  incidentTypeId?: string;

  @IsString()
  @IsOptional()
  attackVectorId?: string;

  @IsBoolean()
  @IsOptional()
  isConfirmed?: boolean;

  @IsEnum(IncidentResolutionType)
  @IsOptional()
  resolutionType?: IncidentResolutionType;

  @IsBoolean()
  @IsOptional()
  confidentialityBreach?: boolean;

  @IsBoolean()
  @IsOptional()
  integrityBreach?: boolean;

  @IsBoolean()
  @IsOptional()
  availabilityBreach?: boolean;

  @IsBoolean()
  @IsOptional()
  evidencePreserved?: boolean;

  @IsBoolean()
  @IsOptional()
  chainOfCustodyMaintained?: boolean;

  @IsBoolean()
  @IsOptional()
  rootCauseIdentified?: boolean;

  @IsBoolean()
  @IsOptional()
  lessonsLearnedCompleted?: boolean;

  @IsBoolean()
  @IsOptional()
  correctiveActionsIdentified?: boolean;
}

export class UpdateIncidentStatusDto {
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class NIS2AssessmentDto {
  @IsString()
  @IsOptional()
  entityType?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsBoolean()
  @IsOptional()
  causedSevereOperationalDisruption?: boolean;

  @IsBoolean()
  @IsOptional()
  causedFinancialLoss?: boolean;

  @IsNumber()
  @IsOptional()
  financialLossAmount?: number;

  @IsString()
  @IsOptional()
  financialLossCurrency?: string;

  @IsBoolean()
  @IsOptional()
  affectedOtherPersons?: boolean;

  @IsNumber()
  @IsOptional()
  affectedPersonsCount?: number;

  @IsBoolean()
  @IsOptional()
  causedMaterialDamage?: boolean;

  @IsString()
  @IsOptional()
  materialDamageDescription?: string;

  @IsBoolean()
  @IsOptional()
  hasCrossBorderImpact?: boolean;

  @IsArray()
  @IsOptional()
  affectedMemberStates?: string[];

  @IsNumber()
  @IsOptional()
  serviceAvailabilityImpactPercent?: number;

  @IsNumber()
  @IsOptional()
  serviceDegradationDurationHours?: number;

  @IsArray()
  @IsOptional()
  affectedServiceIds?: string[];
}

export class DORAAssessmentDto {
  @IsString()
  @IsOptional()
  financialEntityType?: string;

  @IsArray()
  @IsOptional()
  affectedIctServiceIds?: string[];

  @IsBoolean()
  @IsOptional()
  thirdPartyProviderInvolved?: boolean;

  @IsString()
  @IsOptional()
  thirdPartyProviderId?: string;

  @IsBoolean()
  @IsOptional()
  affectsCriticalFunction?: boolean;

  @IsArray()
  @IsOptional()
  criticalFunctionIds?: string[];

  @IsNumber()
  @IsOptional()
  clientsAffectedCount?: number;

  @IsNumber()
  @IsOptional()
  counterpartiesAffectedCount?: number;

  @IsNumber()
  @IsOptional()
  clientsAffectedPercent?: number;

  @IsBoolean()
  @IsOptional()
  mediaCoverageOccurred?: boolean;

  @IsString()
  @IsOptional()
  mediaCoverageType?: string;

  @IsNumber()
  @IsOptional()
  clientComplaintsReceived?: number;

  @IsBoolean()
  @IsOptional()
  regulatoryInquiryTriggered?: boolean;

  @IsNumber()
  @IsOptional()
  serviceDowntimeHours?: number;

  @IsNumber()
  @IsOptional()
  recoveryTimeHours?: number;

  @IsArray()
  @IsOptional()
  affectedMemberStates?: string[];

  @IsArray()
  @IsOptional()
  affectedThirdCountries?: string[];

  @IsBoolean()
  @IsOptional()
  dataIntegrityAffected?: boolean;

  @IsBoolean()
  @IsOptional()
  dataConfidentialityAffected?: boolean;

  @IsBoolean()
  @IsOptional()
  dataAvailabilityAffected?: boolean;

  @IsNumber()
  @IsOptional()
  recordsAffectedCount?: number;

  @IsBoolean()
  @IsOptional()
  involvesPersonalData?: boolean;

  @IsNumber()
  @IsOptional()
  directCosts?: number;

  @IsNumber()
  @IsOptional()
  indirectCosts?: number;

  @IsNumber()
  @IsOptional()
  economicImpactPercentOfCET1?: number;

  @IsNumber()
  @IsOptional()
  transactionsAffectedCount?: number;

  @IsNumber()
  @IsOptional()
  transactionsAffectedValue?: number;

  @IsNumber()
  @IsOptional()
  dailyAverageTransactions?: number;

  @IsNumber()
  @IsOptional()
  transactionsAffectedPercent?: number;
}

export class NIS2OverrideDto {
  @IsBoolean()
  isSignificant!: boolean;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  justification!: string;
}

export class DORAOverrideDto {
  @IsBoolean()
  isMajor!: boolean;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  justification!: string;
}

export class LinkIncidentAssetDto {
  @IsString()
  assetId!: string;

  @IsString()
  impactType!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class LinkIncidentControlDto {
  @IsString()
  controlId!: string;

  @IsString()
  linkType!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class CreateIncidentLessonDto {
  @IsEnum(LessonsLearnedCategory)
  category!: LessonsLearnedCategory;

  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  observation!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  recommendation!: string;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateIncidentLessonDto {
  @IsEnum(LessonsLearnedCategory)
  @IsOptional()
  category?: LessonsLearnedCategory;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(5000)
  observation?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(5000)
  recommendation?: string;

  @IsEnum(LessonsLearnedStatus)
  @IsOptional()
  status?: LessonsLearnedStatus;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsDateString()
  @IsOptional()
  completedDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  correctiveActionId?: string;
}

export class LinkLessonNonconformityDto {
  @IsString()
  @IsNotEmpty()
  nonconformityId!: string;
}
