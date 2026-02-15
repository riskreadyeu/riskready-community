import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommitteeMembershipService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.CommitteeMembershipWhereInput;
    orderBy?: Prisma.CommitteeMembershipOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.committeeMembership.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          committee: { select: { id: true, name: true, committeeType: true } },
        },
      }),
      this.prisma.committeeMembership.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.committeeMembership.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        committee: { select: { id: true, name: true, committeeType: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.CommitteeMembershipCreateInput) {
    return this.prisma.committeeMembership.create({ data });
  }

  async update(id: string, data: Prisma.CommitteeMembershipUpdateInput) {
    return this.prisma.committeeMembership.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.committeeMembership.delete({ where: { id } });
  }
}
