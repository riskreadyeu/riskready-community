import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { AttachmentType } from '@prisma/client';

// =============================================
// ATTACHMENT DTOs
// =============================================

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalFilename!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  size!: number;

  @IsEnum(AttachmentType)
  @IsNotEmpty()
  attachmentType!: AttachmentType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  storagePath!: string;

  @IsString()
  @IsOptional()
  storageProvider?: string;

  @IsString()
  @IsNotEmpty()
  checksum!: string;

  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;
}

export class UpdateAttachmentDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  filename?: string;

  @IsEnum(AttachmentType)
  @IsOptional()
  attachmentType?: AttachmentType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class UploadAttachmentBodyDto {
  @IsEnum(AttachmentType)
  @IsNotEmpty()
  attachmentType!: AttachmentType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class CheckDuplicateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  checksum!: string;
}
