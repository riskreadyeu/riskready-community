import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CommitteeMeetingService } from '../services/committee-meeting.service';
import {
  CreateCommitteeMeetingDto,
  UpdateCommitteeMeetingDto,
} from '../dto/organisation-crud.dto';

@Controller('organisation/committee-meetings')
export class CommitteeMeetingController {
  constructor(private readonly service: CommitteeMeetingService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('committeeId') committeeId?: string,
    @Query('status') status?: string,
  ) {
    const where: Prisma.CommitteeMeetingWhereInput = {};
    if (committeeId) where.committeeId = committeeId;
    if (status) where.status = status;

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('upcoming')
  async getUpcoming(@Query('days') days?: string) {
    return this.service.getUpcoming(days ? parseInt(days) : 30);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateCommitteeMeetingDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateCommitteeMeetingDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
