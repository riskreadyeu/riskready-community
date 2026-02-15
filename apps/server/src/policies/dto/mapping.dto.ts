import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import {
  ControlMappingType,
  CoverageLevel,
  RiskRelationshipType,
  DocumentRelationType,
} from '@prisma/client';

// =============================================
// MAPPING DTOs
// =============================================

export class AddControlMappingDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  controlId!: string;

  @IsEnum(ControlMappingType)
  @IsOptional()
  mappingType?: ControlMappingType;

  @IsEnum(CoverageLevel)
  @IsOptional()
  coverage?: CoverageLevel;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  evidenceRequired?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  evidenceDescription?: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}

export class UpdateControlMappingDto {
  @IsEnum(ControlMappingType)
  @IsOptional()
  mappingType?: ControlMappingType;

  @IsEnum(CoverageLevel)
  @IsOptional()
  coverage?: CoverageLevel;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  evidenceRequired?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  evidenceDescription?: string;
}

export class AddRiskMappingDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  riskId!: string;

  @IsEnum(RiskRelationshipType)
  @IsOptional()
  relationshipType?: RiskRelationshipType;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}

export class UpdateRiskMappingDto {
  @IsEnum(RiskRelationshipType)
  @IsOptional()
  relationshipType?: RiskRelationshipType;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class AddDocumentRelationDto {
  @IsString()
  @IsNotEmpty()
  sourceDocumentId!: string;

  @IsString()
  @IsNotEmpty()
  targetDocumentId!: string;

  @IsEnum(DocumentRelationType)
  @IsNotEmpty()
  relationType!: DocumentRelationType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}
