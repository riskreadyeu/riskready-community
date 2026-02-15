import { Module } from '@nestjs/common';
import { ControlsModule } from '../controls/controls.module';
import { McpApprovalController } from './mcp-approval.controller';
import { McpApprovalService } from './mcp-approval.service';
import { McpApprovalExecutorService } from './mcp-approval-executor.service';

@Module({
  imports: [ControlsModule],
  controllers: [McpApprovalController],
  providers: [McpApprovalService, McpApprovalExecutorService],
})
export class McpApprovalModule {}
