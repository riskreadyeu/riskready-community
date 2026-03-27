import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateProductServiceDto,
  UpdateProductServiceDto,
} from '../dto/organisation-crud.dto';

@Injectable()
export class ProductServiceService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductServiceWhereInput;
    orderBy?: Prisma.ProductServiceOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.productService.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { productCode: 'asc' },
      }),
      this.prisma.productService.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.productService.findUnique({
      where: { id },
    });
  }

  async create(data: CreateProductServiceDto) {
    return this.prisma.productService.create({
      data: data as Prisma.ProductServiceUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateProductServiceDto) {
    return this.prisma.productService.update({
      where: { id },
      data: data as Prisma.ProductServiceUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.productService.delete({ where: { id } });
  }

  async getSummary() {
    const [total, active, customerFacing, inScope] = await Promise.all([
      this.prisma.productService.count(),
      this.prisma.productService.count({ where: { isActive: true } }),
      this.prisma.productService.count({ where: { customerFacing: true } }),
      this.prisma.productService.count({ where: { inIsmsScope: true } }),
    ]);

    return { total, active, customerFacing, inScope };
  }
}
