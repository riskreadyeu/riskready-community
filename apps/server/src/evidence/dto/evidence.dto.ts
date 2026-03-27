import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsArray,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import {
  EvidenceType,
  EvidenceClassification,
  EvidenceSourceType,
  EvidenceRequestPriority,
  Prisma,
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

  @IsOptional()
  @IsString()
  createdById?: string;
}

export class CreateEvidenceRecordDto extends CreateEvidenceDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fileName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  originalFileName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  fileUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fileSizeBytes?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  mimeType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  storagePath?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  storageProvider?: string;

  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  hashSha256?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  hashMd5?: string;

  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}

export class CreateEvidenceRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

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
  @IsNotEmpty()
  dueDate!: string;

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

export class UpdateEvidenceDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(EvidenceType)
  @IsOptional()
  evidenceType?: EvidenceType;

  @IsEnum(EvidenceClassification)
  @IsOptional()
  classification?: EvidenceClassification;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  subcategory?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  fileName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  originalFileName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  fileUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fileSizeBytes?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  mimeType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  storagePath?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  storageProvider?: string;

  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  hashSha256?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  hashMd5?: string;

  @IsBoolean()
  @IsOptional()
  isForensicallySound?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  chainOfCustodyNotes?: string;

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

  @IsOptional()
  metadata?: Prisma.InputJsonValue;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class ApproveEvidenceDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class RejectEvidenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;
}

export class CreateEvidenceVersionDto {
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
  @MaxLength(255)
  fileName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  fileUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fileSizeBytes?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  mimeType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  hashSha256?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  hashMd5?: string;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateEvidenceRequestDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(EvidenceType)
  @IsOptional()
  evidenceType?: EvidenceType;

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

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  assignedDepartmentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class SubmitEvidenceRequestDto {
  @IsString()
  @IsNotEmpty()
  evidenceId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class RejectEvidenceSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;
}
