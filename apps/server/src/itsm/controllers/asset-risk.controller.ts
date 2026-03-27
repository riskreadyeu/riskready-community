import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
} from '@nestjs/common';
import { AssetRiskService } from '../services/asset-risk.service';
import { LinkAssetRiskDto, BulkLinkDto } from '../dto/asset-risk.dto';

@Controller('itsm/asset-risks')
export class AssetRiskController {
  constructor(private readonly service: AssetRiskService) {}

  @Get('by-asset/:assetId')
  async findByAsset(@Param('assetId') assetId: string) {
    return this.service.findByAsset(assetId);
  }

  @Get('by-risk/:riskId')
  async findByRisk(@Param('riskId') riskId: string) {
    return this.service.findByRisk(riskId);
  }

  @Get('summary')
  async getSummary() {
    return this.service.getAssetRiskSummary();
  }

  @Post()
  async linkAssetToRisk(@Body() data: LinkAssetRiskDto) {
    return this.service.linkAssetToRisk(data);
  }

  @Post('bulk/:riskId')
  async bulkLinkAssetsToRisk(
    @Param('riskId') riskId: string,
    @Body() data: BulkLinkDto,
  ) {
    return this.service.bulkLinkAssetsToRisk(
      riskId,
      data.assets.map((assetId: string) => ({ assetId, impactLevel: data.impactLevel, notes: data.notes })),
    );
  }

  @Delete(':assetId/:riskId')
  @HttpCode(204)
  async unlinkAssetFromRisk(
    @Param('assetId') assetId: string,
    @Param('riskId') riskId: string,
  ) {
    return this.service.unlinkAssetFromRisk(assetId, riskId);
  }
}
