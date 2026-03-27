import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateOrganisationalUnitDto,
  UpdateOrganisationalUnitDto,
} from '../dto/organisation-crud.dto';

@Injectable()
export class OrganisationalUnitService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.OrganisationalUnitWhereInput;
    orderBy?: Prisma.OrganisationalUnitOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.organisationalUnit.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { code: 'asc' },
        include: {
          parent: { select: { id: true, name: true, code: true } },
          head: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.organisationalUnit.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.organisationalUnit.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, code: true } },
        children: { select: { id: true, name: true, code: true, unitType: true } },
        head: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: CreateOrganisationalUnitDto) {
    return this.prisma.organisationalUnit.create({
      data: data as Prisma.OrganisationalUnitUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateOrganisationalUnitDto) {
    return this.prisma.organisationalUnit.update({
      where: { id },
      data: data as Prisma.OrganisationalUnitUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.organisationalUnit.delete({ where: { id } });
  }
}
