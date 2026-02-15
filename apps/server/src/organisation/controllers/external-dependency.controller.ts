import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ExternalDependencyService } from '../services/external-dependency.service';

@Controller('organisation/dependencies')
export class ExternalDependencyController {
  constructor(private readonly service: ExternalDependencyService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('dependencyType') dependencyType?: string,
    @Query('criticalityLevel') criticalityLevel?: string,
  ) {
    const where: any = {};
    if (dependencyType) where.dependencyType = dependencyType;
    if (criticalityLevel) where.criticalityLevel = criticalityLevel;

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('risk-assessment')
  async getRiskAssessment() {
    return this.service.getRiskAssessment();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
