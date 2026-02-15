import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ChangeService } from '../services/change.service';
import { CreateChangeDto, UpdateChangeDto } from '../dto/change.dto';

@Controller('itsm/changes')
export class ChangeController {
  constructor(private readonly service: ChangeService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('changeType') changeType?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('securityImpact') securityImpact?: string,
    @Query('requesterId') requesterId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    const where: any = {};

    if (status) where.status = status;
    if (changeType) where.changeType = changeType;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (securityImpact) where.securityImpact = securityImpact;
    if (requesterId) where.requesterId = requesterId;
    if (departmentId) where.departmentId = departmentId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { changeRef: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

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

  @Get('calendar')
  async getCalendar(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getCalendar(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('cab-dashboard')
  async getCabDashboard() {
    return this.service.getCabDashboard();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.service.getHistory(id);
  }

  @Post()
  async create(@Body() data: CreateChangeDto, @Request() req: any) {
    return this.service.create(data, req.user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateChangeDto, @Request() req: any) {
    return this.service.update(id, data, req.user.id);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Request() req: any) {
    return this.service.submit(id, req.user.id);
  }

  @Post(':id/assets')
  async linkAssets(
    @Param('id') id: string,
    @Body() data: { assets: Array<{ assetId: string; impactType: string; notes?: string }> },
  ) {
    return this.service.linkAssets(id, data.assets);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
