import { IsOptional, IsString } from 'class-validator';

export class ApproveActionDto {
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class RejectActionDto {
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
