import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BusinessProcessService } from '../services/business-process.service';

@Controller('organisation/processes')
export class BusinessProcessController {
  constructor(private readonly service: BusinessProcessService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('departmentId') departmentId?: string,
    @Query('processType') processType?: string,
    @Query('criticalityLevel') criticalityLevel?: string,
    @Query('bcpEnabled') bcpEnabled?: string,
  ) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (processType) where.processType = processType;
    if (criticalityLevel) where.criticalityLevel = criticalityLevel;
    if (bcpEnabled !== undefined) where.bcpEnabled = bcpEnabled === 'true';

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('metrics')
  async getMetrics() {
    return this.service.getMetrics();
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
