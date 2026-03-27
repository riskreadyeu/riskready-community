import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MeetingAttendanceService } from '../services/meeting-attendance.service';
import {
  BulkMeetingAttendanceDto,
  CreateMeetingAttendanceDto,
  UpdateMeetingAttendanceDto,
} from '../dto/organisation-crud.dto';

@Controller('organisation/meeting-attendances')
export class MeetingAttendanceController {
  constructor(private readonly service: MeetingAttendanceService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('meetingId') meetingId?: string,
    @Query('memberId') memberId?: string,
  ) {
    const where: Prisma.MeetingAttendanceWhereInput = {};
    if (meetingId) where.meetingId = meetingId;
    if (memberId) where.memberId = memberId;

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
  async create(@Body() data: CreateMeetingAttendanceDto) {
    return this.service.create(data);
  }

  @Post('bulk/:meetingId')
  async bulkCreate(
    @Param('meetingId') meetingId: string,
    @Body() data: BulkMeetingAttendanceDto,
  ) {
    return this.service.bulkCreate(meetingId, data.attendances);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateMeetingAttendanceDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
