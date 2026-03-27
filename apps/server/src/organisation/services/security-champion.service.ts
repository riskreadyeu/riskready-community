import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateSecurityChampionDto,
  UpdateSecurityChampionDto,
} from '../dto/organisation-crud.dto';

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

  async create(data: CreateSecurityChampionDto) {
    return this.prisma.securityChampion.create({
      data: data as Prisma.SecurityChampionUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateSecurityChampionDto) {
    return this.prisma.securityChampion.update({
      where: { id },
      data: data as Prisma.SecurityChampionUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.securityChampion.delete({ where: { id } });
  }
}
