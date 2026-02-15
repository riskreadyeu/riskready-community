import { Injectable, Logger } from '@nestjs/common';

export interface ScenarioInputs {
  assetCount?: number;
  vendorCount?: number;
  applicationCount?: number;
  [key: string]: any;
}

@Injectable()
export class ScenarioEntityResolverService {
  private readonly logger = new Logger(ScenarioEntityResolverService.name);

  async getScenarioEntities(params: any): Promise<ScenarioInputs> {
    this.logger.debug('getScenarioEntities (stub)');
    return {};
  }
}
