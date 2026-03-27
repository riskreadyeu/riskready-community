import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { TestResult, RootCauseCategory, RemediationEffort, TestMethod, AssessmentTestStatus, Prisma } from '@prisma/client';
import { AssessmentService } from './assessment.service';

@Injectable()
export class AssessmentTestService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private assessmentService: AssessmentService,
  ) {}

  async findByAssessment(assessmentId: string, filters?: { status?: string }) {
    return this.prisma.assessmentTest.findMany({
      where: {
        assessmentId,
        ...(filters?.status && { status: filters.status as AssessmentTestStatus }),
      },
      include: {
        scopeItem: { select: { id: true, code: true, name: true, scopeType: true, criticality: true } },
        assignedTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        assessor: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { executions: true } },
      },
      orderBy: [{ testCode: 'asc' }],
    });
  }

  async findOne(id: string) {
    const test = await this.prisma.assessmentTest.findUnique({
      where: { id },
      include: {
        assessment: { select: { id: true, assessmentRef: true, title: true, status: true } },
        scopeItem: { select: { id: true, code: true, name: true, scopeType: true, criticality: true } },
        assignedTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        assessor: { select: { id: true, email: true, firstName: true, lastName: true } },
        executions: {
          orderBy: { executionDate: 'desc' },
          take: 10,
          include: {
            tester: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException(`Assessment test with ID ${id} not found`);
    }

    return test;
  }

  async assignTester(id: string, testerId: string) {
    const test = await this.prisma.assessmentTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException(`Assessment test with ID ${id} not found`);

    return this.prisma.assessmentTest.update({
      where: { id },
      data: { assignedTesterId: testerId },
    });
  }

  async executeTest(
    id: string,
    data: {
      result: TestResult;
      findings?: string;
      recommendations?: string;
      evidenceLocation?: string;
      evidenceNotes?: string;
      evidenceFileIds?: string[];
      durationMinutes?: number;
      samplesReviewed?: number;
      periodStart?: Date;
      periodEnd?: Date;
    },
    testerId: string,
  ) {
    const test = await this.prisma.assessmentTest.findUnique({
      where: { id },
      include: {
        assessment: true,
      },
    });

    if (!test) throw new NotFoundException(`Assessment test with ID ${id} not found`);

    const executionDate = new Date();

    // Create execution record
    const execution = await this.prisma.assessmentExecution.create({
      data: {
        assessmentTestId: id,
        testerId,
        executionDate,
        result: data.result,
        findings: data.findings,
        recommendations: data.recommendations,
        evidenceLocation: data.evidenceLocation,
        evidenceNotes: data.evidenceNotes,
        evidenceFileIds: data.evidenceFileIds || [],
        durationMinutes: data.durationMinutes,
        samplesReviewed: data.samplesReviewed,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      },
      include: {
        tester: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    // Update test with latest results
    await this.prisma.assessmentTest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        result: data.result,
        findings: data.findings,
        recommendations: data.recommendations,
      },
    });

    // Recalculate assessment stats
    await this.assessmentService.recalculateStats(test.assessmentId);

    return execution;
  }

  async skipTest(id: string, justification: string) {
    const test = await this.prisma.assessmentTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException(`Assessment test with ID ${id} not found`);

    await this.prisma.assessmentTest.update({
      where: { id },
      data: {
        status: 'SKIPPED',
        skipJustification: justification,
      },
    });

    await this.assessmentService.recalculateStats(test.assessmentId);

    return this.findOne(id);
  }

  async updateRootCause(
    id: string,
    data: {
      rootCause?: RootCauseCategory;
      rootCauseNotes?: string;
      remediationEffort?: RemediationEffort;
      estimatedHours?: number;
      estimatedCost?: number;
    },
  ) {
    const test = await this.prisma.assessmentTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException(`Assessment test with ID ${id} not found`);

    return this.prisma.assessmentTest.update({
      where: { id },
      data: {
        rootCause: data.rootCause,
        rootCauseNotes: data.rootCauseNotes,
        remediationEffort: data.remediationEffort,
        estimatedHours: data.estimatedHours,
        estimatedCost: data.estimatedCost,
      },
    });
  }

  async updateTest(
    id: string,
    data: {
      testMethod?: TestMethod;
      ownerId?: string;
      assessorId?: string;
      assignedTesterId?: string;
    },
  ) {
    const test = await this.prisma.assessmentTest.findUnique({ where: { id } });
    if (!test) throw new NotFoundException(`Assessment test with ID ${id} not found`);

    return this.prisma.assessmentTest.update({
      where: { id },
      data,
      include: {
        assessment: { select: { id: true, assessmentRef: true, title: true, status: true } },
        scopeItem: { select: { id: true, code: true, name: true, scopeType: true, criticality: true } },
        assignedTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        assessor: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async getExecutions(assessmentTestId: string) {
    return this.prisma.assessmentExecution.findMany({
      where: { assessmentTestId },
      orderBy: { executionDate: 'desc' },
      include: {
        tester: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async getMyTests(userId: string, filters?: {
    status?: string;
    testMethod?: string;
    role?: 'owner' | 'tester' | 'assessor';
  }) {
    const roleConditions: Prisma.AssessmentTestWhereInput[] = [];
    if (!filters?.role || filters.role === 'owner') roleConditions.push({ ownerId: userId });
    if (!filters?.role || filters.role === 'tester') roleConditions.push({ assignedTesterId: userId });
    if (!filters?.role || filters.role === 'assessor') roleConditions.push({ assessorId: userId });

    const where: Prisma.AssessmentTestWhereInput = {
      OR: roleConditions,
      assessment: { status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] } },
    };
    if (filters?.status) where.status = filters.status as Prisma.AssessmentTestWhereInput['status'];
    if (filters?.testMethod) where.testMethod = filters.testMethod as Prisma.AssessmentTestWhereInput['testMethod'];

    return this.prisma.assessmentTest.findMany({
      where,
      include: {
        assessment: { select: { id: true, assessmentRef: true, title: true, status: true } },
        scopeItem: { select: { id: true, name: true, criticality: true } },
        assignedTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        assessor: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { executions: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getMyTestsCount(userId: string): Promise<number> {
    return this.prisma.assessmentTest.count({
      where: {
        OR: [
          { ownerId: userId },
          { assignedTesterId: userId },
          { assessorId: userId },
        ],
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        assessment: { status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] } },
      },
    });
  }

  async bulkAssign(testIds: string[], assignments: {
    assignedTesterId?: string;
    ownerId?: string;
    assessorId?: string;
    testMethod?: TestMethod;
  }) {
    return this.prisma.assessmentTest.updateMany({
      where: { id: { in: testIds } },
      data: assignments,
    });
  }
}
