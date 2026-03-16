import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GatewayConfigModule } from '../gateway-config/gateway-config.module';

@Module({
  imports: [GatewayConfigModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
