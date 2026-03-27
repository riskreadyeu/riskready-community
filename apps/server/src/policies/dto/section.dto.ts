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
import { DocumentSectionType, DocumentType, Prisma } from '@prisma/client';

// =============================================
// SECTION DTOs
// =============================================

export class CreateSectionDto {
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
  structuredData?: Prisma.InputJsonValue;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCollapsed?: boolean;
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
  structuredData?: Prisma.InputJsonValue;

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
  sectionOrders!: SectionOrderItem[];
}

class SectionOrderItem {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

export class CloneSectionsFromTemplateDto {
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  startOrder?: number;
}

export class CreateDefinitionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  term!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  definition!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  source?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateDefinitionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  term?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  definition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  source?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class BulkCreateDefinitionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateDefinitionDto)
  definitions!: CreateDefinitionDto[];
}

export class CreateProcessStepDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  stepNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description!: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  responsible?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  accountable?: string;

  @IsArray()
  @IsOptional()
  consulted?: string[];

  @IsArray()
  @IsOptional()
  informed?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  estimatedDuration?: string;

  @IsArray()
  @IsOptional()
  inputs?: string[];

  @IsArray()
  @IsOptional()
  outputs?: string[];

  @IsBoolean()
  @IsOptional()
  isDecisionPoint?: boolean;

  @IsOptional()
  decisionOptions?: Prisma.InputJsonValue;
}

export class UpdateProcessStepDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  stepNumber?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  responsible?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  accountable?: string;

  @IsArray()
  @IsOptional()
  consulted?: string[];

  @IsArray()
  @IsOptional()
  informed?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  estimatedDuration?: string;

  @IsArray()
  @IsOptional()
  inputs?: string[];

  @IsArray()
  @IsOptional()
  outputs?: string[];

  @IsBoolean()
  @IsOptional()
  isDecisionPoint?: boolean;

  @IsOptional()
  decisionOptions?: Prisma.InputJsonValue;
}

export class BulkCreateProcessStepsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateProcessStepDto)
  steps!: CreateProcessStepDto[];
}

export class CreatePrerequisiteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  item!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdatePrerequisiteDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  item?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class BulkCreatePrerequisitesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePrerequisiteDto)
  prerequisites!: CreatePrerequisiteDto[];
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  role!: string;

  @IsArray()
  @IsOptional()
  responsibilities?: string[];

  @IsOptional()
  raciMatrix?: Prisma.InputJsonValue;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  role?: string;

  @IsArray()
  @IsOptional()
  responsibilities?: string[];

  @IsOptional()
  raciMatrix?: Prisma.InputJsonValue;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class BulkCreateRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRoleDto)
  roles!: CreateRoleDto[];
}

export class CreateRevisionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  version!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  author!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  approvedBy?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateRevisionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  version?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  author?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  approvedBy?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class BulkCreateRevisionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateRevisionDto)
  revisions!: CreateRevisionDto[];
}

export class CreateSectionTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
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
  schema?: Prisma.InputJsonValue;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
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
  @MinLength(1)
  @MaxLength(200)
  name?: string;

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
  schema?: Prisma.InputJsonValue;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  helpText?: string;
}

export class CloneDocumentStructureDto {
  @IsString()
  @IsNotEmpty()
  sourceDocumentId!: string;
}
