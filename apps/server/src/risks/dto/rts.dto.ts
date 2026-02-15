import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ToleranceLevel, RTSStatus, ControlFramework, ImpactCategory } from '@prisma/client';

export class CreateRTSDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  rtsId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  objective!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  domain?: string;

  @IsEnum(ToleranceLevel)
  @IsOptional()
  proposedToleranceLevel?: ToleranceLevel;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  proposedRTS!: string;

  @IsOptional()
  conditions?: any;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  anticipatedOperationalImpact?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  rationale?: string;

  @IsEnum(RTSStatus)
  @IsOptional()
  status?: RTSStatus;

  @IsEnum(ControlFramework)
  @IsOptional()
  framework?: ControlFramework;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  controlIds?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  appetiteLevel?: string;

  @IsEnum(ImpactCategory)
  @IsOptional()
  category?: ImpactCategory;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(25)
  toleranceThreshold?: number;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @IsDateString()
  @IsOptional()
  reviewDate?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  riskIds?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  scenarioIds?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  kriIds?: string[];

  @IsString()
  @IsOptional()
  organisationId?: string;
}

export class UpdateRTSDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  objective?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  domain?: string;

  @IsEnum(ToleranceLevel)
  @IsOptional()
  proposedToleranceLevel?: ToleranceLevel;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  proposedRTS?: string;

  @IsOptional()
  conditions?: any;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  anticipatedOperationalImpact?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  rationale?: string;

  @IsEnum(RTSStatus)
  @IsOptional()
  status?: RTSStatus;

  @IsEnum(ControlFramework)
  @IsOptional()
  framework?: ControlFramework;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  controlIds?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  appetiteLevel?: string;

  @IsEnum(ImpactCategory)
  @IsOptional()
  category?: ImpactCategory;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(25)
  toleranceThreshold?: number;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @IsDateString()
  @IsOptional()
  reviewDate?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  riskIds?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  scenarioIds?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  kriIds?: string[];
}

export class LinkRisksDto {
  @IsArray()
  @IsString({ each: true })
  riskIds!: string[];
}

export class UnlinkRisksDto {
  @IsArray()
  @IsString({ each: true })
  riskIds!: string[];
}
