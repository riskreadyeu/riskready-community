import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TechnologyPlatformService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.TechnologyPlatformWhereInput;
    orderBy?: Prisma.TechnologyPlatformOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.technologyPlatform.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { platformCode: 'asc' },
      }),
      this.prisma.technologyPlatform.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.technologyPlatform.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.TechnologyPlatformCreateInput) {
    return this.prisma.technologyPlatform.create({ data });
  }

  async update(id: string, data: Prisma.TechnologyPlatformUpdateInput) {
    return this.prisma.technologyPlatform.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.technologyPlatform.delete({ where: { id } });
  }

  async getSummary() {
    const [total, active, critical, inScope] = await Promise.all([
      this.prisma.technologyPlatform.count(),
      this.prisma.technologyPlatform.count({ where: { isActive: true } }),
      this.prisma.technologyPlatform.count({ where: { criticalityLevel: 'critical' } }),
      this.prisma.technologyPlatform.count({ where: { inIsmsScope: true } }),
    ]);

    return { total, active, critical, inScope };
  }
}
