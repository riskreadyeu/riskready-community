import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  IsNotEmpty,
  ArrayNotEmpty,
} from 'class-validator';
import { AcknowledgmentMethod } from '@prisma/client';

// =============================================
// ACKNOWLEDGMENT DTOs
// =============================================

export class CreateAcknowledgmentRequestDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsArray()
  @ArrayNotEmpty()
  userIds!: string[];

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class CreateAcknowledgmentDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  documentVersion!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class RecordAcknowledgmentDto {
  @IsEnum(AcknowledgmentMethod)
  @IsNotEmpty()
  method!: AcknowledgmentMethod;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

export class BulkCreateAcknowledgmentsDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  documentVersion!: string;

  @IsArray()
  @ArrayNotEmpty()
  userIds!: string[];

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class BulkSendAcknowledgmentRemindersDto {
  @IsString()
  @IsNotEmpty()
  organisationId!: string;

  @IsBoolean()
  @IsOptional()
  overdueOnly?: boolean;
}
