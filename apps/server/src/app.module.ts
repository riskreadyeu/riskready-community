import { Module, MiddlewareConsumer, NestModule, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { HealthModule } from './health/health.module';
import { OrganisationModule } from './organisation/organisation.module';
import { ControlsModule } from './controls/controls.module';
import { RisksModule } from './risks/risks.module';
import { AuditsModule } from './audits/audits.module';
import { PoliciesModule } from './policies/policies.module';
import { ITSMModule } from './itsm/itsm.module';
import { IncidentsModule } from './incidents/incidents.module';
import { EvidenceModule } from './evidence/evidence.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GatewayConfigModule } from './gateway-config/gateway-config.module';
import { McpApprovalModule } from './mcp-approval/mcp-approval.module';
import { AgentScheduleModule } from './agent-schedule/agent-schedule.module';
import { AgentTriggerModule } from './agent-triggers/agent-trigger.module';
import { AgentWorkflowModule } from './agent-workflow/agent-workflow.module';
import { RequestContextMiddleware } from './shared/middleware/request-context.middleware';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute window
      limit: 300, // 300 requests per minute (dashboard loads ~20 requests at once)
    }]),
    PrismaModule, // Global - provides PrismaService to all modules
    EventEmitterModule.forRoot({
      global: true,
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    HealthModule,
    AuthModule,
    DashboardModule,
    OrganisationModule,
    ControlsModule,
    RisksModule,
    AuditsModule,
    PoliciesModule,
    ITSMModule,
    IncidentsModule,
    EvidenceModule,
    GatewayConfigModule,
    ChatModule,
    McpApprovalModule,
    AgentScheduleModule,
    AgentTriggerModule,
    AgentWorkflowModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule, OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly authService: AuthService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }

  async onApplicationBootstrap() {
    try {
      await this.authService.ensureBootstrapAdmin();
    } catch (error) {
      this.logger.error('Error ensuring bootstrap admin:', error);
    }
  }
}
