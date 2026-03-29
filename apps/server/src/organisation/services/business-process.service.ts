import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateBusinessProcessDto,
  UpdateBusinessProcessDto,
} from '../dto/organisation-crud.dto';

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

  async create(data: CreateBusinessProcessDto) {
    // Auto-resolve processCode conflicts
    if (data.processCode) {
      const baseCode = data.processCode;
      let candidateCode = baseCode;
      let suffix = 1;
      while (await this.prisma.businessProcess.findFirst({
        where: { processCode: candidateCode },
      })) {
        suffix++;
        const match = baseCode.match(/^(.+?)(\d+)$/);
        if (match) {
          const nextNum = (parseInt(match[2], 10) + suffix - 1).toString().padStart(match[2].length, '0');
          candidateCode = `${match[1]}${nextNum}`;
        } else {
          candidateCode = `${baseCode}-${suffix}`;
        }
      }
      if (candidateCode !== baseCode) {
        data = { ...data, processCode: candidateCode };
      }
    }

    return this.prisma.businessProcess.create({
      data: data as Prisma.BusinessProcessUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateBusinessProcessDto) {
    return this.prisma.businessProcess.update({
      where: { id },
      data: data as Prisma.BusinessProcessUncheckedUpdateInput,
    });
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
