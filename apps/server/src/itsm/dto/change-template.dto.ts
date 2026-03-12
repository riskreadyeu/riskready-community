import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsInt,
    IsArray,
    MinLength,
    MaxLength,
    Min,
} from 'class-validator';
import {
    ChangeCategory,
    SecurityImpact,
} from '@prisma/client';

/**
 * DTO for creating a new change template
 */
export class CreateChangeTemplateDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name!: string;

    @IsString()
    @MinLength(1)
    description!: string;

    @IsEnum(ChangeCategory)
    category!: ChangeCategory;

    @IsEnum(SecurityImpact)
    securityImpact!: SecurityImpact;

    @IsString()
    riskLevel!: string;

    @IsString()
    @MinLength(1)
    instructions!: string;

    @IsString()
    @MinLength(1)
    backoutPlan!: string;

    @IsOptional()
    @IsString()
    testPlan?: string;

    @IsOptional()
    @IsBoolean()
    autoApprove?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxDuration?: number;

    @IsOptional()
    @IsArray()
    applicableAssetTypes?: string[];
}

/**
 * DTO for updating an existing change template
 */
export class UpdateChangeTemplateDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ChangeCategory)
    category?: ChangeCategory;

    @IsOptional()
    @IsEnum(SecurityImpact)
    securityImpact?: SecurityImpact;

    @IsOptional()
    @IsString()
    riskLevel?: string;

    @IsOptional()
    @IsString()
    instructions?: string;

    @IsOptional()
    @IsString()
    backoutPlan?: string;

    @IsOptional()
    @IsString()
    testPlan?: string;

    @IsOptional()
    @IsBoolean()
    autoApprove?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxDuration?: number;

    @IsOptional()
    @IsArray()
    applicableAssetTypes?: string[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class CreateChangeFromTemplateDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    plannedStart?: string;

    @IsOptional()
    @IsString()
    plannedEnd?: string;
}

export class ToggleChangeTemplateDto {
    @IsBoolean()
    isActive!: boolean;
}
