import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { ChangeApprovalService } from '../services/change-approval.service';

@Controller('itsm/change-approvals')
export class ChangeApprovalController {
  constructor(private readonly service: ChangeApprovalService) {}

  @Get('pending')
  async findPendingByUser(@Request() req: any) {
    return this.service.findPendingByUser(req.user.id);
  }

  @Get('by-change/:changeId')
  async findByChange(@Param('changeId') changeId: string) {
    return this.service.findByChange(changeId);
  }

  @Post('request/:changeId')
  async requestApproval(
    @Param('changeId') changeId: string,
    @Body() data: { approvers: Array<{ userId: string; role: string; isRequired?: boolean }> },
  ) {
    return this.service.requestApproval(changeId, data.approvers);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { comments?: string; conditions?: string },
  ) {
    return this.service.approve(id, req.user.id, data.comments, data.conditions);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { comments: string },
  ) {
    return this.service.reject(id, req.user.id, data.comments);
  }
}
