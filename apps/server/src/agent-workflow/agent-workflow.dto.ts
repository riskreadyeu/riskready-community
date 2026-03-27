import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class TriggerAgentWorkflowDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  workflowId!: string;

  @IsString()
  @IsNotEmpty()
  organisationId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  instruction?: string;
}
