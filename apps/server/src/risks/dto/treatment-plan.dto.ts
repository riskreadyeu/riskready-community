import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ActionStatus, TreatmentPriority } from '@prisma/client';

export class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage!: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  progressNotes?: string;
}

export class UpdateTreatmentActionDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ActionStatus)
  @IsOptional()
  status?: ActionStatus;

  @IsEnum(TreatmentPriority)
  @IsOptional()
  priority?: TreatmentPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  completedDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedHours?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  actualHours?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  completionNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  blockerNotes?: string;
}
