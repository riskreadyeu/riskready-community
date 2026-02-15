import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class KeyPersonnelService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.KeyPersonnelWhereInput;
    orderBy?: Prisma.KeyPersonnelOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.keyPersonnel.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { personCode: 'asc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          backupPerson: { select: { id: true, personCode: true, name: true, jobTitle: true } },
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.keyPersonnel.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.keyPersonnel.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        backupPerson: { select: { id: true, personCode: true, name: true, jobTitle: true, email: true, phone: true } },
        backupFor: { select: { id: true, personCode: true, name: true, jobTitle: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.KeyPersonnelCreateInput) {
    return this.prisma.keyPersonnel.create({
      data,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        backupPerson: { select: { id: true, personCode: true, name: true, jobTitle: true } },
      },
    });
  }

  async update(id: string, data: Prisma.KeyPersonnelUpdateInput) {
    return this.prisma.keyPersonnel.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        backupPerson: { select: { id: true, personCode: true, name: true, jobTitle: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.keyPersonnel.delete({ where: { id } });
  }

  async getSummary() {
    const [total, active, byRole] = await Promise.all([
      this.prisma.keyPersonnel.count(),
      this.prisma.keyPersonnel.count({ where: { isActive: true } }),
      this.prisma.keyPersonnel.groupBy({
        by: ['ismsRole'],
        _count: { id: true },
        where: { isActive: true },
      }),
    ]);

    return {
      total,
      active,
      byRole: byRole.map(r => ({ role: r.ismsRole, count: r._count.id })),
    };
  }

  async getByRole(role: string) {
    return this.prisma.keyPersonnel.findMany({
      where: { ismsRole: role, isActive: true },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        backupPerson: { select: { id: true, personCode: true, name: true, jobTitle: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
