import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateSecurityCommitteeDto,
  UpdateSecurityCommitteeDto,
} from '../dto/organisation-crud.dto';

@Injectable()
export class SecurityCommitteeService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SecurityCommitteeWhereInput;
    orderBy?: Prisma.SecurityCommitteeOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.securityCommittee.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { name: 'asc' },
        include: {
          chair: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { memberships: true, meetings: true } },
        },
      }),
      this.prisma.securityCommittee.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.securityCommittee.findUnique({
      where: { id },
      include: {
        chair: { select: { id: true, email: true, firstName: true, lastName: true } },
        memberships: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          where: { isActive: true },
        },
        meetings: {
          take: 5,
          orderBy: { meetingDate: 'desc' },
          select: {
            id: true,
            title: true,
            meetingDate: true,
            status: true,
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: CreateSecurityCommitteeDto) {
    return this.prisma.securityCommittee.create({
      data: data as Prisma.SecurityCommitteeUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateSecurityCommitteeDto) {
    return this.prisma.securityCommittee.update({
      where: { id },
      data: data as Prisma.SecurityCommitteeUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.securityCommittee.delete({ where: { id } });
  }
}
