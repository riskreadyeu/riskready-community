import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import {
  EvidenceType,
  EvidenceClassification,
  EvidenceSourceType,
  EvidenceRequestPriority,
} from '@prisma/client';

export class CreateEvidenceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(EvidenceType)
  evidenceType!: EvidenceType;

  @IsEnum(EvidenceClassification)
  @IsOptional()
  classification?: EvidenceClassification;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  subcategory?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsEnum(EvidenceSourceType)
  @IsOptional()
  sourceType?: EvidenceSourceType;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sourceSystem?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sourceReference?: string;

  @IsDateString()
  @IsOptional()
  collectedAt?: string;

  @IsString()
  @IsOptional()
  collectedById?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  collectionMethod?: string;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsDateString()
  @IsOptional()
  retainUntil?: string;

  @IsBoolean()
  @IsOptional()
  renewalRequired?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  renewalReminderDays?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  chainOfCustodyNotes?: string;

  @IsBoolean()
  @IsOptional()
  isForensicallySound?: boolean;

  @IsString()
  createdById!: string;
}

export class CreateEvidenceRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(EvidenceType)
  evidenceType!: EvidenceType;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  requiredFormat?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  acceptanceCriteria?: string;

  @IsEnum(EvidenceRequestPriority)
  @IsOptional()
  priority?: EvidenceRequestPriority;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  assignedDepartmentId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contextType?: string;

  @IsString()
  @IsOptional()
  contextId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contextRef?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
