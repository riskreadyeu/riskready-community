import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ApprovalLevel,
  ReviewFrequency,
  ExceptionStatus,
} from '@prisma/client';

// =============================================
// EXCEPTION DTOs
// =============================================

export class CreateDocumentExceptionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  justification!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  scope!: string;

  @IsArray()
  @IsOptional()
  affectedEntities?: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  riskAssessment!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  residualRisk!: string;

  @IsString()
  @IsOptional()
  compensatingControls?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsNotEmpty()
  expiryDate!: string;

  @IsEnum(ApprovalLevel)
  @IsNotEmpty()
  approvalLevel!: ApprovalLevel;

  @IsEnum(ReviewFrequency)
  @IsOptional()
  reviewFrequency?: ReviewFrequency;

  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}

export class UpdateDocumentExceptionDto {
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  justification?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  scope?: string;

  @IsArray()
  @IsOptional()
  affectedEntities?: string[];

  @IsString()
  @IsOptional()
  @MinLength(10)
  riskAssessment?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  residualRisk?: string;

  @IsString()
  @IsOptional()
  compensatingControls?: string;

  @IsEnum(ExceptionStatus)
  @IsOptional()
  status?: ExceptionStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsEnum(ReviewFrequency)
  @IsOptional()
  reviewFrequency?: ReviewFrequency;
}

export class ApproveExceptionDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;
}

export class CloseExceptionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}

export class ReviewExceptionDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
