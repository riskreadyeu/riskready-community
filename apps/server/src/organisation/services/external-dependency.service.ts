import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExternalDependencyService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ExternalDependencyWhereInput;
    orderBy?: Prisma.ExternalDependencyOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.externalDependency.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { name: 'asc' },
        include: {
          _count: { select: { departments: true, businessProcesses: true } },
        },
      }),
      this.prisma.externalDependency.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.externalDependency.findUnique({
      where: { id },
      include: {
        departments: { select: { id: true, name: true, departmentCode: true } },
        businessProcesses: { select: { id: true, name: true, processCode: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.ExternalDependencyCreateInput) {
    return this.prisma.externalDependency.create({ data });
  }

  async update(id: string, data: Prisma.ExternalDependencyUpdateInput) {
    return this.prisma.externalDependency.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.externalDependency.delete({ where: { id } });
  }

  async getRiskAssessment() {
    const [total, byCriticality, byType, singlePointOfFailure] = await Promise.all([
      this.prisma.externalDependency.count(),
      this.prisma.externalDependency.groupBy({
        by: ['criticalityLevel'],
        _count: true,
      }),
      this.prisma.externalDependency.groupBy({
        by: ['dependencyType'],
        _count: true,
      }),
      this.prisma.externalDependency.count({ where: { singlePointOfFailure: true } }),
    ]);

    return {
      total,
      singlePointOfFailure,
      byCriticality: byCriticality.reduce((acc, item) => {
        acc[item.criticalityLevel] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc, item) => {
        acc[item.dependencyType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
