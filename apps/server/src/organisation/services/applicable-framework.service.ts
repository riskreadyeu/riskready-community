import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApplicableFrameworkService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ApplicableFrameworkWhereInput;
    orderBy?: Prisma.ApplicableFrameworkOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.applicableFramework.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { frameworkCode: 'asc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.applicableFramework.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.applicableFramework.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.ApplicableFrameworkCreateInput) {
    return this.prisma.applicableFramework.create({
      data,
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: Prisma.ApplicableFrameworkUpdateInput) {
    return this.prisma.applicableFramework.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.applicableFramework.delete({ where: { id } });
  }

  async getSummary() {
    const [total, applicable, byType, byStatus] = await Promise.all([
      this.prisma.applicableFramework.count(),
      this.prisma.applicableFramework.count({ where: { isApplicable: true } }),
      this.prisma.applicableFramework.groupBy({
        by: ['frameworkType'],
        _count: { id: true },
      }),
      this.prisma.applicableFramework.groupBy({
        by: ['complianceStatus'],
        _count: { id: true },
        where: { isApplicable: true },
      }),
    ]);

    return {
      total,
      applicable,
      byType: byType.map(t => ({ type: t.frameworkType, count: t._count.id })),
      byStatus: byStatus.map(s => ({ status: s.complianceStatus, count: s._count.id })),
    };
  }

  async getApplicable() {
    return this.prisma.applicableFramework.findMany({
      where: { isApplicable: true },
      orderBy: { name: 'asc' },
    });
  }

  async getByType(type: string) {
    return this.prisma.applicableFramework.findMany({
      where: { frameworkType: type },
      orderBy: { name: 'asc' },
    });
  }
}
