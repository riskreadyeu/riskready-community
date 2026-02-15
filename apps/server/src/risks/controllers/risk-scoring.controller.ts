import { Controller, Post, Body } from '@nestjs/common';
import { LikelihoodLevel, ImpactLevel, ImpactCategory } from '@prisma/client';
import { IsEnum, IsArray, ValidateNested, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import {
    calculateScore,
    calculateWeightedImpact,
    CategoryAssessment,
    CategoryWeight
} from '../utils/risk-scoring';

// DTOs
class CalculateScoreDto {
    @IsEnum(LikelihoodLevel)
    likelihood!: LikelihoodLevel;

    @IsEnum(ImpactLevel)
    impact!: ImpactLevel;
}

class CategoryAssessmentDto implements CategoryAssessment {
    @IsEnum(ImpactCategory)
    category!: ImpactCategory;

    @IsNumber()
    @Min(1)
    @Max(5)
    value!: number; // 1-5
}

class CategoryWeightDto implements CategoryWeight {
    @IsEnum(ImpactCategory)
    category!: ImpactCategory;

    @IsNumber()
    @Min(0)
    @Max(100)
    weight!: number; // Percentage (0-100)
}

class CalculateWeightedImpactDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryAssessmentDto)
    assessments!: CategoryAssessmentDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryWeightDto)
    weights?: CategoryWeightDto[];
}

@Controller('risks/scoring')
export class RiskScoringController {
    @Post('calculate')
    calculate(@Body() dto: CalculateScoreDto) {
        const score = calculateScore(dto.likelihood, dto.impact);
        return { score };
    }

    @Post('calculate-weighted-impact')
    calculateWeightedImpact(@Body() dto: CalculateWeightedImpactDto) {
        const weightedImpact = calculateWeightedImpact(dto.assessments, dto.weights);
        return { weightedImpact };
    }
}
