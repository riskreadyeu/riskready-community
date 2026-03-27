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
  Min,
} from 'class-validator';
import {
  DocumentType,
  DocumentStatus,
  ClassificationLevel,
  ReviewFrequency,
  ApprovalLevel,
  Prisma,
} from '@prisma/client';

// =============================================
// POLICY DOCUMENT DTOs
// =============================================

export class CreatePolicyDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortTitle?: string;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @IsEnum(ClassificationLevel)
  @IsOptional()
  classification?: ClassificationLevel;

  @IsArray()
  @IsOptional()
  distribution?: string[];

  @IsArray()
  @IsOptional()
  restrictedTo?: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  purpose!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  scope!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content!: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  parentDocumentId?: string;

  @IsEnum(ReviewFrequency)
  @IsOptional()
  reviewFrequency?: ReviewFrequency;

  @IsString()
  @IsNotEmpty()
  documentOwner!: string;

  @IsString()
  @IsOptional()
  documentOwnerId?: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsOptional()
  authorId?: string;

  @IsEnum(ApprovalLevel)
  @IsNotEmpty()
  approvalLevel!: ApprovalLevel;

  @IsBoolean()
  @IsOptional()
  requiresAcknowledgment?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  acknowledgmentDeadline?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  language?: string;

  @IsOptional()
  definitions?: Prisma.InputJsonValue;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  locale?: string;

  @IsArray()
  @IsOptional()
  externalReferences?: string[];

  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}

export class UpdatePolicyDocumentDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortTitle?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @IsEnum(ClassificationLevel)
  @IsOptional()
  classification?: ClassificationLevel;

  @IsArray()
  @IsOptional()
  distribution?: string[];

  @IsArray()
  @IsOptional()
  restrictedTo?: string[];

  @IsString()
  @IsOptional()
  @MinLength(10)
  purpose?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  scope?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  content?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  parentDocumentId?: string;

  @IsEnum(ReviewFrequency)
  @IsOptional()
  reviewFrequency?: ReviewFrequency;

  @IsInt()
  @IsOptional()
  @Min(1)
  reviewReminder?: number;

  @IsString()
  @IsOptional()
  documentOwner?: string;

  @IsString()
  @IsOptional()
  documentOwnerId?: string;

  @IsEnum(ApprovalLevel)
  @IsOptional()
  approvalLevel?: ApprovalLevel;

  @IsBoolean()
  @IsOptional()
  requiresAcknowledgment?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  acknowledgmentDeadline?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  updatedById?: string;

  @IsDateString()
  @IsOptional()
  retirementDate?: string;

  @IsString()
  @IsOptional()
  supersededById?: string;

  @IsDateString()
  @IsOptional()
  lastReviewDate?: string;

  @IsDateString()
  @IsOptional()
  nextReviewDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  locale?: string;

  @IsArray()
  @IsOptional()
  externalReferences?: string[];

  @IsOptional()
  definitions?: Prisma.InputJsonValue;
}

export class UpdatePolicyStatusDto {
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  status!: DocumentStatus;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  statusReason?: string;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  approvedBy?: string;

  @IsString()
  @IsOptional()
  approverId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;

  @IsString()
  @IsOptional()
  digitalSignature?: string;

  @IsString()
  @IsOptional()
  updatedById?: string;
}
