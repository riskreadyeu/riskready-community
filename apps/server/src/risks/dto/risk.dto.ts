import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  RiskTier,
  RiskStatus,
  ControlFramework,
  LikelihoodLevel,
  ImpactLevel,
  TreatmentType,
  TreatmentStatus,
  TreatmentPriority,
  ActionStatus,
  CollectionFrequency,
  RAGStatus,
  Prisma,
} from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateRiskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  riskId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(RiskTier)
  @IsOptional()
  tier?: RiskTier;

  @IsEnum(RiskStatus)
  @IsOptional()
  status?: RiskStatus;

  @IsEnum(ControlFramework)
  @IsOptional()
  framework?: ControlFramework;

  @IsString()
  @IsOptional()
  riskOwner?: string;

  @IsBoolean()
  @IsOptional()
  applicable?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  justificationIfNa?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  soc2Criteria?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  tscCategory?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  orgSize?: string;

  @IsString()
  @IsOptional()
  likelihood?: string;

  @IsString()
  @IsOptional()
  impact?: string;

  @IsString()
  organisationId!: string;
}

export class UpdateRiskDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(RiskTier)
  @IsOptional()
  tier?: RiskTier;

  @IsEnum(RiskStatus)
  @IsOptional()
  status?: RiskStatus;

  @IsEnum(ControlFramework)
  @IsOptional()
  framework?: ControlFramework;

  @IsString()
  @IsOptional()
  likelihood?: string;

  @IsString()
  @IsOptional()
  impact?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(25)
  inherentScore?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(25)
  residualScore?: number;

  @IsString()
  @IsOptional()
  riskOwner?: string;

  @IsString()
  @IsOptional()
  treatmentPlan?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  acceptanceCriteria?: string;

  @IsBoolean()
  @IsOptional()
  applicable?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  justificationIfNa?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  soc2Criteria?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  tscCategory?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  orgSize?: string;
}

export class DisableRiskDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason!: string;
}

export class CreateScenarioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  scenarioId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  cause?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  event?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  consequence?: string;

  @IsEnum(ControlFramework)
  @IsOptional()
  framework?: ControlFramework;

  @IsEnum(LikelihoodLevel)
  @IsOptional()
  likelihood?: LikelihoodLevel;

  @IsEnum(ImpactLevel)
  @IsOptional()
  impact?: ImpactLevel;

  @IsEnum(LikelihoodLevel)
  @IsOptional()
  residualLikelihood?: LikelihoodLevel;

  @IsEnum(ImpactLevel)
  @IsOptional()
  residualImpact?: ImpactLevel;

  @IsString()
  @IsOptional()
  controlIds?: string;

  @IsString()
  riskId!: string;
}

export class UpdateScenarioDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  cause?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  event?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  consequence?: string;

  @IsEnum(ControlFramework)
  @IsOptional()
  framework?: ControlFramework;

  @IsEnum(LikelihoodLevel)
  @IsOptional()
  likelihood?: LikelihoodLevel;

  @IsEnum(ImpactLevel)
  @IsOptional()
  impact?: ImpactLevel;

  @IsEnum(LikelihoodLevel)
  @IsOptional()
  residualLikelihood?: LikelihoodLevel;

  @IsEnum(ImpactLevel)
  @IsOptional()
  residualImpact?: ImpactLevel;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  residualOverrideJustification?: string;

  @IsString()
  @IsOptional()
  controlIds?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(25)
  toleranceThreshold?: number;
}

export class CreateTreatmentPlanDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  treatmentId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsEnum(TreatmentType)
  @IsOptional()
  treatmentType?: TreatmentType;

  @IsEnum(TreatmentPriority)
  @IsOptional()
  priority?: TreatmentPriority;

  @IsEnum(TreatmentStatus)
  @IsOptional()
  status?: TreatmentStatus;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(25)
  targetResidualScore?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  expectedReduction?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  costBenefit?: string;

  @IsDateString()
  @IsOptional()
  targetStartDate?: string;

  @IsDateString()
  @IsOptional()
  targetEndDate?: string;

  @IsString()
  @IsOptional()
  riskOwnerId?: string;

  @IsString()
  @IsOptional()
  implementerId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  acceptanceRationale?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  acceptanceCriteria?: string;

  @IsOptional()
  acceptanceConditions?: Prisma.InputJsonValue;

  @IsDateString()
  @IsOptional()
  acceptanceExpiryDate?: string;

  @IsString()
  @IsOptional()
  controlIds?: string;

  @IsString()
  @IsOptional()
  scenarioId?: string;

  @IsString()
  riskId!: string;

  @IsString()
  @IsOptional()
  organisationId?: string;
}

export class UpdateTreatmentPlanDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TreatmentType)
  @IsOptional()
  treatmentType?: TreatmentType;

  @IsEnum(TreatmentPriority)
  @IsOptional()
  priority?: TreatmentPriority;

  @IsEnum(TreatmentStatus)
  @IsOptional()
  status?: TreatmentStatus;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(25)
  targetResidualScore?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(25)
  currentResidualScore?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  expectedReduction?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  actualCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  costBenefit?: string;

  @IsNumber()
  @IsOptional()
  roi?: number;

  @IsDateString()
  @IsOptional()
  proposedDate?: string;

  @IsDateString()
  @IsOptional()
  approvedDate?: string;

  @IsDateString()
  @IsOptional()
  targetStartDate?: string;

  @IsDateString()
  @IsOptional()
  targetEndDate?: string;

  @IsDateString()
  @IsOptional()
  actualStartDate?: string;

  @IsDateString()
  @IsOptional()
  actualEndDate?: string;

  @IsString()
  @IsOptional()
  riskOwnerId?: string;

  @IsString()
  @IsOptional()
  implementerId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  acceptanceRationale?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  acceptanceCriteria?: string;

  @IsOptional()
  acceptanceConditions?: Prisma.InputJsonValue;

  @IsDateString()
  @IsOptional()
  acceptanceExpiryDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  progressNotes?: string;

  @IsString()
  @IsOptional()
  controlIds?: string;

  @IsString()
  @IsOptional()
  scenarioId?: string;
}

export class CreateTreatmentActionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  actionId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ActionStatus)
  @IsOptional()
  status?: ActionStatus;

  @IsEnum(TreatmentPriority)
  @IsOptional()
  priority?: TreatmentPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedHours?: number;
}

export class CreateKRIDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  kriId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(RiskTier)
  @IsOptional()
  tier?: RiskTier;

  @IsEnum(ControlFramework)
  @IsOptional()
  framework?: ControlFramework;

  @IsEnum(CollectionFrequency)
  @IsOptional()
  frequency?: CollectionFrequency;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  thresholdGreen?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  thresholdAmber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  thresholdRed?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  formula?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  dataSource?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  soc2Criteria?: string;

  @IsString()
  riskId!: string;
}

export class UpdateKRIValueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  value!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class TransitionScenarioDto {
  @IsString()
  targetStatus!: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(2000)
  justification?: string;

  @IsString()
  @IsOptional()
  treatmentPlanId?: string;

  @IsString()
  @IsOptional()
  escalationTargetId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  escalationReason?: string;
}

export class RenewAcceptanceDto {
  @IsDateString()
  newExpiryDate!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  renewalReason!: string;
}
