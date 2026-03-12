import { Controller, Get, Post, Put, Delete, Param, Query, Body, NotFoundException, BadRequestException, Request } from '@nestjs/common';
import { SOAService } from '../services/soa.service';
import { SOAEntryService } from '../services/soa-entry.service';
import { Prisma } from '@prisma/client';
import {
  CreateSOADto,
  CreateSOAFromControlsDto,
  CreateSOAVersionDto,
  UpdateSOADto,
  SubmitSOAForReviewDto,
  ApproveSOADto,
  UpdateSOAEntryDto,
  BulkUpdateSOAEntriesDto,
} from '../dto/soa.dto';
import { AuthenticatedRequest } from '../../shared/types';

@Controller('soa')
export class SOAController {
  constructor(
    private readonly service: SOAService,
    private readonly entryService: SOAEntryService,
  ) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('organisationId') organisationId?: string,
    @Query('status') status?: string,
  ) {
    const where: Prisma.StatementOfApplicabilityWhereInput = {};
    
    if (organisationId) where.organisationId = organisationId;
    if (status) where.status = status as Prisma.StatementOfApplicabilityWhereInput['status'];

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('stats')
  async getStats(@Query('organisationId') organisationId?: string) {
    return this.service.getStats(organisationId || undefined);
  }

  @Get('latest')
  async getLatest(@Query('organisationId') organisationId: string) {
    const soa = await this.service.findLatestByOrganisation(organisationId);
    if (!soa) {
      throw new NotFoundException('No SOA found for this organisation');
    }
    return soa;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const soa = await this.service.findOne(id);
    if (!soa) {
      throw new NotFoundException(`SOA with ID ${id} not found`);
    }
    return soa;
  }

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() data: CreateSOADto) {
    return this.service.create({ ...data, createdById: req.user.id });
  }

  @Post('from-controls')
  async createFromControls(@Request() req: AuthenticatedRequest, @Body() data: CreateSOAFromControlsDto) {
    try {
      return await this.service.createFromControls({ ...data, createdById: req.user.id });
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as Record<string, unknown>)['code'] === 'P2002') {
        throw new BadRequestException(`SOA version ${data.version} already exists for this organisation`);
      }
      throw error;
    }
  }

  @Post(':id/new-version')
  async createNewVersion(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: CreateSOAVersionDto
  ) {
    return this.service.createNewVersion(id, { ...data, createdById: req.user.id });
  }

  @Put(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdateSOADto
  ) {
    return this.service.update(id, { ...data, updatedById: req.user.id });
  }

  @Put(':id/submit')
  async submitForReview(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() _data: SubmitSOAForReviewDto
  ) {
    return this.service.submitForReview(id, req.user.id);
  }

  @Put(':id/approve')
  async approve(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() _data: ApproveSOADto
  ) {
    return this.service.approve(id, req.user.id);
  }

  @Put(':id/sync-to-controls')
  async syncToControls(@Param('id') id: string) {
    return this.entryService.syncToControls(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // Entry endpoints
  @Put('entries/:entryId')
  async updateEntry(
    @Param('entryId') entryId: string,
    @Body() data: UpdateSOAEntryDto
  ) {
    return this.entryService.updateEntry(entryId, data);
  }

  @Put(':id/entries/bulk')
  async bulkUpdateEntries(
    @Param('id') soaId: string,
    @Body() data: BulkUpdateSOAEntriesDto
  ) {
    return this.entryService.bulkUpdateEntries(soaId, data.updates);
  }
}
