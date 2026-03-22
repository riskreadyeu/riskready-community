import { Module } from '@nestjs/common';
import { GatewayConfigController } from './gateway-config.controller';
import { GatewayConfigService } from './gateway-config.service';
import { McpKeyController } from './mcp-key.controller';
import { McpKeyService } from './mcp-key.service';

@Module({
  controllers: [GatewayConfigController, McpKeyController],
  providers: [GatewayConfigService, McpKeyService],
  exports: [GatewayConfigService, McpKeyService],
})
export class GatewayConfigModule {}
