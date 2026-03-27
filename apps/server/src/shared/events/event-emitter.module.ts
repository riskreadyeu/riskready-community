import { Module, Global } from '@nestjs/common';
import { EventEmitterModule as NestEventEmitterModule } from '@nestjs/event-emitter';

/**
 * Global Event Emitter Module
 * Re-exports NestJS EventEmitterModule to make EventEmitter2 available globally
 */
@Global()
@Module({
  imports: [
    NestEventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  exports: [NestEventEmitterModule],
})
export class EventEmitterModule { }

