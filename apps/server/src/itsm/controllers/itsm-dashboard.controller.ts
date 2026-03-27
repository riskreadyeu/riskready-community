import { Controller, Get } from '@nestjs/common';
import { AssetService } from '../services/asset.service';
import { ChangeService } from '../services/change.service';
import { CapacityService } from '../services/capacity.service';

@Controller('itsm/dashboard')
export class ITSMDashboardController {
  constructor(
    private readonly assetService: AssetService,
    private readonly changeService: ChangeService,
    private readonly capacityService: CapacityService,
  ) {}

  @Get()
  async getDashboard() {
    const [assetSummary, changeSummary, capacitySummary, assetsAtRisk] = await Promise.all([
      this.assetService.getSummary(),
      this.changeService.getSummary(),
      this.capacityService.getCapacitySummary(),
      this.capacityService.getAssetsAtRisk(),
    ]);

    return {
      assets: assetSummary,
      changes: changeSummary,
      capacity: capacitySummary,
      assetsAtRisk: assetsAtRisk.slice(0, 10), // Top 10
    };
  }
}
