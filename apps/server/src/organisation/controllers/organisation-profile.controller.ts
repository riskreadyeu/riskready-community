import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { OrganisationProfileService } from '../services/organisation-profile.service';
import { CreateOrganisationProfileDto, UpdateOrganisationProfileDto } from '../dto/organisation-profile.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('organisation/profiles')
export class OrganisationProfileController {
  constructor(private readonly service: OrganisationProfileService) {}


  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('dashboard-summary')
  async getDashboardSummary() {
    return this.service.getDashboardSummary();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateOrganisationProfileDto) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateOrganisationProfileDto,
    @Request() req: AuthenticatedRequest
  ) {
    // Use updateWithAppetite to handle appetiteLevel specially
    return this.service.updateWithAppetite(id, data, req.user?.id);
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() data: UpdateOrganisationProfileDto,
    @Request() req: AuthenticatedRequest
  ) {
    // Use updateWithAppetite to handle appetiteLevel specially
    return this.service.updateWithAppetite(id, data, req.user?.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
