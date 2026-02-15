import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScopeItemDto, UpdateScopeItemDto } from '../dto/scope-item.dto';
import { ScopeType } from '@prisma/client';

@Injectable()
export class ScopeItemService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, scopeType?: ScopeType) {
    return this.prisma.scopeItem.findMany({
      where: {
        organisationId: orgId,
        ...(scopeType ? { scopeType } : {}),
      },
      include: {
        _count: { select: { assessmentTests: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: [{ scopeType: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.scopeItem.findUnique({
      where: { id },
      include: {
        _count: { select: { assessmentTests: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Scope item with ID ${id} not found`);
    }

    return item;
  }

  async create(data: CreateScopeItemDto, userId?: string) {
    // Check unique constraint: [orgId, scopeType, code]
    const existing = await this.prisma.scopeItem.findUnique({
      where: {
        organisationId_scopeType_code: {
          organisationId: data.organisationId,
          scopeType: data.scopeType,
          code: data.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Scope item with code "${data.code}" already exists for type ${data.scopeType}`
      );
    }

    return this.prisma.scopeItem.create({
      data: {
        organisationId: data.organisationId,
        scopeType: data.scopeType,
        code: data.code,
        name: data.name,
        description: data.description,
        criticality: data.criticality ?? 'MEDIUM',
        createdById: userId,
      },
      include: {
        _count: { select: { assessmentTests: true } },
      },
    });
  }

  async update(id: string, data: UpdateScopeItemDto) {
    const item = await this.prisma.scopeItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException(`Scope item with ID ${id} not found`);
    }

    return this.prisma.scopeItem.update({
      where: { id },
      data,
      include: {
        _count: { select: { assessmentTests: true } },
      },
    });
  }

  async delete(id: string) {
    const item = await this.prisma.scopeItem.findUnique({
      where: { id },
      include: { _count: { select: { assessmentTests: true } } },
    });

    if (!item) {
      throw new NotFoundException(`Scope item with ID ${id} not found`);
    }

    if (item._count.assessmentTests > 0) {
      throw new BadRequestException(
        `Cannot delete scope item: ${item._count.assessmentTests} tests reference it. Deactivate instead.`
      );
    }

    return this.prisma.scopeItem.delete({ where: { id } });
  }

  async findByType(orgId: string, scopeType: ScopeType) {
    return this.prisma.scopeItem.findMany({
      where: {
        organisationId: orgId,
        scopeType,
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });
  }
}
