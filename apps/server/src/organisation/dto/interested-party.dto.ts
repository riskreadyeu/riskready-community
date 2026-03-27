import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInterestedPartyDto {
  @IsString()
  @MaxLength(100)
  partyCode!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(100)
  partyType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  expectations?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsArray()
  informationNeeds?: string[];

  @IsOptional()
  @IsString()
  powerLevel?: string;

  @IsOptional()
  @IsString()
  interestLevel?: string;

  @IsOptional()
  @IsString()
  influenceLevel?: string;

  @IsOptional()
  @IsString()
  engagementStrategy?: string;

  @IsOptional()
  @IsString()
  communicationMethod?: string;

  @IsOptional()
  @IsString()
  communicationFrequency?: string;

  @IsOptional()
  @IsString()
  primaryContact?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  ismsRelevance?: string;

  @IsOptional()
  @IsString()
  securityExpectations?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateInterestedPartyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  partyType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  expectations?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsArray()
  informationNeeds?: string[];

  @IsOptional()
  @IsString()
  powerLevel?: string;

  @IsOptional()
  @IsString()
  interestLevel?: string;

  @IsOptional()
  @IsString()
  influenceLevel?: string;

  @IsOptional()
  @IsString()
  engagementStrategy?: string;

  @IsOptional()
  @IsString()
  communicationMethod?: string;

  @IsOptional()
  @IsString()
  communicationFrequency?: string;

  @IsOptional()
  @IsString()
  primaryContact?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  ismsRelevance?: string;

  @IsOptional()
  @IsString()
  securityExpectations?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
