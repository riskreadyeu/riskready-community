import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AssetRelationshipService } from '../services/asset-relationship.service';
import { CreateRelationshipDto, UpdateRelationshipDto } from '../dto/asset-relationship.dto';

@Controller('itsm/asset-relationships')
export class AssetRelationshipController {
  constructor(private readonly service: AssetRelationshipService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('relationshipType') relationshipType?: string,
    @Query('isCritical') isCritical?: string,
  ) {
    const where: Prisma.AssetRelationshipWhereInput = {};
    if (relationshipType) where.relationshipType = relationshipType as Prisma.AssetRelationshipWhereInput['relationshipType'];
    if (isCritical !== undefined) where.isCritical = isCritical === 'true';

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('by-asset/:assetId')
  async findByAsset(
    @Param('assetId') assetId: string,
    @Query('direction') direction?: 'outgoing' | 'incoming' | 'all',
  ) {
    return this.service.findByAsset(assetId, direction);
  }

  @Get('dependency-chain/:assetId')
  async getDependencyChain(
    @Param('assetId') assetId: string,
    @Query('depth') depth?: string,
  ) {
    return this.service.getDependencyChain(assetId, depth ? parseInt(depth) : 3);
  }

  @Post()
  async create(@Body() data: CreateRelationshipDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateRelationshipDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
