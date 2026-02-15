import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ImpactCategory, ImpactLevel } from '@prisma/client';

export class UpdateFactorScoresDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f1ThreatFrequency?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f2ControlEffectiveness?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f3GapVulnerability?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f4IncidentHistory?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f5AttackSurface?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f6Environmental?: number;
}

export class ResidualScoresInput {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f1Residual?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f2Residual?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  f3Residual?: number;
}

export class ResidualOverridesInput {
  @IsBoolean()
  @IsOptional()
  f1Override?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  f1OverrideJustification?: string;

  @IsBoolean()
  @IsOptional()
  f2Override?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  f2OverrideJustification?: string;

  @IsBoolean()
  @IsOptional()
  f3Override?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  f3OverrideJustification?: string;
}

export class UpdateResidualFactorScoresDto {
  @ValidateNested()
  @IsOptional()
  @Type(() => ResidualScoresInput)
  scores?: ResidualScoresInput;

  @ValidateNested()
  @IsOptional()
  @Type(() => ResidualOverridesInput)
  overrides?: ResidualOverridesInput;
}

export class ImpactAssessmentInput {
  @IsEnum(ImpactCategory)
  category!: ImpactCategory;

  @IsEnum(ImpactLevel)
  level!: ImpactLevel;

  @IsNumber()
  @Min(1)
  @Max(5)
  value!: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  rationale?: string;
}

export class SaveImpactAssessmentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImpactAssessmentInput)
  assessments!: ImpactAssessmentInput[];

  @IsBoolean()
  @IsOptional()
  isResidual?: boolean;

  @IsString()
  @IsOptional()
  organisationId?: string;
}

export class LinkControlDto {
  @IsString()
  controlId!: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  effectivenessWeight?: number;

  @IsBoolean()
  @IsOptional()
  isPrimaryControl?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateControlLinkDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  effectivenessWeight?: number;

  @IsBoolean()
  @IsOptional()
  isPrimaryControl?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
