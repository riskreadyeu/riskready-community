import { IsString, IsOptional, IsArray, ArrayMaxSize } from 'class-validator';

export class BulkLinkEvidenceDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  evidenceIds!: string[];

  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsOptional()
  @IsString()
  linkType?: string;

  @IsOptional()
  @IsString()
  createdById?: string;
}
