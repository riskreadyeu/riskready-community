import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsInt,
    IsNumber,
    IsDateString,
    IsArray,
    IsObject,
    MinLength,
    MaxLength,
    Min,
    Max,
} from 'class-validator';
import {
    AssetType,
    AssetStatus,
    BusinessCriticality,
    DataClassification,
    CloudProvider,
    CapacityStatus,
} from '@prisma/client';

/**
 * DTO for creating a new asset
 */
export class CreateAssetDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    assetTag?: string;

    @IsEnum(AssetType)
    assetType!: AssetType;

    @IsOptional()
    @IsEnum(AssetStatus)
    status?: AssetStatus;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    // Classification
    @IsOptional()
    @IsEnum(BusinessCriticality)
    businessCriticality?: BusinessCriticality;

    @IsOptional()
    @IsEnum(DataClassification)
    dataClassification?: DataClassification;

    // Ownership
    @IsOptional()
    @IsString()
    ownerId?: string;

    @IsOptional()
    @IsString()
    custodianId?: string;

    @IsOptional()
    @IsString()
    departmentId?: string;

    @IsOptional()
    @IsString()
    locationId?: string;

    // Network info
    @IsOptional()
    @IsArray()
    ipAddresses?: string[];

    @IsOptional()
    @IsArray()
    macAddresses?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(255)
    fqdn?: string;

    // Hardware details
    @IsOptional()
    @IsString()
    @MaxLength(100)
    manufacturer?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    model?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    serialNumber?: string;

    // Software details
    @IsOptional()
    @IsString()
    @MaxLength(100)
    osName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    osVersion?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    osPatchLevel?: string;

    // Cloud attributes
    @IsOptional()
    @IsEnum(CloudProvider)
    cloudProvider?: CloudProvider;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    cloudAccountId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    cloudRegion?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    cloudResourceId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    cloudInstanceType?: string;

    // Lifecycle
    @IsOptional()
    @IsDateString()
    purchaseDate?: string;

    @IsOptional()
    @IsDateString()
    warrantyExpiry?: string;

    @IsOptional()
    @IsDateString()
    supportExpiry?: string;

    @IsOptional()
    @IsDateString()
    endOfLifeDate?: string;

    @IsOptional()
    @IsDateString()
    installDate?: string;

    // Data Handling Flags
    @IsOptional()
    @IsBoolean()
    handlesPersonalData?: boolean;

    @IsOptional()
    @IsBoolean()
    handlesFinancialData?: boolean;

    @IsOptional()
    @IsBoolean()
    handlesHealthData?: boolean;

    @IsOptional()
    @IsBoolean()
    handlesConfidentialData?: boolean;

    // Compliance
    @IsOptional()
    @IsBoolean()
    inIsmsScope?: boolean;

    @IsOptional()
    @IsBoolean()
    pciInScope?: boolean;

    @IsOptional()
    @IsBoolean()
    hipaaInScope?: boolean;

    @IsOptional()
    @IsBoolean()
    gdprInScope?: boolean;

    @IsOptional()
    @IsBoolean()
    inNis2Scope?: boolean;

    @IsOptional()
    @IsBoolean()
    inSoc2Scope?: boolean;

    @IsOptional()
    @IsBoolean()
    inDoraScope?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    scopeNotes?: string;

    // Physical Location
    @IsOptional()
    @IsString()
    @MaxLength(255)
    datacenter?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    rack?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    rackPosition?: number;

    // Financial
    @IsOptional()
    @IsNumber()
    @Min(0)
    purchaseCost?: number;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    costCurrency?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    annualCost?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    costCenter?: string;

    // Lifecycle Dates
    @IsOptional()
    @IsDateString()
    deploymentDate?: string;

    @IsOptional()
    @IsDateString()
    disposalDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    lifecycleNotes?: string;

    // Security Posture
    @IsOptional()
    @IsBoolean()
    encryptionAtRest?: boolean;

    @IsOptional()
    @IsBoolean()
    encryptionInTransit?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    encryptionMethod?: string;

    @IsOptional()
    @IsBoolean()
    backupEnabled?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    backupFrequency?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    backupRetention?: string;

    @IsOptional()
    @IsBoolean()
    monitoringEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    loggingEnabled?: boolean;

    // Resilience
    @IsOptional()
    @IsNumber()
    @Min(0)
    mtpdMinutes?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    redundancyType?: string;

    @IsOptional()
    @IsBoolean()
    hasRedundancy?: boolean;

    // Vendor
    @IsOptional()
    @IsString()
    vendorId?: string;

    // Organisation
    @IsOptional()
    @IsString()
    organisationId?: string;

    // Type-specific attributes
    @IsOptional()
    @IsObject()
    typeAttributes?: Record<string, unknown>;
}

/**
 * DTO for updating an existing asset
 */
export class UpdateAssetDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsEnum(AssetType)
    assetType?: AssetType;

    @IsOptional()
    @IsEnum(AssetStatus)
    status?: AssetStatus;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    // Classification
    @IsOptional()
    @IsEnum(BusinessCriticality)
    businessCriticality?: BusinessCriticality;

    @IsOptional()
    @IsEnum(DataClassification)
    dataClassification?: DataClassification;

    // Ownership
    @IsOptional()
    @IsString()
    ownerId?: string;

    @IsOptional()
    @IsString()
    custodianId?: string;

    @IsOptional()
    @IsString()
    departmentId?: string;

    @IsOptional()
    @IsString()
    locationId?: string;

    // Network info
    @IsOptional()
    @IsArray()
    ipAddresses?: string[];

    @IsOptional()
    @IsArray()
    macAddresses?: string[];

    @IsOptional()
    @IsString()
    @MaxLength(255)
    fqdn?: string;

    // Hardware details
    @IsOptional()
    @IsString()
    @MaxLength(100)
    manufacturer?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    model?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    serialNumber?: string;

    // Software details
    @IsOptional()
    @IsString()
    @MaxLength(100)
    osName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    osVersion?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    osPatchLevel?: string;

    // Cloud attributes
    @IsOptional()
    @IsEnum(CloudProvider)
    cloudProvider?: CloudProvider;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    cloudAccountId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    cloudRegion?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    cloudResourceId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    cloudInstanceType?: string;

    // Lifecycle
    @IsOptional()
    @IsDateString()
    purchaseDate?: string;

    @IsOptional()
    @IsDateString()
    warrantyExpiry?: string;

    @IsOptional()
    @IsDateString()
    supportExpiry?: string;

    @IsOptional()
    @IsDateString()
    endOfLifeDate?: string;

    @IsOptional()
    @IsDateString()
    installDate?: string;

    // Data Handling Flags
    @IsOptional()
    @IsBoolean()
    handlesPersonalData?: boolean;

    @IsOptional()
    @IsBoolean()
    handlesFinancialData?: boolean;

    @IsOptional()
    @IsBoolean()
    handlesHealthData?: boolean;

    @IsOptional()
    @IsBoolean()
    handlesConfidentialData?: boolean;

    // Compliance
    @IsOptional()
    @IsBoolean()
    inIsmsScope?: boolean;

    @IsOptional()
    @IsBoolean()
    pciInScope?: boolean;

    @IsOptional()
    @IsBoolean()
    hipaaInScope?: boolean;

    @IsOptional()
    @IsBoolean()
    gdprInScope?: boolean;

    @IsOptional()
    @IsBoolean()
    inNis2Scope?: boolean;

    @IsOptional()
    @IsBoolean()
    inSoc2Scope?: boolean;

    @IsOptional()
    @IsBoolean()
    inDoraScope?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    scopeNotes?: string;

    // Physical Location
    @IsOptional()
    @IsString()
    @MaxLength(255)
    datacenter?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    rack?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    rackPosition?: number;

    // Financial
    @IsOptional()
    @IsNumber()
    @Min(0)
    purchaseCost?: number;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    costCurrency?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    annualCost?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    costCenter?: string;

    // Lifecycle Dates
    @IsOptional()
    @IsDateString()
    deploymentDate?: string;

    @IsOptional()
    @IsDateString()
    disposalDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    lifecycleNotes?: string;

    // Security Posture
    @IsOptional()
    @IsBoolean()
    encryptionAtRest?: boolean;

    @IsOptional()
    @IsBoolean()
    encryptionInTransit?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    encryptionMethod?: string;

    @IsOptional()
    @IsBoolean()
    backupEnabled?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    backupFrequency?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    backupRetention?: string;

    @IsOptional()
    @IsBoolean()
    monitoringEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    loggingEnabled?: boolean;

    // Resilience
    @IsOptional()
    @IsNumber()
    @Min(0)
    mtpdMinutes?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    redundancyType?: string;

    @IsOptional()
    @IsBoolean()
    hasRedundancy?: boolean;

    // Vendor
    @IsOptional()
    @IsString()
    vendorId?: string;

    // Capacity
    @IsOptional()
    @IsEnum(CapacityStatus)
    capacityStatus?: CapacityStatus;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    cpuUtilization?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    memoryUtilization?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    diskUtilization?: number;

    // Type-specific attributes
    @IsOptional()
    @IsObject()
    typeAttributes?: Record<string, unknown>;
}

/**
 * DTO for importing assets in bulk
 */
export class ImportAssetsDto {
    @IsArray()
    assets!: CreateAssetDto[];
}
