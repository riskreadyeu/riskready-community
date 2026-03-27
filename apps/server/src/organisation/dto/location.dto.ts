import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
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

  @IsInt()
  @IsOptional()
  @Min(0)
  employeeCount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  physicalSecurityLevel?: string;

  @IsBoolean()
  @IsOptional()
  inIsmsScope?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
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

  @IsInt()
  @IsOptional()
  @Min(0)
  employeeCount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  physicalSecurityLevel?: string;

  @IsBoolean()
  @IsOptional()
  inIsmsScope?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
