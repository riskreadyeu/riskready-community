import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExecutivePositionService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ExecutivePositionWhereInput;
    orderBy?: Prisma.ExecutivePositionOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.executivePosition.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { executiveLevel: 'asc' },
        include: {
          person: { select: { id: true, email: true, firstName: true, lastName: true } },
          reportsTo: { select: { id: true, title: true, executiveLevel: true } },
        },
      }),
      this.prisma.executivePosition.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.executivePosition.findUnique({
      where: { id },
      include: {
        person: { select: { id: true, email: true, firstName: true, lastName: true } },
        reportsTo: { select: { id: true, title: true, executiveLevel: true } },
        subordinates: { select: { id: true, title: true, executiveLevel: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.ExecutivePositionCreateInput) {
    return this.prisma.executivePosition.create({ data });
  }

  async update(id: string, data: Prisma.ExecutivePositionUpdateInput) {
    return this.prisma.executivePosition.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.executivePosition.delete({ where: { id } });
  }

  async getOrgChart() {
    const positions = await this.prisma.executivePosition.findMany({
      where: { isActive: true },
      include: {
        person: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { executiveLevel: 'asc' },
    });

    interface PositionTreeNode extends Record<string, unknown> { subordinates: PositionTreeNode[] }
    const buildTree = (reportsToId: string | null): PositionTreeNode[] => {
      return positions
        .filter(p => p.reportsToId === reportsToId)
        .map(p => ({
          ...p,
          subordinates: buildTree(p.id),
        }));
    };

    return buildTree(null);
  }
}
