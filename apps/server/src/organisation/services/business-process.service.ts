import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BusinessProcessService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.BusinessProcessWhereInput;
    orderBy?: Prisma.BusinessProcessOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.businessProcess.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { processCode: 'asc' },
        include: {
          processOwner: { select: { id: true, email: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true, departmentCode: true } },
        },
      }),
      this.prisma.businessProcess.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.businessProcess.findUnique({
      where: { id },
      include: {
        processOwner: { select: { id: true, email: true, firstName: true, lastName: true } },
        processManager: { select: { id: true, email: true, firstName: true, lastName: true } },
        backupOwner: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
        parentProcess: { select: { id: true, name: true, processCode: true } },
        subProcesses: { select: { id: true, name: true, processCode: true } },
        externalDependencies: { select: { id: true, name: true, dependencyType: true, criticalityLevel: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.BusinessProcessCreateInput) {
    return this.prisma.businessProcess.create({ data });
  }

  async update(id: string, data: Prisma.BusinessProcessUpdateInput) {
    return this.prisma.businessProcess.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.businessProcess.delete({ where: { id } });
  }

  async getMetrics() {
    const [total, active, bcpEnabled, byCriticality] = await Promise.all([
      this.prisma.businessProcess.count(),
      this.prisma.businessProcess.count({ where: { isActive: true } }),
      this.prisma.businessProcess.count({ where: { bcpEnabled: true } }),
      this.prisma.businessProcess.groupBy({
        by: ['criticalityLevel'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      bcpEnabled,
      byCriticality: byCriticality.reduce((acc, item) => {
        acc[item.criticalityLevel] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
