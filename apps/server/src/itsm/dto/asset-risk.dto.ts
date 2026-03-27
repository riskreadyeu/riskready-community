import {
    IsString,
    IsOptional,
    IsArray,
    MaxLength,
    ArrayMaxSize,
} from 'class-validator';

/**
 * DTO for linking an asset to a risk
 */
export class LinkAssetRiskDto {
    @IsString()
    assetId!: string;

    @IsString()
    riskId!: string;

    @IsOptional()
    @IsString()
    impactLevel?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

/**
 * DTO for bulk-linking assets to a risk
 */
export class BulkLinkDto {
    @IsArray()
    @ArrayMaxSize(100)
    @IsString({ each: true })
    assets!: string[];

    @IsString()
    riskId!: string;

    @IsOptional()
    @IsString()
    impactLevel?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}
