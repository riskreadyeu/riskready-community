import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  IsEmail,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  locationCode?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  locationType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  region?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  employeeCount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  physicalSecurityLevel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  accessControlType?: string;

  @IsArray()
  @IsOptional()
  securityFeatures?: string[];

  @IsBoolean()
  @IsOptional()
  isDataCenter?: boolean;

  @IsBoolean()
  @IsOptional()
  hasServerRoom?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  networkType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  internetProvider?: string;

  @IsBoolean()
  @IsOptional()
  backupPower?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  maxCapacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  floorSpace?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  floorSpaceUnit?: string;

  @IsArray()
  @IsOptional()
  complianceCertifications?: string[];

  @IsBoolean()
  @IsOptional()
  inIsmsScope?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  scopeJustification?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  operationalSince?: string;

  @IsDateString()
  @IsOptional()
  closureDate?: string;
}

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  locationType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  region?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  employeeCount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  physicalSecurityLevel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  accessControlType?: string;

  @IsArray()
  @IsOptional()
  securityFeatures?: string[];

  @IsBoolean()
  @IsOptional()
  isDataCenter?: boolean;

  @IsBoolean()
  @IsOptional()
  hasServerRoom?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  networkType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  internetProvider?: string;

  @IsBoolean()
  @IsOptional()
  backupPower?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  maxCapacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  floorSpace?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  floorSpaceUnit?: string;

  @IsArray()
  @IsOptional()
  complianceCertifications?: string[];

  @IsBoolean()
  @IsOptional()
  inIsmsScope?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  scopeJustification?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  operationalSince?: string;

  @IsDateString()
  @IsOptional()
  closureDate?: string;
}
