import { Module } from '@nestjs/common';
import { AgentScheduleController } from './agent-schedule.controller';
import { AgentScheduleService } from './agent-schedule.service';

@Module({
  controllers: [AgentScheduleController],
  providers: [AgentScheduleService],
  exports: [AgentScheduleService],
})
export class AgentScheduleModule {}
