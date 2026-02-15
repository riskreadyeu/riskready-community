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
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncidentTimelineEntryType, IncidentVisibility } from '@prisma/client';

@Controller('incidents/:incidentId/timeline')
export class IncidentTimelineController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Param('incidentId') incidentId: string,
    @Query('entryType') entryType?: IncidentTimelineEntryType,
    @Query('visibility') visibility?: IncidentVisibility,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const where: any = { incidentId };
    if (entryType) where.entryType = entryType;
    if (visibility) where.visibility = visibility;

    const [results, count] = await Promise.all([
      this.prisma.incidentTimelineEntry.findMany({
        where,
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        orderBy: { timestamp: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.incidentTimelineEntry.count({ where }),
    ]);

    return { results, count };
  }

  @Get(':id')
  async findOne(@Param('incidentId') incidentId: string, @Param('id') id: string) {
    const entry = await this.prisma.incidentTimelineEntry.findFirst({
      where: { id, incidentId },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Timeline entry ${id} not found`);
    }

    return entry;
  }

  @Post()
  async create(
    @Param('incidentId') incidentId: string,
    @Request() req: any,
    @Body()
    data: {
      timestamp: string;
      entryType: IncidentTimelineEntryType;
      title: string;
      description?: string;
      visibility?: IncidentVisibility;
      sourceSystem?: string;
    },
  ) {
    // Verify incident exists
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    return this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId,
        timestamp: new Date(data.timestamp),
        entryType: data.entryType,
        title: data.title,
        description: data.description,
        visibility: data.visibility || 'INTERNAL',
        isAutomated: false,
        sourceSystem: data.sourceSystem,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  @Put(':id')
  async update(
    @Param('incidentId') incidentId: string,
    @Param('id') id: string,
    @Body()
    data: {
      timestamp?: string;
      entryType?: IncidentTimelineEntryType;
      title?: string;
      description?: string;
      visibility?: IncidentVisibility;
    },
  ) {
    const entry = await this.prisma.incidentTimelineEntry.findFirst({
      where: { id, incidentId },
    });

    if (!entry) {
      throw new NotFoundException(`Timeline entry ${id} not found`);
    }

    // Don't allow editing automated entries
    if (entry.isAutomated) {
      throw new NotFoundException('Cannot edit automated timeline entries');
    }

    return this.prisma.incidentTimelineEntry.update({
      where: { id },
      data: {
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
        entryType: data.entryType,
        title: data.title,
        description: data.description,
        visibility: data.visibility,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  @Delete(':id')
  async delete(@Param('incidentId') incidentId: string, @Param('id') id: string) {
    const entry = await this.prisma.incidentTimelineEntry.findFirst({
      where: { id, incidentId },
    });

    if (!entry) {
      throw new NotFoundException(`Timeline entry ${id} not found`);
    }

    // Don't allow deleting automated entries
    if (entry.isAutomated) {
      throw new NotFoundException('Cannot delete automated timeline entries');
    }

    return this.prisma.incidentTimelineEntry.delete({
      where: { id },
    });
  }
}

