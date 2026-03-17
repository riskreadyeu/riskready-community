import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  departmentCode!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  departmentCategory?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  functionType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  criticalityLevel?: string;

  @IsString()
  @IsOptional()
  departmentHeadId?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  headcount?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  departmentCategory?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  functionType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  criticalityLevel?: string;

  @IsString()
  @IsOptional()
  departmentHeadId?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  headcount?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
