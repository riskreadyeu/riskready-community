import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MeetingActionItemService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.MeetingActionItemWhereInput;
    orderBy?: Prisma.MeetingActionItemOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.meetingActionItem.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || [{ priority: 'asc' }, { dueDate: 'asc' }],
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              meetingDate: true,
              committee: { select: { id: true, name: true } },
            },
          },
          assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          assignedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.meetingActionItem.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.meetingActionItem.findUnique({
      where: { id },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            meetingDate: true,
            committee: { select: { id: true, name: true } },
          },
        },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        dependsOn: { select: { id: true, title: true, status: true } },
        dependentItems: { select: { id: true, title: true, status: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.MeetingActionItemCreateInput) {
    return this.prisma.meetingActionItem.create({ data });
  }

  async update(id: string, data: Prisma.MeetingActionItemUpdateInput) {
    return this.prisma.meetingActionItem.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.meetingActionItem.delete({ where: { id } });
  }

  async getOverdue() {
    const now = new Date();
    return this.prisma.meetingActionItem.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        meeting: { select: { id: true, title: true, committee: { select: { name: true } } } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getByAssignee(userId: string) {
    return this.prisma.meetingActionItem.findMany({
      where: {
        assignedToId: userId,
        status: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        meeting: { select: { id: true, title: true, committee: { select: { name: true } } } },
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async getSummary() {
    const now = new Date();
    const [total, open, inProgress, completed, overdue, byPriority] = await Promise.all([
      this.prisma.meetingActionItem.count(),
      this.prisma.meetingActionItem.count({ where: { status: 'open' } }),
      this.prisma.meetingActionItem.count({ where: { status: 'in_progress' } }),
      this.prisma.meetingActionItem.count({ where: { status: 'completed' } }),
      this.prisma.meetingActionItem.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ['completed', 'cancelled'] },
        },
      }),
      this.prisma.meetingActionItem.groupBy({
        by: ['priority'],
        _count: true,
        where: { status: { notIn: ['completed', 'cancelled'] } },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      completed,
      overdue,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
