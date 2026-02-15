import { Controller, Get, Put, Body, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly, AdminOnlyGuard } from '../shared/guards/admin-only.guard';
import { GatewayConfigService } from './gateway-config.service';
import { AuthenticatedRequest } from '../shared/types';

@Controller('gateway-config')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@AdminOnly()
export class GatewayConfigController {
  constructor(private readonly service: GatewayConfigService) {}

  @Get()
  async getConfig(@Query('organisationId') organisationId: string) {
    return this.service.getConfig(organisationId);
  }

  @Put()
  async updateConfig(
    @Query('organisationId') organisationId: string,
    @Body() dto: {
      anthropicApiKey?: string | null;
      agentModel?: string;
      gatewayUrl?: string;
      maxAgentTurns?: number;
    },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.upsertConfig(organisationId, dto, req.user?.id);
  }
}
