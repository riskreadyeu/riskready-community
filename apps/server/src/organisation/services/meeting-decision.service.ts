import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateMeetingDecisionDto,
  UpdateMeetingDecisionDto,
} from '../dto/organisation-crud.dto';

@Injectable()
export class MeetingDecisionService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.MeetingDecisionWhereInput;
    orderBy?: Prisma.MeetingDecisionOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.meetingDecision.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              meetingDate: true,
              committee: { select: { id: true, name: true } },
            },
          },
          responsibleParty: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.meetingDecision.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.meetingDecision.findUnique({
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
        responsibleParty: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: CreateMeetingDecisionDto) {
    return this.prisma.meetingDecision.create({
      data: data as Prisma.MeetingDecisionUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateMeetingDecisionDto) {
    return this.prisma.meetingDecision.update({
      where: { id },
      data: data as Prisma.MeetingDecisionUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.meetingDecision.delete({ where: { id } });
  }

  async getPendingImplementation() {
    return this.prisma.meetingDecision.findMany({
      where: {
        implemented: false,
        decisionType: 'approved',
      },
      include: {
        meeting: { select: { id: true, title: true, committee: { select: { name: true } } } },
        responsibleParty: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { implementationDeadline: 'asc' },
    });
  }
}
