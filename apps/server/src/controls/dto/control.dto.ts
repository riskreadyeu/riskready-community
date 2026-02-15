import { IsString, IsEnum, IsOptional, IsBoolean, IsNotEmpty, Matches } from 'class-validator';
import { ControlTheme, ControlFramework, ImplementationStatus } from '@prisma/client';

export class CreateControlDto {
  @IsString()
  @IsNotEmpty()
  controlId!: string;

  @IsEnum(ControlTheme)
  theme!: ControlTheme;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ControlFramework)
  framework?: ControlFramework;

  @IsOptional()
  @IsString()
  sourceStandard?: string;

  @IsOptional()
  @IsString()
  soc2Criteria?: string;

  @IsOptional()
  @IsString()
  tscCategory?: string;

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

  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}

export class UpdateControlDto {
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]+\.[0-9]+$|^[A-Z]+-[A-Z0-9]+\.[0-9]+$/, {
    message: 'Control ID must match ISO format (e.g., "5.1", "8.12") or framework format (e.g., "SOC2-PI.1", "DORA-INC.1")',
  })
  controlId?: string;

  @IsOptional()
  @IsEnum(ControlTheme)
  theme?: ControlTheme;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ControlFramework)
  framework?: ControlFramework;

  @IsOptional()
  @IsString()
  sourceStandard?: string;

  @IsOptional()
  @IsString()
  soc2Criteria?: string;

  @IsOptional()
  @IsString()
  tscCategory?: string;

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
  updatedById?: string;
}

