import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResourceOwnerGuard, CheckResourceOwner } from '../../shared/guards/resource-owner.guard';
import { AssetService } from '../services/asset.service';
import { CreateAssetDto, UpdateAssetDto, ImportAssetsDto } from '../dto/asset.dto';

@Controller('itsm/assets')
export class AssetController {
  constructor(private readonly service: AssetService) { }

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('assetType') assetType?: string,
    @Query('status') status?: string,
    @Query('businessCriticality') businessCriticality?: string,
    @Query('dataClassification') dataClassification?: string,
    @Query('departmentId') departmentId?: string,
    @Query('locationId') locationId?: string,
    @Query('ownerId') ownerId?: string,
    @Query('cloudProvider') cloudProvider?: string,
    @Query('inIsmsScope') inIsmsScope?: string,
    @Query('capacityStatus') capacityStatus?: string,
    @Query('search') search?: string,
  ) {
    const where: any = {};

    if (assetType) where.assetType = assetType;
    if (status) where.status = status;
    if (businessCriticality) where.businessCriticality = businessCriticality;
    if (dataClassification) where.dataClassification = dataClassification;
    if (departmentId) where.departmentId = departmentId;
    if (locationId) where.locationId = locationId;
    if (ownerId) where.ownerId = ownerId;
    if (cloudProvider) where.cloudProvider = cloudProvider;
    if (inIsmsScope !== undefined) where.inIsmsScope = inIsmsScope === 'true';
    if (capacityStatus) where.capacityStatus = capacityStatus;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fqdn: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('summary')
  async getSummary() {
    return this.service.getSummary();
  }

  @Get('generate-tag/:assetType')
  async generateAssetTag(@Param('assetType') assetType: string) {
    const tag = await this.service.generateAssetTag(assetType);
    return { assetTag: tag };
  }

  @Get('by-tag/:assetTag')
  async findByAssetTag(@Param('assetTag') assetTag: string) {
    return this.service.findByAssetTag(assetTag);
  }

  @Get('data-quality')
  async getDataQuality() {
    return this.service.getDataQuality();
  }

  @Get('export/template')
  async getImportTemplate() {
    return this.service.getImportTemplate();
  }

  @Get(':id/vulnerabilities')
  async getAssetVulnerabilities(@Param('id') id: string) {
    return this.service.getAssetVulnerabilities(id);
  }

  @Get(':id/impact')
  async getImpactAnalysis(@Param('id') id: string) {
    return this.service.getImpactAnalysis(id);
  }

  @Post(':id/calculate-risk')
  async calculateRiskScore(@Param('id') id: string) {
    await this.service.updateVulnerabilityCounts(id);
    const score = await this.service.calculateRiskScore(id);
    return { riskScore: score };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateAssetDto) {
    // DTO validation ensures data integrity, cast to service input type
    return this.service.create(data as any);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateAssetDto) {
    // DTO validation ensures data integrity, cast to service input type
    return this.service.update(id, data as any);
  }

  @Delete(':id')
  @UseGuards(ResourceOwnerGuard)
  @CheckResourceOwner({ resource: 'asset', param: 'id' })
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post('import')
  async importAssets(@Body() data: ImportAssetsDto) {
    return this.service.importAssets(data.assets);
  }

  @Post('calculate-all-risk-scores')
  async calculateAllRiskScores() {
    return this.service.calculateAllRiskScores();
  }
}

