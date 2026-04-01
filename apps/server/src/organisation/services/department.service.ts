import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.DepartmentWhereInput;
    orderBy?: Prisma.DepartmentOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.department.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { departmentCode: 'asc' },
        include: {
          parent: { select: { id: true, name: true, departmentCode: true } },
          departmentHead: { select: { id: true, email: true, firstName: true, lastName: true } },
          deputyHead: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { members: true, businessProcesses: true, securityChampions: true } },
        },
      }),
      this.prisma.department.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, departmentCode: true } },
        children: { select: { id: true, name: true, departmentCode: true } },
        departmentHead: { select: { id: true, email: true, firstName: true, lastName: true } },
        deputyHead: { select: { id: true, email: true, firstName: true, lastName: true } },
        members: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
        businessProcesses: { select: { id: true, name: true, processCode: true, criticalityLevel: true } },
        securityChampions: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.DepartmentCreateInput) {
    // Auto-resolve departmentCode conflicts
    if (data.departmentCode) {
      const baseCode = data.departmentCode;
      let candidateCode = baseCode;
      let suffix = 1;
      while (await this.prisma.department.findFirst({
        where: { departmentCode: candidateCode },
      })) {
        suffix++;
        const match = baseCode.match(/^(.+?)(\d+)$/);
        if (match) {
          const nextNum = (parseInt(match[2]!, 10) + suffix - 1).toString().padStart(match[2]!.length, '0');
          candidateCode = `${match[1]}${nextNum}`;
        } else {
          candidateCode = `${baseCode}-${suffix}`;
        }
      }
      if (candidateCode !== baseCode) {
        data = { ...data, departmentCode: candidateCode };
      }
    }

    return this.prisma.department.create({
      data,
      include: {
        parent: { select: { id: true, name: true, departmentCode: true } },
        departmentHead: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: Prisma.DepartmentUpdateInput) {
    return this.prisma.department.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true, departmentCode: true } },
        departmentHead: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }

  async getSummary() {
    const [total, active, critical, stats] = await Promise.all([
      this.prisma.department.count(),
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.department.count({ where: { criticalityLevel: 'critical' } }),
      this.prisma.department.aggregate({
        _sum: { headcount: true, budget: true },
      }),
    ]);

    return {
      total,
      active,
      critical,
      totalHeadcount: stats._sum.headcount || 0,
      totalBudget: stats._sum.budget || 0,
    };
  }

  async getHierarchy() {
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        departmentCode: true,
        parentId: true,
        headcount: true,
        criticalityLevel: true,
      },
      orderBy: { departmentCode: 'asc' },
    });

    // Build tree structure
    interface DepartmentTreeNode extends Record<string, unknown> { children: DepartmentTreeNode[] }
    const buildTree = (parentId: string | null): DepartmentTreeNode[] => {
      return departments
        .filter(d => d.parentId === parentId)
        .map(d => ({
          ...d,
          children: buildTree(d.id),
        }));
    };

    return buildTree(null);
  }
}
