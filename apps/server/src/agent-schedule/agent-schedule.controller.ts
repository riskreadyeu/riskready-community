import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AgentScheduleService } from './agent-schedule.service';
import { CreateAgentScheduleDto, UpdateAgentScheduleDto } from './agent-schedule.dto';
import { AuthenticatedRequest } from '../shared/types';
import { AdminOnly, AdminOnlyGuard } from '../shared/guards/admin-only.guard';

@Controller('agent-schedules')
@UseGuards(AdminOnlyGuard)
@AdminOnly()
export class AgentScheduleController {
  constructor(private readonly service: AgentScheduleService) {}

  @Get()
  findAll(
    @Query('organisationId') organisationId?: string,
    @Query('enabled') enabled?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.findAll({
      organisationId,
      enabled: enabled !== undefined ? enabled === 'true' : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() data: CreateAgentScheduleDto,
  ) {
    return this.service.create({
      ...data,
      createdBy: req.user?.id,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateAgentScheduleDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post(':id/run-now')
  triggerNow(@Param('id') id: string) {
    return this.service.triggerNow(id);
  }
}
