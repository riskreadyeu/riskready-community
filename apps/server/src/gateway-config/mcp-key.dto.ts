import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateMcpKeyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
