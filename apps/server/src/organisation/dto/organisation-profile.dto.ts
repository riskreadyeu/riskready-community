import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrganisationProfileDto {
  // Identity
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  legalName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  // Industry
  @IsString()
  @IsOptional()
  @MaxLength(200)
  industrySector?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  industrySubsector?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  industryCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  marketPosition?: string;

  // Financial
  @IsNumber()
  @IsOptional()
  @Min(0)
  annualRevenue?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  revenueCurrency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  fiscalYearStart?: string;

  @IsDateString()
  @IsOptional()
  fiscalYearEnd?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  reportingCurrency?: string;

  // Workforce
  @IsInt()
  @Min(0)
  employeeCount!: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  remoteWorkPercentage?: number;

  // Legal
  @IsString()
  @IsOptional()
  @MaxLength(100)
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  taxIdentification?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  dunsNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  stockSymbol?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  leiCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  naceCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  sicCode?: string;

  // Contact
  @IsString()
  @IsOptional()
  @MaxLength(500)
  headquartersAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  registeredAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  website?: string;

  // ISMS
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  ismsScope?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  ismsPolicy?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  scopeExclusions?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  exclusionJustification?: string;

  // Certification
  @IsString()
  @IsOptional()
  @MaxLength(50)
  isoCertificationStatus?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  certificationBody?: string;

  @IsDateString()
  @IsOptional()
  certificationDate?: string;

  @IsDateString()
  @IsOptional()
  certificationExpiry?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  certificateNumber?: string;

  // Risk
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  riskAppetite?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  riskPhilosophy?: string;

  @IsInt()
  @IsOptional()
  riskAcceptanceThreshold?: number;

  // Regulatory
  @IsBoolean()
  @IsOptional()
  isDoraApplicable?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  doraEntityType?: string;

  @IsBoolean()
  @IsOptional()
  isNis2Applicable?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nis2EntityClassification?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nis2Sector?: string;
}

export class UpdateOrganisationProfileDto extends CreateOrganisationProfileDto {
  // All fields become optional for update
  declare name: string;
  declare legalName: string;
  declare employeeCount: number;
}
