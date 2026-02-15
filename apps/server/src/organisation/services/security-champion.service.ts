import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SecurityChampionService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.SecurityChampionWhereInput;
    orderBy?: Prisma.SecurityChampionOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.securityChampion.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true, departmentCode: true } },
        },
      }),
      this.prisma.securityChampion.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.securityChampion.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, departmentCode: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.SecurityChampionCreateInput) {
    return this.prisma.securityChampion.create({ data });
  }

  async update(id: string, data: Prisma.SecurityChampionUpdateInput) {
    return this.prisma.securityChampion.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.securityChampion.delete({ where: { id } });
  }
}
