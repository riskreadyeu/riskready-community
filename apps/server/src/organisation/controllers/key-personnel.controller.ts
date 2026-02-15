import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { KeyPersonnelService } from '../services/key-personnel.service';

@Controller('organisation/key-personnel')
export class KeyPersonnelController {
  constructor(private readonly service: KeyPersonnelService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isActive') isActive?: string,
    @Query('ismsRole') ismsRole?: string,
  ) {
    const where: Prisma.KeyPersonnelWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (ismsRole) where.ismsRole = ismsRole;

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

  @Get('by-role/:role')
  async getByRole(@Param('role') role: string) {
    return this.service.getByRole(role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: Prisma.KeyPersonnelCreateInput) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.KeyPersonnelUpdateInput) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
