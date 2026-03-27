import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAgentScheduleDto {
  @IsString()
  @IsNotEmpty()
  organisationId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cronExpression!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  instruction!: string;

  @IsArray()
  @IsOptional()
  targetServers?: string[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateAgentScheduleDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  cronExpression?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  instruction?: string;

  @IsArray()
  @IsOptional()
  targetServers?: string[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
