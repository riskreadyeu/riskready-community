import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SecurityCommitteeService } from '../services/security-committee.service';
import {
  CreateSecurityCommitteeDto,
  UpdateSecurityCommitteeDto,
} from '../dto/organisation-crud.dto';

@Controller('organisation/security-committees')
export class SecurityCommitteeController {
  constructor(private readonly service: SecurityCommitteeService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('committeeType') committeeType?: string,
    @Query('isActive') isActive?: string,
  ) {
    const where: Prisma.SecurityCommitteeWhereInput = {};
    if (committeeType) where.committeeType = committeeType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateSecurityCommitteeDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateSecurityCommitteeDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
