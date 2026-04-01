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
    // Auto-resolve locationCode conflicts (field is optional)
    if (data.locationCode) {
      const baseCode = data.locationCode;
      let candidateCode = baseCode;
      let suffix = 1;
      while (await this.prisma.location.findFirst({
        where: { locationCode: candidateCode },
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
        data = { ...data, locationCode: candidateCode };
      }
    }

    return this.prisma.location.create({ data });
  }

  async update(id: string, data: Prisma.LocationUpdateInput) {
    return this.prisma.location.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.location.delete({ where: { id } });
  }
}
