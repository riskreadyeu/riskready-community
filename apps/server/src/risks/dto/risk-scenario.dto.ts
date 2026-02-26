import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class LinkControlDto {
  @IsString()
  controlId!: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  effectivenessWeight?: number;

  @IsBoolean()
  @IsOptional()
  isPrimaryControl?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateControlLinkDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  effectivenessWeight?: number;

  @IsBoolean()
  @IsOptional()
  isPrimaryControl?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
