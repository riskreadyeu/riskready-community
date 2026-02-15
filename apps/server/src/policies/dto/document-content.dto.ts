import {
  IsString,
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

// =============================================
// DEFINITION DTOs
// =============================================

export class CreateDefinitionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  term!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
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
  @MinLength(3)
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
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DefinitionItem)
  definitions!: DefinitionItem[];
}

class DefinitionItem {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  term!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  definition!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  source?: string;
}

// =============================================
// PROCESS STEP DTOs
// =============================================

export class CreateProcessStepDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  stepNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description!: string;

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
  decisionOptions?: Record<string, unknown>;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateProcessStepDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  stepNumber?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  description?: string;

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
  decisionOptions?: Record<string, unknown>;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

// =============================================
// PREREQUISITE DTOs
// =============================================

export class CreatePrerequisiteDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  item!: string;

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
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  item?: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

// =============================================
// ROLE DTOs
// =============================================

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  role!: string;

  @IsArray()
  @IsOptional()
  responsibilities?: string[];

  @IsOptional()
  raciMatrix?: Record<string, unknown>;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  role?: string;

  @IsArray()
  @IsOptional()
  responsibilities?: string[];

  @IsOptional()
  raciMatrix?: Record<string, unknown>;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

// =============================================
// REVISION DTOs
// =============================================

export class CreateRevisionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

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
  @MinLength(2)
  @MaxLength(200)
  author!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  approvedBy?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description!: string;

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
  @MinLength(2)
  @MaxLength(200)
  author?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  approvedBy?: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}
