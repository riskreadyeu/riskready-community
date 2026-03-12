import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ChangeCategory } from '@prisma/client';
import { CreateChangeTemplateDto, UpdateChangeTemplateDto } from '../dto/change-template.dto';

type CreateChangeTemplateInput = CreateChangeTemplateDto & { templateCode: string };

@Injectable()
export class ChangeTemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    isActive?: boolean;
    category?: string;
    search?: string;
  }) {
    const { skip, take, isActive, category, search } = params || {};
    
    const where: Prisma.ChangeTemplateWhereInput = {};
    
    if (isActive !== undefined) where.isActive = isActive;
    if (category) where.category = category as ChangeCategory;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { templateCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [results, count] = await Promise.all([
      this.prisma.changeTemplate.findMany({
        skip,
        take,
        where,
        orderBy: { templateCode: 'asc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.changeTemplate.count({ where }),
    ]);

    return { results, count };
  }

  async findOne(id: string) {
    const template = await this.prisma.changeTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!template) {
      throw new NotFoundException(`Change template with ID ${id} not found`);
    }

    return template;
  }

  async findByCode(templateCode: string) {
    const template = await this.prisma.changeTemplate.findUnique({
      where: { templateCode },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!template) {
      throw new NotFoundException(`Change template with code ${templateCode} not found`);
    }

    return template;
  }

  async create(data: CreateChangeTemplateInput, userId?: string) {
    return this.prisma.changeTemplate.create({
      data: {
        ...data,
        createdBy: userId ? { connect: { id: userId } } : undefined,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateChangeTemplateDto) {
    return this.prisma.changeTemplate.update({
      where: { id },
      data: data as Prisma.ChangeTemplateUncheckedUpdateInput,
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.changeTemplate.delete({ where: { id } });
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.prisma.changeTemplate.update({
      where: { id },
      data: { isActive },
    });
  }

  async generateTemplateCode(category: string): Promise<string> {
    const prefix = `STD-${category.substring(0, 3).toUpperCase()}`;
    
    const lastTemplate = await this.prisma.changeTemplate.findFirst({
      where: {
        templateCode: { startsWith: prefix },
      },
      orderBy: { templateCode: 'desc' },
    });

    let nextNumber = 1;
    if (lastTemplate) {
      const match = lastTemplate.templateCode.match(/-(\d+)$/);
      if (match?.[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Create a change from a template
  async createChangeFromTemplate(
    templateId: string,
    overrides: {
      title?: string;
      description?: string;
      plannedStart?: Date;
      plannedEnd?: Date;
      requesterId: string;
    },
  ) {
    const template = await this.findOne(templateId);

    // Generate change reference
    const lastChange = await this.prisma.change.findFirst({
      orderBy: { changeRef: 'desc' },
    });

    let nextNumber = 1;
    if (lastChange) {
      const match = lastChange.changeRef.match(/CHG-\d{4}-(\d+)/);
      if (match?.[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const changeRef = `CHG-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, '0')}`;

    return this.prisma.change.create({
      data: {
        changeRef,
        title: overrides.title || `${template.name} - ${new Date().toLocaleDateString()}`,
        description: overrides.description || template.description,
        changeType: 'STANDARD',
        category: template.category,
        securityImpact: template.securityImpact,
        riskLevel: template.riskLevel,
        backoutPlan: template.backoutPlan,
        testPlan: template.testPlan,
        status: template.autoApprove ? 'APPROVED' : 'SUBMITTED',
        plannedStart: overrides.plannedStart,
        plannedEnd: overrides.plannedEnd,
        requester: { connect: { id: overrides.requesterId } },
      },
      include: {
        requester: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }
}
