import { Controller, Get, Put, Body, Query, Request } from '@nestjs/common';
import { GatewayConfigService } from './gateway-config.service';

@Controller('gateway-config')
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
    @Request() req: any,
  ) {
    return this.service.upsertConfig(organisationId, dto, req.user?.id);
  }
}
