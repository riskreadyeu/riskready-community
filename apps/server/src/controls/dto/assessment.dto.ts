import { IsString, IsOptional, IsArray, IsDateString, IsEnum, IsInt, IsNumber, ArrayMaxSize } from 'class-validator';
import { ControlAssessmentStatus, AssessmentTestStatus, TestResult, RootCauseCategory, RemediationEffort, TestMethod } from '@prisma/client';

export class CreateAssessmentDto {
  @IsString()
  organisationId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assessmentRef?: string;

  @IsOptional()
  @IsString()
  leadTesterId?: string;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  controlIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopeItemIds?: string[];
}

export class UpdateAssessmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  leadTesterId?: string;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}

export class CompleteAssessmentDto {
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class CancelAssessmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddControlsDto {
  @IsArray()
  @IsString({ each: true })
  controlIds!: string[];
}

export class AddScopeItemsDto {
  @IsArray()
  @IsString({ each: true })
  scopeItemIds!: string[];
}

export class ExecuteAssessmentTestDto {
  @IsEnum(TestResult)
  result!: TestResult;

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsString()
  evidenceLocation?: string;

  @IsOptional()
  @IsString()
  evidenceNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceFileIds?: string[];

  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  samplesReviewed?: number;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}

export class AssignTesterDto {
  @IsString()
  testerId!: string;
}

export class UpdateRootCauseDto {
  @IsOptional()
  @IsEnum(RootCauseCategory)
  rootCause?: RootCauseCategory;

  @IsOptional()
  @IsString()
  rootCauseNotes?: string;

  @IsOptional()
  @IsEnum(RemediationEffort)
  remediationEffort?: RemediationEffort;

  @IsOptional()
  @IsInt()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}

export class SkipTestDto {
  @IsString()
  justification!: string;
}

export class UpdateAssessmentTestDto {
  @IsOptional()
  @IsEnum(TestMethod)
  testMethod?: TestMethod;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  assessorId?: string;

  @IsOptional()
  @IsString()
  assignedTesterId?: string;
}

export class BulkAssignDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  testIds!: string[];

  @IsOptional()
  @IsString()
  assignedTesterId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  assessorId?: string;

  @IsOptional()
  @IsEnum(TestMethod)
  testMethod?: TestMethod;
}
