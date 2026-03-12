import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateContextIssueDto,
  UpdateContextIssueDto,
} from '../dto/organisation-crud.dto';

@Injectable()
export class ContextIssueService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ContextIssueWhereInput;
    orderBy?: Prisma.ContextIssueOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.contextIssue.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { issueCode: 'asc' },
      }),
      this.prisma.contextIssue.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.contextIssue.findUnique({
      where: { id },
    });
  }

  async create(data: CreateContextIssueDto) {
    return this.prisma.contextIssue.create({
      data: data as Prisma.ContextIssueUncheckedCreateInput,
    });
  }

  async update(id: string, data: UpdateContextIssueDto) {
    return this.prisma.contextIssue.update({
      where: { id },
      data: data as Prisma.ContextIssueUncheckedUpdateInput,
    });
  }

  async delete(id: string) {
    return this.prisma.contextIssue.delete({ where: { id } });
  }

  async getSummary() {
    const [total, internal, external, threats, opportunities] = await Promise.all([
      this.prisma.contextIssue.count(),
      this.prisma.contextIssue.count({ where: { issueType: 'internal' } }),
      this.prisma.contextIssue.count({ where: { issueType: 'external' } }),
      this.prisma.contextIssue.count({ where: { impactType: 'negative' } }),
      this.prisma.contextIssue.count({ where: { impactType: 'positive' } }),
    ]);

    return { total, internal, external, threats, opportunities };
  }
}
