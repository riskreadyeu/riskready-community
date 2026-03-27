import { Module } from '@nestjs/common';
// PrismaService provided globally by PrismaModule
// EventEmitter2 provided globally by shared EventEmitterModule
import { NonconformityController } from './controllers/nonconformity.controller';
import { NonconformityService } from './services/nonconformity.service';

@Module({
  imports: [],
  controllers: [NonconformityController],
  providers: [NonconformityService],
  exports: [NonconformityService],
})
export class AuditsModule { }
