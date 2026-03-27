import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RiskEventBusService {
  private readonly logger = new Logger(RiskEventBusService.name);

  async emitScenarioCalculated(...args: unknown[]) {
    this.logger.debug('emitScenarioCalculated (stub)');
  }
}
