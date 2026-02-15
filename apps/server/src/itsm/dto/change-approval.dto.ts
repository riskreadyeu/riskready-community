import {
    IsString,
    IsOptional,
    IsBoolean,
    IsArray,
    ValidateNested,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovalStatus } from '@prisma/client';

class ApproverEntry {
    @IsString()
    userId!: string;

    @IsString()
    role!: string;

    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;
}

/**
 * DTO for requesting approval on a change
 */
export class RequestApprovalDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ApproverEntry)
    approvers!: ApproverEntry[];

    @IsOptional()
    @IsString()
    comments?: string;

    @IsOptional()
    @IsString()
    conditions?: string;
}

/**
 * DTO for an approval decision
 */
export class ApprovalDecisionDto {
    @IsEnum(ApprovalStatus)
    status!: ApprovalStatus;

    @IsOptional()
    @IsString()
    decision?: string;

    @IsOptional()
    @IsString()
    comments?: string;

    @IsOptional()
    @IsString()
    conditions?: string;
}

/**
 * DTO for rejecting a change
 */
export class RejectDto {
    @IsString()
    reason!: string;

    @IsOptional()
    @IsString()
    comments?: string;
}
