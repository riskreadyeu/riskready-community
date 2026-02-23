import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TechnologyPlatformService } from '../services/technology-platform.service';

@Controller('organisation/technology-platforms')
export class TechnologyPlatformController {
  constructor(private readonly service: TechnologyPlatformService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isActive') isActive?: string,
    @Query('platformType') platformType?: string,
    @Query('criticalityLevel') criticalityLevel?: string,
  ) {
    const where: Prisma.TechnologyPlatformWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (platformType) where.platformType = platformType;
    if (criticalityLevel) where.criticalityLevel = criticalityLevel;

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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: Prisma.TechnologyPlatformCreateInput) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.TechnologyPlatformUpdateInput) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
