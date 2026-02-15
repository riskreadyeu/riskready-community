import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ExecutivePositionService } from '../services/executive-position.service';

@Controller('organisation/executive-positions')
export class ExecutivePositionController {
  constructor(private readonly service: ExecutivePositionService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isActive') isActive?: string,
  ) {
    const where: Prisma.ExecutivePositionWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('org-chart')
  async getOrgChart() {
    return this.service.getOrgChart();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: Prisma.ExecutivePositionCreateInput) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.ExecutivePositionUpdateInput) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
