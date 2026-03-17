import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  IsObject,
  IsEmail,
  IsDateString,
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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  deputyHeadId?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  headcount?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  contractorCount?: number;

  @IsArray()
  @IsOptional()
  keyResponsibilities?: string[];

  @IsArray()
  @IsOptional()
  regulatoryObligations?: string[];

  @IsArray()
  @IsOptional()
  externalInterfaces?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(50)
  costCenter?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  budgetCurrency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  floorPlanReference?: string;

  @IsObject()
  @IsOptional()
  businessHours?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  establishedDate?: string;

  @IsBoolean()
  @IsOptional()
  handlesPersonalData?: boolean;

  @IsBoolean()
  @IsOptional()
  handlesFinancialData?: boolean;

  @IsEmail()
  @IsOptional()
  @MaxLength(200)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @IsObject()
  @IsOptional()
  emergencyContact?: Record<string, string>;
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

  @IsString()
  @IsOptional()
  @MaxLength(100)
  deputyHeadId?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  headcount?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  contractorCount?: number;

  @IsArray()
  @IsOptional()
  keyResponsibilities?: string[];

  @IsArray()
  @IsOptional()
  regulatoryObligations?: string[];

  @IsArray()
  @IsOptional()
  externalInterfaces?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(50)
  costCenter?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  budgetCurrency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  floorPlanReference?: string;

  @IsObject()
  @IsOptional()
  businessHours?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  establishedDate?: string;

  @IsDateString()
  @IsOptional()
  closureDate?: string;

  @IsBoolean()
  @IsOptional()
  handlesPersonalData?: boolean;

  @IsBoolean()
  @IsOptional()
  handlesFinancialData?: boolean;

  @IsEmail()
  @IsOptional()
  @MaxLength(200)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @IsObject()
  @IsOptional()
  emergencyContact?: Record<string, string>;
}
