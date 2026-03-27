import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { DocumentSectionType, DocumentType } from '@prisma/client';

// =============================================
// TEMPLATE DTOs
// =============================================

export class CreateSectionTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsEnum(DocumentSectionType)
  @IsNotEmpty()
  sectionType!: DocumentSectionType;

  @IsArray()
  @IsOptional()
  @IsEnum(DocumentType, { each: true })
  applicableTypes?: DocumentType[];

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  defaultOrder?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  defaultTitle?: string;

  @IsString()
  @IsOptional()
  defaultContent?: string;

  @IsOptional()
  schema?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  helpText?: string;

  @IsString()
  @IsOptional()
  organisationId?: string;

  @IsBoolean()
  @IsOptional()
  isSystemTemplate?: boolean;
}

export class UpdateSectionTemplateDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsEnum(DocumentSectionType)
  @IsOptional()
  sectionType?: DocumentSectionType;

  @IsArray()
  @IsOptional()
  @IsEnum(DocumentType, { each: true })
  applicableTypes?: DocumentType[];

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  defaultOrder?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  defaultTitle?: string;

  @IsString()
  @IsOptional()
  defaultContent?: string;

  @IsOptional()
  schema?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  helpText?: string;
}
