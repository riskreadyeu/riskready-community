import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductServiceService } from '../services/product-service.service';

@Controller('organisation/products-services')
export class ProductServiceController {
  constructor(private readonly service: ProductServiceService) {}

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('isActive') isActive?: string,
    @Query('productType') productType?: string,
    @Query('inIsmsScope') inIsmsScope?: string,
  ) {
    const where: Prisma.ProductServiceWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (productType) where.productType = productType;
    if (inIsmsScope !== undefined) where.inIsmsScope = inIsmsScope === 'true';

    return this.service.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('summary')
  async getSummary() {
    return this.service.getSummary();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() data: Prisma.ProductServiceCreateInput) {
    return this.service.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.ProductServiceUpdateInput) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
