import {
    IsString,
    IsEnum,
    IsOptional,
    IsInt,
    IsNumber,
    IsDateString,
    IsObject,
    MinLength,
    MaxLength,
    Min,
    Max,
} from 'class-validator';
import { CapacityPlanStatus } from '@prisma/client';

/**
 * DTO for recording a capacity measurement
 */
export class RecordCapacityDto {
    @IsString()
    assetId!: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    cpuUsagePercent?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    memoryUsagePercent?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    storageUsagePercent?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    networkUsagePercent?: number;

    @IsOptional()
    @IsObject()
    customMetrics?: Record<string, unknown>;

    @IsOptional()
    @IsString()
    source?: string;
}

/**
 * DTO for creating a capacity plan
 */
export class CreateCapacityPlanDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    assetId?: string;

    @IsOptional()
    @IsString()
    assetGroup?: string;

    @IsString()
    @MinLength(1)
    currentCapacity!: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    currentUtilizationPercent?: number;

    @IsOptional()
    @IsNumber()
    projectedGrowthPercent?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    projectionPeriodMonths?: number;

    @IsOptional()
    @IsDateString()
    projectedExhaustionDate?: string;

    @IsOptional()
    @IsString()
    recommendedAction?: string;

    @IsOptional()
    @IsDateString()
    recommendedDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    estimatedCost?: number;

    @IsOptional()
    @IsString()
    costCurrency?: string;

    @IsOptional()
    @IsEnum(CapacityPlanStatus)
    status?: CapacityPlanStatus;
}

/**
 * DTO for updating a capacity plan
 */
export class UpdateCapacityPlanDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    assetId?: string;

    @IsOptional()
    @IsString()
    assetGroup?: string;

    @IsOptional()
    @IsString()
    currentCapacity?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    currentUtilizationPercent?: number;

    @IsOptional()
    @IsNumber()
    projectedGrowthPercent?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    projectionPeriodMonths?: number;

    @IsOptional()
    @IsDateString()
    projectedExhaustionDate?: string;

    @IsOptional()
    @IsString()
    recommendedAction?: string;

    @IsOptional()
    @IsDateString()
    recommendedDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    estimatedCost?: number;

    @IsOptional()
    @IsString()
    costCurrency?: string;

    @IsOptional()
    @IsEnum(CapacityPlanStatus)
    status?: CapacityPlanStatus;

    @IsOptional()
    @IsDateString()
    reviewDate?: string;

    @IsOptional()
    @IsDateString()
    nextReviewDate?: string;
}
