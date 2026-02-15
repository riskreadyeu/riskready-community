import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ContextIssueService } from '../services/context-issue.service';

@Controller('organisation/context-issues')
export class ContextIssueController {
  constructor(private readonly service: ContextIssueService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isActive') isActive?: string,
    @Query('issueType') issueType?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (issueType) where.issueType = issueType;
    if (category) where.category = category;
    if (status) where.status = status;

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
