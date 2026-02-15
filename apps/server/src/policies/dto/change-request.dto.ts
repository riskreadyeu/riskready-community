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
  ChangeType,
  ChangePriority,
  ChangeRequestStatus,
} from '@prisma/client';

// =============================================
// CHANGE REQUEST DTOs
// =============================================

export class CreateChangeRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  changeRequestId!: string;

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

  @IsEnum(ChangeType)
  @IsNotEmpty()
  changeType!: ChangeType;

  @IsEnum(ChangePriority)
  @IsNotEmpty()
  priority!: ChangePriority;

  @IsString()
  @IsOptional()
  impactAssessment?: string;

  @IsArray()
  @IsOptional()
  affectedDocuments?: string[];

  @IsArray()
  @IsOptional()
  affectedProcesses?: string[];

  @IsArray()
  @IsOptional()
  affectedSystems?: string[];

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  requestedById?: string;

  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}

export class UpdateChangeRequestDto {
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

  @IsEnum(ChangeType)
  @IsOptional()
  changeType?: ChangeType;

  @IsEnum(ChangePriority)
  @IsOptional()
  priority?: ChangePriority;

  @IsEnum(ChangeRequestStatus)
  @IsOptional()
  status?: ChangeRequestStatus;

  @IsString()
  @IsOptional()
  impactAssessment?: string;

  @IsArray()
  @IsOptional()
  affectedDocuments?: string[];

  @IsArray()
  @IsOptional()
  affectedProcesses?: string[];

  @IsArray()
  @IsOptional()
  affectedSystems?: string[];

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;
}

export class ApproveChangeRequestDto {
  @IsString()
  @IsOptional()
  approverId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;
}

export class ImplementChangeRequestDto {
  @IsString()
  @IsOptional()
  implementedById?: string;

  @IsString()
  @IsOptional()
  newVersionId?: string;

  @IsDateString()
  @IsOptional()
  actualCompletionDate?: string;
}
