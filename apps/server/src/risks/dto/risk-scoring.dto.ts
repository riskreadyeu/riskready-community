import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryAssessmentDto {
  @IsString()
  category!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  level!: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  value?: number;
}

export class CategoryWeightDto {
  @IsString()
  category!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  weight!: number;
}

export class CalculateScoreDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryAssessmentDto)
  assessments!: CategoryAssessmentDto[];
}

export class CalculateWeightedImpactDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryAssessmentDto)
  assessments!: CategoryAssessmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryWeightDto)
  weights!: CategoryWeightDto[];
}
