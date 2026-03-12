import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { ChangeApprovalService } from '../services/change-approval.service';
import {
  ApproveChangeApprovalDto,
  RejectChangeApprovalDto,
  RequestApprovalDto,
} from '../dto/change-approval.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('itsm/change-approvals')
export class ChangeApprovalController {
  constructor(private readonly service: ChangeApprovalService) {}

  @Get('pending')
  async findPendingByUser(@Request() req: AuthenticatedRequest) {
    return this.service.findPendingByUser(req.user.id);
  }

  @Get('by-change/:changeId')
  async findByChange(@Param('changeId') changeId: string) {
    return this.service.findByChange(changeId);
  }

  @Post('request/:changeId')
  async requestApproval(
    @Param('changeId') changeId: string,
    @Body() data: RequestApprovalDto,
  ) {
    return this.service.requestApproval(changeId, data.approvers);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() data: ApproveChangeApprovalDto,
  ) {
    return this.service.approve(id, req.user.id, data.comments, data.conditions);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() data: RejectChangeApprovalDto,
  ) {
    return this.service.reject(id, req.user.id, data.comments);
  }
}
