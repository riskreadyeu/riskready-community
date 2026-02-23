import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InterestedPartyService } from '../services/interested-party.service';

@Controller('organisation/interested-parties')
export class InterestedPartyController {
  constructor(private readonly service: InterestedPartyService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isActive') isActive?: string,
    @Query('partyType') partyType?: string,
    @Query('powerLevel') powerLevel?: string,
  ) {
    const where: Prisma.InterestedPartyWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (partyType) where.partyType = partyType;
    if (powerLevel) where.powerLevel = powerLevel;

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
  async create(@Body() data: Prisma.InterestedPartyCreateInput) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.InterestedPartyUpdateInput) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
