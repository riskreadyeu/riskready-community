import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RegulatorService } from '../services/regulator.service';
import {
  CreateRegulatorDto,
  UpdateRegulatorDto,
} from '../dto/organisation-crud.dto';

@Controller('organisation/regulators')
export class RegulatorController {
  constructor(private readonly service: RegulatorService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('regulatorType') regulatorType?: string,
    @Query('isActive') isActive?: string,
  ) {
    const where: Prisma.RegulatorWhereInput = {};
    if (regulatorType) where.regulatorType = regulatorType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('compliance-dashboard')
  async getComplianceDashboard() {
    return this.service.getComplianceDashboard();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateRegulatorDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateRegulatorDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
