import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  IncidentSeverity,
  IncidentCategory,
  IncidentSource,
  IncidentStatus,
  IncidentResolutionType,
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
