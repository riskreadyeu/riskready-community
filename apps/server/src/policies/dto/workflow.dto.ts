import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ArrayNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ChangeType,
  ReviewType,
  ReviewOutcome,
  ApprovalWorkflowType,
  ApprovalStepStatus,
  ApprovalDecision,
  ApprovalOutcome,
} from '@prisma/client';

// =============================================
// DOCUMENT VERSION DTOs
// =============================================

export class CreateDocumentVersionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  version!: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  majorVersion!: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  minorVersion!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  changeDescription!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeSummary?: string;

  @IsEnum(ChangeType)
  @IsNotEmpty()
  changeType!: ChangeType;

  @IsString()
  @IsOptional()
  approvedBy?: string;

  @IsDateString()
  @IsOptional()
  approvalDate?: string;

  @IsString()
  @IsOptional()
  diffFromPrevious?: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}

export class CreateDocumentVersionRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  changeDescription!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeSummary?: string;

  @IsEnum(ChangeType)
  @IsNotEmpty()
  changeType!: ChangeType;

  @IsBoolean()
  @IsOptional()
  isMajor?: boolean;
}

export class RollbackDocumentVersionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  targetVersion!: string;
}

// =============================================
// DOCUMENT REVIEW DTOs
// =============================================

export class CreateDocumentReviewDto {
  @IsEnum(ReviewType)
  @IsNotEmpty()
  reviewType!: ReviewType;

  @IsEnum(ReviewOutcome)
  @IsNotEmpty()
  outcome!: ReviewOutcome;

  @IsString()
  @IsOptional()
  findings?: string;

  @IsString()
  @IsOptional()
  recommendations?: string;

  @IsString()
  @IsOptional()
  actionItems?: string;

  @IsBoolean()
  @IsOptional()
  changesRequired?: boolean;

  @IsString()
  @IsOptional()
  changeDescription?: string;
}

export class RescheduleDocumentReviewDto {
  @IsDateString()
  @IsNotEmpty()
  nextReviewDate!: string;
}

// =============================================
// APPROVAL WORKFLOW DTOs
// =============================================

export class CreateApprovalWorkflowDto {
  @IsEnum(ApprovalWorkflowType)
  @IsNotEmpty()
  workflowType!: ApprovalWorkflowType;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  steps!: ApprovalStepDto[];

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comments?: string;
}

class ApprovalStepDto {
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  stepName!: string;

  @IsString()
  @IsOptional()
  approverId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  approverRole?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateApprovalStepDto {
  @IsEnum(ApprovalStepStatus)
  @IsOptional()
  status?: ApprovalStepStatus;

  @IsEnum(ApprovalDecision)
  @IsOptional()
  decision?: ApprovalDecision;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comments?: string;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsOptional()
  delegatedToId?: string;
}

export class ProcessApprovalStepDto {
  @IsEnum(ApprovalDecision)
  @IsNotEmpty()
  decision!: ApprovalDecision;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comments?: string;

  @IsString()
  @IsOptional()
  signature?: string;
}

export class DelegateApprovalStepDto {
  @IsString()
  @IsNotEmpty()
  delegatedToId!: string;
}

export class CompleteApprovalWorkflowDto {
  @IsEnum(ApprovalOutcome)
  @IsNotEmpty()
  finalOutcome!: ApprovalOutcome;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comments?: string;
}
