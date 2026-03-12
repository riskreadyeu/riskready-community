import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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
  gatewayUrl?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxAgentTurns?: number;
}
