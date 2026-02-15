import { IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ScopeType, ScopeCriticality } from '@prisma/client';

export class CreateScopeItemDto {
  @IsString()
  organisationId!: string;

  @IsEnum(ScopeType)
  scopeType!: ScopeType;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ScopeCriticality)
  criticality?: ScopeCriticality;
}

export class UpdateScopeItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ScopeCriticality)
  criticality?: ScopeCriticality;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignScopeItemsDto {
  @IsArray()
  @IsString({ each: true })
  scopeItemIds!: string[];
}
