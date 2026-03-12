import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  NonconformitySource,
  NCSeverity,
  NCCategory,
  NCStatus,
} from '@prisma/client';

export class CreateNonconformityDto {
  @IsEnum(NonconformitySource)
  source!: NonconformitySource;

  @IsEnum(NCSeverity)
  severity!: NCSeverity;

  @IsEnum(NCCategory)
  category!: NCCategory;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  findings?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  rootCause?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  impact?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  isoClause?: string;

  @IsString()
  @IsOptional()
  sourceReferenceId?: string;

  @IsString()
  @IsOptional()
  controlId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  correctiveAction?: string;

  @IsString()
  @IsOptional()
  responsibleUserId?: string;

  @IsDateString()
  @IsOptional()
  targetClosureDate?: string;
}

export class UpdateNonconformityDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  findings?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  rootCause?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  impact?: string;

  @IsEnum(NCSeverity)
  @IsOptional()
  severity?: NCSeverity;

  @IsEnum(NCCategory)
  @IsOptional()
  category?: NCCategory;

  @IsEnum(NCStatus)
  @IsOptional()
  status?: NCStatus;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  correctiveAction?: string;

  @IsString()
  @IsOptional()
  responsibleUserId?: string;

  @IsDateString()
  @IsOptional()
  targetClosureDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  verificationMethod?: string;

  @IsDateString()
  @IsOptional()
  verificationDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  verificationResult?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  verificationNotes?: string;

  @IsString()
  @IsOptional()
  sourceReferenceId?: string;

  @IsString()
  @IsOptional()
  controlId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  isoClause?: string;
}

export class LinkNonconformityRisksDto {
  @IsArray()
  @ArrayNotEmpty()
  riskIds!: string[];
}

export class SaveCapDraftDto {
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  correctiveAction!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  rootCause?: string;

  @IsString()
  responsibleUserId!: string;

  @IsDateString()
  targetClosureDate!: string;
}

export class ApproveCapDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;
}

export class RejectCapDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  rejectionReason!: string;
}
