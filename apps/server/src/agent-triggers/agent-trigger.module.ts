import { Module } from '@nestjs/common';
import { AgentTriggerService } from './agent-trigger.service';

@Module({
  providers: [AgentTriggerService],
  exports: [AgentTriggerService],
})
export class AgentTriggerModule {}
