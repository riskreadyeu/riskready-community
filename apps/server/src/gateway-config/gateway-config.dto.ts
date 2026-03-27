import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsSafeUrl } from '../shared/utils/url-validation.util';

export class UpdateGatewayConfigDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  anthropicApiKey?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  agentModel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @IsSafeUrl({ message: 'gatewayUrl must be a valid http/https URL that does not point to private/internal addresses' })
  gatewayUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxAgentTurns?: number;
}
