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
  ArrayNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentSectionType } from '@prisma/client';

// =============================================
// SECTION DTOs
// =============================================

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsEnum(DocumentSectionType)
  @IsNotEmpty()
  sectionType!: DocumentSectionType;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  structuredData?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCollapsed?: boolean;

  @IsString()
  @IsOptional()
  createdById?: string;
}

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  structuredData?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCollapsed?: boolean;
}

export class ReorderSectionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SectionOrderItem)
  sections!: SectionOrderItem[];
}

class SectionOrderItem {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  @Min(0)
  order!: number;
}
