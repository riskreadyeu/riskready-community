import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InterestedPartyService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.InterestedPartyWhereInput;
    orderBy?: Prisma.InterestedPartyOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.interestedParty.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { partyCode: 'asc' },
      }),
      this.prisma.interestedParty.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.interestedParty.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.InterestedPartyCreateInput) {
    return this.prisma.interestedParty.create({ data });
  }

  async update(id: string, data: Prisma.InterestedPartyUpdateInput) {
    return this.prisma.interestedParty.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.interestedParty.delete({ where: { id } });
  }

  async getSummary() {
    const [total, active, highPower, highInterest] = await Promise.all([
      this.prisma.interestedParty.count(),
      this.prisma.interestedParty.count({ where: { isActive: true } }),
      this.prisma.interestedParty.count({ where: { powerLevel: 'high' } }),
      this.prisma.interestedParty.count({ where: { interestLevel: 'high' } }),
    ]);

    return { total, active, highPower, highInterest };
  }
}
