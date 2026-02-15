import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MeetingDecisionService } from '../services/meeting-decision.service';

@Controller('organisation/meeting-decisions')
export class MeetingDecisionController {
  constructor(private readonly service: MeetingDecisionService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('meetingId') meetingId?: string,
    @Query('decisionType') decisionType?: string,
    @Query('implemented') implemented?: string,
  ) {
    const where: any = {};
    if (meetingId) where.meetingId = meetingId;
    if (decisionType) where.decisionType = decisionType;
    if (implemented !== undefined) where.implemented = implemented === 'true';

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('pending-implementation')
  async getPendingImplementation() {
    return this.service.getPendingImplementation();
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
