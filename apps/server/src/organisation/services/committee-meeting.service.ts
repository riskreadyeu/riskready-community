import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCommitteeMeetingDto,
  UpdateCommitteeMeetingDto,
} from '../dto/organisation-crud.dto';

@Injectable()
export class CommitteeMeetingService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CommitteeMeetingWhereInput;
    orderBy?: Prisma.CommitteeMeetingOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.committeeMeeting.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { meetingDate: 'desc' },
        include: {
          committee: { select: { id: true, name: true, committeeType: true } },
          chair: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { attendances: true, decisions: true, actionItems: true } },
        },
      }),
      this.prisma.committeeMeeting.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.committeeMeeting.findUnique({
      where: { id },
      include: {
        committee: { select: { id: true, name: true, committeeType: true } },
        chair: { select: { id: true, email: true, firstName: true, lastName: true } },
        secretary: { select: { id: true, email: true, firstName: true, lastName: true } },
        attendances: {
          include: {
            member: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        decisions: true,
        actionItems: {
          include: {
            assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: CreateCommitteeMeetingDto) {
    return this.prisma.committeeMeeting.create({
      data: data as Prisma.CommitteeMeetingUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateCommitteeMeetingDto) {
    return this.prisma.committeeMeeting.update({
      where: { id },
      data: data as Prisma.CommitteeMeetingUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.committeeMeeting.delete({ where: { id } });
  }

  async getUpcoming(days: number = 30) {
    const now = new Date();
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    return this.prisma.committeeMeeting.findMany({
      where: {
        meetingDate: { gte: now, lte: future },
        status: { in: ['scheduled', 'in_progress'] },
      },
      include: {
        committee: { select: { id: true, name: true } },
      },
      orderBy: { meetingDate: 'asc' },
    });
  }
}
