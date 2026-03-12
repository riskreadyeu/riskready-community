import { IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ImplementationStatus } from '@prisma/client';

export class CreateSOADto {
  @IsString()
  version!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  organisationId!: string;

  @IsOptional()
  @IsString()
  createdById?: string;
}

export class CreateSOAFromControlsDto {
  @IsString()
  version!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  organisationId!: string;

  @IsOptional()
  @IsString()
  createdById?: string;
}

export class CreateSOAVersionDto {
  @IsString()
  version!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  createdById?: string;
}

export class UpdateSOADto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  updatedById?: string;
}

export class SubmitSOAForReviewDto {
  @IsOptional()
  @IsString()
  updatedById?: string;
}

export class ApproveSOADto {
  @IsOptional()
  @IsString()
  approvedById?: string;
}

export class UpdateSOAEntryDto {
  @IsOptional()
  @IsBoolean()
  applicable?: boolean;

  @IsOptional()
  @IsString()
  justificationIfNa?: string;

  @IsOptional()
  @IsEnum(ImplementationStatus)
  implementationStatus?: ImplementationStatus;

  @IsOptional()
  @IsString()
  implementationDesc?: string;

  @IsOptional()
  @IsString()
  parentRiskId?: string;

  @IsOptional()
  @IsString()
  scenarioIds?: string;
}

export class SOAEntryUpdate {
  @IsString()
  controlId!: string;

  @IsOptional()
  @IsBoolean()
  applicable?: boolean;

  @IsOptional()
  @IsString()
  justificationIfNa?: string;

  @IsOptional()
  @IsEnum(ImplementationStatus)
  implementationStatus?: ImplementationStatus;

  @IsOptional()
  @IsString()
  implementationDesc?: string;
}

export class BulkUpdateSOAEntriesDto {
  @IsArray()
  updates!: Array<{
    controlId: string;
    applicable?: boolean;
    justificationIfNa?: string;
    implementationStatus?: ImplementationStatus;
    implementationDesc?: string;
  }>;
}
