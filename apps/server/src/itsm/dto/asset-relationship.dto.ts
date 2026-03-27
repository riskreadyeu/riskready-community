import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    MaxLength,
} from 'class-validator';
import { RelationshipType } from '@prisma/client';

/**
 * DTO for creating an asset relationship
 */
export class CreateRelationshipDto {
    @IsString()
    fromAssetId!: string;

    @IsString()
    toAssetId!: string;

    @IsEnum(RelationshipType)
    relationshipType!: RelationshipType;

    @IsOptional()
    @IsBoolean()
    isCritical?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

/**
 * DTO for updating an asset relationship
 */
export class UpdateRelationshipDto {
    @IsOptional()
    @IsEnum(RelationshipType)
    relationshipType?: RelationshipType;

    @IsOptional()
    @IsBoolean()
    isCritical?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}
