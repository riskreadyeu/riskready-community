import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateMeetingAttendanceDto,
  UpdateMeetingAttendanceDto,
} from '../dto/organisation-crud.dto';

@Injectable()
export class MeetingAttendanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.MeetingAttendanceWhereInput;
    orderBy?: Prisma.MeetingAttendanceOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.meetingAttendance.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          meeting: { select: { id: true, title: true, meetingDate: true } },
          member: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.meetingAttendance.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.meetingAttendance.findUnique({
      where: { id },
      include: {
        meeting: { select: { id: true, title: true, meetingDate: true } },
        member: { select: { id: true, email: true, firstName: true, lastName: true } },
        proxyAttendee: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: CreateMeetingAttendanceDto) {
    return this.prisma.meetingAttendance.create({
      data: data as Prisma.MeetingAttendanceUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateMeetingAttendanceDto) {
    return this.prisma.meetingAttendance.update({
      where: { id },
      data: data as Prisma.MeetingAttendanceUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.meetingAttendance.delete({ where: { id } });
  }

  async bulkCreate(meetingId: string, attendances: { memberId: string; attendanceStatus: string }[]) {
    return this.prisma.meetingAttendance.createMany({
      data: attendances.map(a => ({
        meetingId,
        memberId: a.memberId,
        attendanceStatus: a.attendanceStatus,
      })),
      skipDuplicates: true,
    });
  }
}
