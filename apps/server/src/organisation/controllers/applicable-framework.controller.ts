import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApplicableFrameworkService } from '../services/applicable-framework.service';

@Controller('organisation/applicable-frameworks')
export class ApplicableFrameworkController {
  constructor(private readonly service: ApplicableFrameworkService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isApplicable') isApplicable?: string,
    @Query('frameworkType') frameworkType?: string,
    @Query('complianceStatus') complianceStatus?: string,
  ) {
    const where: any = {};
    if (isApplicable !== undefined) where.isApplicable = isApplicable === 'true';
    if (frameworkType) where.frameworkType = frameworkType;
    if (complianceStatus) where.complianceStatus = complianceStatus;

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

  @Get('applicable')
  async getApplicable() {
    return this.service.getApplicable();
  }

  @Get('by-type/:type')
  async getByType(@Param('type') type: string) {
    return this.service.getByType(type);
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
