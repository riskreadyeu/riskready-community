import { Module } from '@nestjs/common';
import { AgentWorkflowController } from './agent-workflow.controller';

@Module({
  controllers: [AgentWorkflowController],
})
export class AgentWorkflowModule {}
