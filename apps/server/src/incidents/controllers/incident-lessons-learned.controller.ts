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
import { LessonsLearnedCategory, LessonsLearnedStatus } from '@prisma/client';

@Controller('incidents/:incidentId/lessons-learned')
export class IncidentLessonsLearnedController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Param('incidentId') incidentId: string,
    @Query('category') category?: LessonsLearnedCategory,
    @Query('status') status?: LessonsLearnedStatus,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const where: any = { incidentId };
    if (category) where.category = category;
    if (status) where.status = status;

    const [results, count] = await Promise.all([
      this.prisma.incidentLessonsLearned.findMany({
        where,
        skip: skip ? parseInt(skip, 10) : undefined,
        take: take ? parseInt(take, 10) : undefined,
        orderBy: { priority: 'asc' },
        include: {
          assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.incidentLessonsLearned.count({ where }),
    ]);

    return { results, count };
  }

  @Get(':id')
  async findOne(@Param('incidentId') incidentId: string, @Param('id') id: string) {
    const lesson = await this.prisma.incidentLessonsLearned.findFirst({
      where: { id, incidentId },
      include: {
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson learned ${id} not found`);
    }

    return lesson;
  }

  @Post()
  async create(
    @Param('incidentId') incidentId: string,
    @Request() req: any,
    @Body()
    data: {
      category: LessonsLearnedCategory;
      observation: string;
      recommendation: string;
      priority?: number;
      targetDate?: string;
      assignedToId?: string;
    },
  ) {
    // Verify incident exists
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const lesson = await this.prisma.incidentLessonsLearned.create({
      data: {
        incidentId,
        category: data.category,
        observation: data.observation,
        recommendation: data.recommendation,
        priority: data.priority || 3,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        assignedToId: data.assignedToId,
        status: 'IDENTIFIED',
        createdById: req.user.id,
      },
      include: {
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Create timeline entry
    await this.prisma.incidentTimelineEntry.create({
      data: {
        incidentId,
        timestamp: new Date(),
        entryType: 'FINDING',
        title: `Lesson Learned Identified: ${data.category}`,
        description: data.observation.substring(0, 200) + (data.observation.length > 200 ? '...' : ''),
        visibility: 'INTERNAL',
        isAutomated: true,
        createdById: req.user.id,
      },
    });

    return lesson;
  }

  @Put(':id')
  async update(
    @Param('incidentId') incidentId: string,
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    data: {
      category?: LessonsLearnedCategory;
      observation?: string;
      recommendation?: string;
      status?: LessonsLearnedStatus;
      priority?: number;
      targetDate?: string;
      completedDate?: string;
      assignedToId?: string;
      correctiveActionId?: string;
    },
  ) {
    const lesson = await this.prisma.incidentLessonsLearned.findFirst({
      where: { id, incidentId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson learned ${id} not found`);
    }

    const updated = await this.prisma.incidentLessonsLearned.update({
      where: { id },
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        completedDate: data.completedDate ? new Date(data.completedDate) : undefined,
      },
      include: {
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // If status changed to IMPLEMENTED, update incident flag
    if (data.status === 'IMPLEMENTED' && lesson.status !== 'IMPLEMENTED') {
      // Check if all lessons are implemented
      const pendingLessons = await this.prisma.incidentLessonsLearned.count({
        where: {
          incidentId,
          status: { not: 'IMPLEMENTED' },
        },
      });

      if (pendingLessons === 0) {
        await this.prisma.incident.update({
          where: { id: incidentId },
          data: { lessonsLearnedCompleted: true },
        });
      }

      // Create timeline entry
      await this.prisma.incidentTimelineEntry.create({
        data: {
          incidentId,
          timestamp: new Date(),
          entryType: 'ACTION_TAKEN',
          title: `Lesson Learned Implemented`,
          description: `Recommendation "${updated.recommendation.substring(0, 100)}..." has been implemented`,
          visibility: 'INTERNAL',
          isAutomated: true,
          createdById: req.user.id,
        },
      });
    }

    return updated;
  }

  @Delete(':id')
  async delete(@Param('incidentId') incidentId: string, @Param('id') id: string) {
    const lesson = await this.prisma.incidentLessonsLearned.findFirst({
      where: { id, incidentId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson learned ${id} not found`);
    }

    return this.prisma.incidentLessonsLearned.delete({
      where: { id },
    });
  }

  // ============================================
  // LINK TO NONCONFORMITY
  // ============================================

  @Post(':id/link-nonconformity')
  async linkNonconformity(
    @Param('incidentId') incidentId: string,
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { nonconformityId: string },
  ) {
    const lesson = await this.prisma.incidentLessonsLearned.findFirst({
      where: { id, incidentId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson learned ${id} not found`);
    }

    // Create the incident-nonconformity link
    await this.prisma.incidentNonconformity.create({
      data: {
        incidentId,
        nonconformityId: data.nonconformityId,
        linkType: 'revealed_by',
        notes: `Linked from lesson learned: ${lesson.observation.substring(0, 100)}`,
      },
    });

    // Update the lesson with the corrective action ID
    return this.prisma.incidentLessonsLearned.update({
      where: { id },
      data: {
        correctiveActionId: data.nonconformityId,
      },
      include: {
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }
}

