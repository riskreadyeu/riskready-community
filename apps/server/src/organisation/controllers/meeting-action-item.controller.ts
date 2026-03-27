import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MeetingActionItemService } from '../services/meeting-action-item.service';
import {
  CreateMeetingActionItemDto,
  UpdateMeetingActionItemDto,
} from '../dto/organisation-crud.dto';

@Controller('organisation/meeting-action-items')
export class MeetingActionItemController {
  constructor(private readonly service: MeetingActionItemService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('meetingId') meetingId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    const where: Prisma.MeetingActionItemWhereInput = {};
    if (meetingId) where.meetingId = meetingId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

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

  @Get('overdue')
  async getOverdue() {
    return this.service.getOverdue();
  }

  @Get('by-assignee/:userId')
  async getByAssignee(@Param('userId') userId: string) {
    return this.service.getByAssignee(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateMeetingActionItemDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateMeetingActionItemDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
