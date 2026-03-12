import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsInt,
    IsDateString,
    IsArray,
    ValidateNested,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    ITSMChangeType,
    ChangeCategory,
    ChangePriority,
    SecurityImpact,
    ChangeStatus,
} from '@prisma/client';

/**
 * DTO for creating a new change request
 */
export class CreateChangeDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title!: string;

    @IsString()
    @MinLength(1)
    description!: string;

    @IsEnum(ITSMChangeType)
    changeType!: ITSMChangeType;

    @IsEnum(ChangeCategory)
    category!: ChangeCategory;

    @IsOptional()
    @IsEnum(ChangePriority)
    priority?: ChangePriority;

    @IsOptional()
    @IsEnum(SecurityImpact)
    securityImpact?: SecurityImpact;

    @IsOptional()
    @IsString()
    businessJustification?: string;

    @IsOptional()
    @IsString()
    impactAssessment?: string;

    @IsOptional()
    @IsArray()
    affectedServices?: string[];

    @IsOptional()
    @IsString()
    userImpact?: string;

    @IsOptional()
    @IsString()
    riskLevel?: string;

    @IsOptional()
    @IsString()
    riskAssessment?: string;

    @IsOptional()
    @IsString()
    backoutPlan?: string;

    @IsOptional()
    @IsInt()
    rollbackTime?: number;

    @IsOptional()
    @IsString()
    testPlan?: string;

    @IsOptional()
    @IsString()
    testResults?: string;

    @IsOptional()
    @IsDateString()
    plannedStart?: string;

    @IsOptional()
    @IsDateString()
    plannedEnd?: string;

    @IsOptional()
    @IsBoolean()
    maintenanceWindow?: boolean;

    @IsOptional()
    @IsBoolean()
    outageRequired?: boolean;

    @IsOptional()
    @IsInt()
    estimatedDowntime?: number;

    @IsOptional()
    @IsBoolean()
    cabRequired?: boolean;

    @IsOptional()
    @IsString()
    implementerId?: string;

    @IsOptional()
    @IsString()
    departmentId?: string;

    @IsOptional()
    @IsString()
    parentChangeId?: string;

    @IsOptional()
    @IsString()
    vendorId?: string;

    @IsOptional()
    @IsArray()
    impactedAssets?: string[];

    @IsOptional()
    @IsBoolean()
    pirRequired?: boolean;

    @IsOptional()
    @IsString()
    successCriteria?: string;

    @IsOptional()
    @IsArray()
    attachments?: Record<string, unknown>[];
}

/**
 * DTO for updating an existing change request
 */
export class UpdateChangeDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ITSMChangeType)
    changeType?: ITSMChangeType;

    @IsOptional()
    @IsEnum(ChangeCategory)
    category?: ChangeCategory;

    @IsOptional()
    @IsEnum(ChangePriority)
    priority?: ChangePriority;

    @IsOptional()
    @IsEnum(SecurityImpact)
    securityImpact?: SecurityImpact;

    @IsOptional()
    @IsEnum(ChangeStatus)
    status?: ChangeStatus;

    @IsOptional()
    @IsString()
    businessJustification?: string;

    @IsOptional()
    @IsString()
    impactAssessment?: string;

    @IsOptional()
    @IsArray()
    affectedServices?: string[];

    @IsOptional()
    @IsString()
    userImpact?: string;

    @IsOptional()
    @IsString()
    riskLevel?: string;

    @IsOptional()
    @IsString()
    riskAssessment?: string;

    @IsOptional()
    @IsString()
    backoutPlan?: string;

    @IsOptional()
    @IsInt()
    rollbackTime?: number;

    @IsOptional()
    @IsString()
    testPlan?: string;

    @IsOptional()
    @IsString()
    testResults?: string;

    @IsOptional()
    @IsDateString()
    plannedStart?: string;

    @IsOptional()
    @IsDateString()
    plannedEnd?: string;

    @IsOptional()
    @IsDateString()
    actualStart?: string;

    @IsOptional()
    @IsDateString()
    actualEnd?: string;

    @IsOptional()
    @IsBoolean()
    maintenanceWindow?: boolean;

    @IsOptional()
    @IsBoolean()
    outageRequired?: boolean;

    @IsOptional()
    @IsInt()
    estimatedDowntime?: number;

    @IsOptional()
    @IsBoolean()
    cabRequired?: boolean;

    @IsOptional()
    @IsString()
    implementerId?: string;

    @IsOptional()
    @IsString()
    departmentId?: string;

    @IsOptional()
    @IsString()
    parentChangeId?: string;

    @IsOptional()
    @IsString()
    vendorId?: string;

    @IsOptional()
    @IsString()
    implementationNotes?: string;

    @IsOptional()
    @IsString()
    successCriteria?: string;

    @IsOptional()
    @IsBoolean()
    successful?: boolean;

    @IsOptional()
    @IsString()
    failureReason?: string;

    @IsOptional()
    @IsBoolean()
    pirRequired?: boolean;

    @IsOptional()
    @IsBoolean()
    pirCompleted?: boolean;

    @IsOptional()
    @IsString()
    pirNotes?: string;

    @IsOptional()
    @IsString()
    lessonsLearned?: string;

    @IsOptional()
    @IsArray()
    attachments?: Record<string, unknown>[];
}

export class ChangeAssetLinkDto {
    @IsString()
    assetId!: string;

    @IsString()
    impactType!: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class LinkChangeAssetsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChangeAssetLinkDto)
    assets!: ChangeAssetLinkDto[];
}
