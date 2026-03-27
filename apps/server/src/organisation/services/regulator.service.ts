import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateRegulatorDto,
  UpdateRegulatorDto,
} from '../dto/organisation-crud.dto';

@Injectable()
export class RegulatorService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.RegulatorWhereInput;
    orderBy?: Prisma.RegulatorOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.regulator.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { name: 'asc' },
      }),
      this.prisma.regulator.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.regulator.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: CreateRegulatorDto) {
    return this.prisma.regulator.create({
      data: data as Prisma.RegulatorUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateRegulatorDto) {
    return this.prisma.regulator.update({
      where: { id },
      data: data as Prisma.RegulatorUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.regulator.delete({ where: { id } });
  }

  async getComplianceDashboard() {
    const [total, byType, byStatus, upcomingInspections] = await Promise.all([
      this.prisma.regulator.count({ where: { isActive: true } }),
      this.prisma.regulator.groupBy({
        by: ['regulatorType'],
        _count: true,
        where: { isActive: true },
      }),
      this.prisma.regulator.groupBy({
        by: ['registrationStatus'],
        _count: true,
        where: { isActive: true },
      }),
      this.prisma.regulator.findMany({
        where: {
          isActive: true,
          nextInspectionDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
          },
        },
        select: {
          id: true,
          name: true,
          acronym: true,
          nextInspectionDate: true,
        },
        orderBy: { nextInspectionDate: 'asc' },
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.regulatorType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.registrationStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
      upcomingInspections,
    };
  }
}
