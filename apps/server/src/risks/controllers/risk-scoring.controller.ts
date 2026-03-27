import { Controller, Post, Body } from '@nestjs/common';
import { LikelihoodLevel, ImpactLevel } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { calculateScore } from '../utils/risk-scoring';

class CalculateScoreDto {
    @IsEnum(LikelihoodLevel)
    likelihood!: LikelihoodLevel;

    @IsEnum(ImpactLevel)
    impact!: ImpactLevel;
}

@Controller('risks/scoring')
export class RiskScoringController {
    @Post('calculate')
    calculate(@Body() dto: CalculateScoreDto) {
        const score = calculateScore(dto.likelihood, dto.impact);
        return { score };
    }
}
