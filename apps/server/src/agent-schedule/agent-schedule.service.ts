import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveSingleOrganisationId } from '../shared/utils/single-organisation.util';

@Injectable()
export class AgentScheduleService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    organisationId?: string;
    enabled?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.AgentScheduleWhereInput = {};
    if (params?.organisationId) where.organisationId = params.organisationId;
    if (params?.enabled !== undefined) where.enabled = params.enabled;

    const [results, count] = await Promise.all([
      this.prisma.agentSchedule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params?.skip || 0,
        take: params?.take || 50,
      }),
      this.prisma.agentSchedule.count({ where }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.agentSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException(`AgentSchedule ${id} not found`);
    }

    return schedule;
  }

  async create(data: {
    organisationId: string;
    name: string;
    description?: string;
    cronExpression: string;
    instruction: string;
    targetServers?: string[];
    enabled?: boolean;
    createdBy?: string;
  }) {
    const organisationId = await resolveSingleOrganisationId(this.prisma, data.organisationId);
    // Compute initial nextRunAt
    const nextRunAt = data.enabled !== false ? this.computeNextRun(data.cronExpression) : null;

    return this.prisma.agentSchedule.create({
      data: {
        organisationId: organisationId!,
        name: data.name,
        description: data.description,
        cronExpression: data.cronExpression,
        instruction: data.instruction,
        targetServers: data.targetServers || [],
        enabled: data.enabled ?? true,
        nextRunAt,
        createdBy: data.createdBy,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    cronExpression?: string;
    instruction?: string;
    targetServers?: string[];
    enabled?: boolean;
  }) {
    const existing = await this.findOne(id);

    const updateData: Prisma.AgentScheduleUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.instruction !== undefined) updateData.instruction = data.instruction;
    if (data.targetServers !== undefined) updateData.targetServers = data.targetServers;

    if (data.cronExpression !== undefined) {
      updateData.cronExpression = data.cronExpression;
      updateData.nextRunAt = this.computeNextRun(data.cronExpression);
    }

    if (data.enabled !== undefined) {
      updateData.enabled = data.enabled;
      if (data.enabled && !existing.nextRunAt) {
        updateData.nextRunAt = this.computeNextRun(data.cronExpression || existing.cronExpression);
      }
      if (!data.enabled) {
        updateData.nextRunAt = null;
      }
    }

    return this.prisma.agentSchedule.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.agentSchedule.delete({ where: { id } });
  }

  async triggerNow(id: string) {
    const schedule = await this.findOne(id);

    // Create an immediate task for the scheduler to pick up
    // by setting nextRunAt to now
    await this.prisma.agentSchedule.update({
      where: { id },
      data: {
        nextRunAt: new Date(),
        enabled: true,
      },
    });

    return { message: 'Schedule triggered. It will execute on the next scheduler tick.', scheduleId: id };
  }

  private computeNextRun(cronExpression: string): Date {
    // Simple next-minute computation; the scheduler service has the full cron parser
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1, 0, 0);
    return now;
  }
}
