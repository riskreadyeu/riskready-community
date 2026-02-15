import { Module } from '@nestjs/common';
import { GatewayConfigController } from './gateway-config.controller';
import { GatewayConfigService } from './gateway-config.service';

@Module({
  controllers: [GatewayConfigController],
  providers: [GatewayConfigService],
  exports: [GatewayConfigService],
})
export class GatewayConfigModule {}
