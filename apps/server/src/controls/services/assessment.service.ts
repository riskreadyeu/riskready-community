import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ControlAssessmentStatus } from '@prisma/client';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  private async generateRef(organisationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.assessment.count({
      where: { organisationId, assessmentRef: { startsWith: `ASM-${year}` } },
    });
    return `ASM-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(
    data: {
      organisationId: string;
      title: string;
      description?: string;
      assessmentRef?: string;
      leadTesterId?: string;
      reviewerId?: string;
      plannedStartDate?: Date;
      plannedEndDate?: Date;
      dueDate?: Date;
      periodStart?: Date;
      periodEnd?: Date;
      controlIds?: string[];
      scopeItemIds?: string[];
    },
    userId?: string,
  ) {
    let assessmentRef = data.assessmentRef || await this.generateRef(data.organisationId);

    // Auto-resolve assessmentRef conflicts
    const organisationId = data.organisationId;
    if (assessmentRef && organisationId) {
      let candidateRef = assessmentRef;
      let suffix = 1;
      while (await this.prisma.assessment.findFirst({
        where: { assessmentRef: candidateRef, organisationId },
      })) {
        suffix++;
        const match = assessmentRef.match(/^(.+?)(\d+)$/);
        if (match) {
          const nextNum = (parseInt(match[2], 10) + suffix - 1).toString().padStart(match[2].length, '0');
          candidateRef = `${match[1]}${nextNum}`;
        } else {
          candidateRef = `${assessmentRef}-${suffix}`;
        }
      }
      assessmentRef = candidateRef;
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        organisationId: data.organisationId,
        assessmentRef,
        title: data.title,
        description: data.description,
        leadTesterId: data.leadTesterId,
        reviewerId: data.reviewerId,
        plannedStartDate: data.plannedStartDate,
        plannedEndDate: data.plannedEndDate,
        dueDate: data.dueDate,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        createdById: userId,
        controls: data.controlIds?.length
          ? { create: data.controlIds.map((controlId) => ({ controlId })) }
          : undefined,
        scopeItems: data.scopeItemIds?.length
          ? { create: data.scopeItemIds.map((scopeItemId) => ({ scopeItemId })) }
          : undefined,
      },
      include: {
        controls: { include: { control: { select: { id: true, controlId: true, name: true } } } },
        scopeItems: { include: { scopeItem: { select: { id: true, code: true, name: true, scopeType: true, criticality: true } } } },
        leadTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    return assessment;
  }

  async findAll(organisationId: string, filters?: { status?: ControlAssessmentStatus }) {
    return this.prisma.assessment.findMany({
      where: {
        organisationId,
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        leadTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, email: true, firstName: true, lastName: true } },
        _count: { select: { controls: true, tests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        controls: { include: { control: { select: { id: true, controlId: true, name: true, theme: true } } } },
        scopeItems: { include: { scopeItem: { select: { id: true, code: true, name: true, scopeType: true, criticality: true } } } },
        leadTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      leadTesterId?: string;
      reviewerId?: string;
      plannedStartDate?: Date;
      plannedEndDate?: Date;
      dueDate?: Date;
      periodStart?: Date;
      periodEnd?: Date;
    },
  ) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);

    return this.prisma.assessment.update({
      where: { id },
      data,
      include: {
        controls: { include: { control: { select: { id: true, controlId: true, name: true } } } },
        scopeItems: { include: { scopeItem: true } },
        leadTester: { select: { id: true, email: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);
    if (assessment.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT assessments can be deleted');
    }
    return this.prisma.assessment.delete({ where: { id } });
  }

  // Lifecycle transitions
  async startAssessment(id: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);
    if (assessment.status !== 'DRAFT') {
      throw new BadRequestException('Assessment must be in DRAFT status to start');
    }
    return this.prisma.assessment.update({
      where: { id },
      data: { status: 'IN_PROGRESS', actualStartDate: new Date() },
    });
  }

  async submitForReview(id: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);
    if (assessment.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Assessment must be IN_PROGRESS to submit for review');
    }
    return this.prisma.assessment.update({
      where: { id },
      data: { status: 'UNDER_REVIEW' },
    });
  }

  async completeAssessment(id: string, reviewNotes?: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);
    if (assessment.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Assessment must be UNDER_REVIEW to complete');
    }
    return this.prisma.assessment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndDate: new Date(),
        reviewNotes,
        reviewedAt: new Date(),
      },
    });
  }

  async cancelAssessment(id: string, reason?: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);
    if (assessment.status === 'COMPLETED' || assessment.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel a completed or already cancelled assessment');
    }
    return this.prisma.assessment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        reviewNotes: reason ? `Cancelled: ${reason}` : assessment.reviewNotes,
      },
    });
  }

  // Scope management
  async addControls(id: string, controlIds: string[]) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);

    const created = [];
    for (const controlId of controlIds) {
      const existing = await this.prisma.assessmentControl.findUnique({
        where: { assessmentId_controlId: { assessmentId: id, controlId } },
      });
      if (!existing) {
        created.push(
          await this.prisma.assessmentControl.create({
            data: { assessmentId: id, controlId },
          }),
        );
      }
    }
    return created;
  }

  async removeControl(id: string, controlId: string) {
    const control = await this.prisma.assessmentControl.findUnique({
      where: { assessmentId_controlId: { assessmentId: id, controlId } },
    });
    if (!control) throw new NotFoundException('Control not found in this assessment');

    // ControlLayer/LayerTest removed in community edition — just delete the AssessmentControl record
    await this.prisma.assessmentControl.delete({
      where: { assessmentId_controlId: { assessmentId: id, controlId } },
    });

    await this.recalculateStats(id);
  }

  async addScopeItems(id: string, scopeItemIds: string[]) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);

    const created = [];
    for (const scopeItemId of scopeItemIds) {
      const existing = await this.prisma.assessmentScope.findUnique({
        where: { assessmentId_scopeItemId: { assessmentId: id, scopeItemId } },
      });
      if (!existing) {
        created.push(
          await this.prisma.assessmentScope.create({
            data: { assessmentId: id, scopeItemId },
          }),
        );
      }
    }
    return created;
  }

  async removeScopeItem(id: string, scopeItemId: string) {
    const scope = await this.prisma.assessmentScope.findUnique({
      where: { assessmentId_scopeItemId: { assessmentId: id, scopeItemId } },
    });
    if (!scope) throw new NotFoundException('Scope item not found in this assessment');

    // Delete assessment tests scoped to this item
    await this.prisma.assessmentTest.deleteMany({
      where: { assessmentId: id, scopeItemId },
    });

    await this.prisma.assessmentScope.delete({
      where: { assessmentId_scopeItemId: { assessmentId: id, scopeItemId } },
    });

    await this.recalculateStats(id);
  }

  /**
   * THE CORE ALGORITHM: Populate assessment tests from templates
   *
   * For each control in assessment.controls:
   *   For each ControlLayer of that control:
   *     For each ControlActivity of that layer:
   *       For each LayerTest (template) of that activity:
   *         IF activity.scopeType IS NULL (org-wide):
   *           → Create 1 AssessmentTest (no scopeItem)
   *         ELSE (e.g., scopeType = APPLICATION):
   *           → For each ScopeItem in assessment.scopeItems
   *               WHERE scopeItem.scopeType == activity.scopeType:
   *             → Create 1 AssessmentTest with that scopeItem
   *     For each LayerTest NOT attached to any activity:
   *       → Create 1 AssessmentTest (org-wide, backward compat)
   * Update assessment.totalTests
   */
  async populateTests(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        controls: true,
        scopeItems: { include: { scopeItem: true } },
      },
    });
    if (!assessment) throw new NotFoundException(`Assessment with ID ${id} not found`);

    // ControlLayer/LayerTest removed in community edition — no-op stub
    return 0;
  }

  private async upsertAssessmentTest(
    assessmentId: string,
    testCode: string,
    testName: string,
    scopeItemId: string | null,
  ) {
    const existing = await this.prisma.assessmentTest.findUnique({
      where: {
        assessmentId_testCode_scopeItemId: {
          assessmentId,
          testCode,
          scopeItemId: scopeItemId || '',
        },
      },
    });
    if (existing) return existing;

    return this.prisma.assessmentTest.create({
      data: {
        assessmentId,
        testCode,
        testName,
        scopeItemId,
      },
    });
  }

  async recalculateStats(assessmentId: string) {
    const tests = await this.prisma.assessmentTest.findMany({
      where: { assessmentId },
    });

    const totalTests = tests.length;
    const completedTests = tests.filter((t) => t.status === 'COMPLETED' || t.status === 'SKIPPED').length;
    const passedTests = tests.filter((t) => t.result === 'PASS').length;
    const failedTests = tests.filter((t) => t.result === 'FAIL').length;

    await this.prisma.assessment.update({
      where: { id: assessmentId },
      data: { totalTests, completedTests, passedTests, failedTests },
    });

    return { totalTests, completedTests, passedTests, failedTests };
  }
}
