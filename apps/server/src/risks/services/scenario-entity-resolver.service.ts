import { Injectable, Logger } from '@nestjs/common';

export interface ScenarioInputs {
  assetCount?: number;
  vendorCount?: number;
  applicationCount?: number;
  [key: string]: unknown;
}

@Injectable()
export class ScenarioEntityResolverService {
  private readonly logger = new Logger(ScenarioEntityResolverService.name);

  async getScenarioEntities(params: Record<string, unknown>): Promise<ScenarioInputs> {
    this.logger.debug('getScenarioEntities (stub)');
    return {};
  }
}
