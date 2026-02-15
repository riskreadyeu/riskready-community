import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.LocationWhereInput;
    orderBy?: Prisma.LocationOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.location.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { name: 'asc' },
      }),
      this.prisma.location.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.location.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.LocationCreateInput) {
    return this.prisma.location.create({ data });
  }

  async update(id: string, data: Prisma.LocationUpdateInput) {
    return this.prisma.location.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.location.delete({ where: { id } });
  }
}
