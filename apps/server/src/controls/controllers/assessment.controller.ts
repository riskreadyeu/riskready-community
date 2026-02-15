import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { AssessmentService } from '../services/assessment.service';
import { AssessmentTestService } from '../services/assessment-test.service';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  CompleteAssessmentDto,
  CancelAssessmentDto,
  AddControlsDto,
  AddScopeItemsDto,
  ExecuteAssessmentTestDto,
  AssignTesterDto,
  UpdateRootCauseDto,
  SkipTestDto,
  UpdateAssessmentTestDto,
  BulkAssignDto,
} from '../dto/assessment.dto';

@Controller()
export class AssessmentController {
  constructor(
    private assessmentService: AssessmentService,
    private assessmentTestService: AssessmentTestService,
  ) {}

  // ============================================
  // Assessment CRUD + Lifecycle
  // ============================================

  @Get('assessments')
  findAll(@Query('organisationId') organisationId: string, @Query('status') status?: string) {
    return this.assessmentService.findAll(organisationId, {
      status: status as any,
    });
  }

  @Post('assessments')
  create(@Body() dto: CreateAssessmentDto, @Request() req: any) {
    const organisationId = req.query?.organisationId || req.body?.organisationId;
    return this.assessmentService.create(
      {
        organisationId,
        title: dto.title,
        description: dto.description,
        assessmentRef: dto.assessmentRef,
        leadTesterId: dto.leadTesterId,
        reviewerId: dto.reviewerId,
        plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
        plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
        controlIds: dto.controlIds,
        scopeItemIds: dto.scopeItemIds,
      },
      req.user?.id,
    );
  }

  @Get('assessments/:id')
  findOne(@Param('id') id: string) {
    return this.assessmentService.findOne(id);
  }

  @Patch('assessments/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentService.update(id, {
      title: dto.title,
      description: dto.description,
      leadTesterId: dto.leadTesterId,
      reviewerId: dto.reviewerId,
      plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
      plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
      periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
    });
  }

  @Delete('assessments/:id')
  delete(@Param('id') id: string) {
    return this.assessmentService.delete(id);
  }

  // Lifecycle
  @Post('assessments/:id/start')
  start(@Param('id') id: string) {
    return this.assessmentService.startAssessment(id);
  }

  @Post('assessments/:id/submit-review')
  submitReview(@Param('id') id: string) {
    return this.assessmentService.submitForReview(id);
  }

  @Post('assessments/:id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteAssessmentDto) {
    return this.assessmentService.completeAssessment(id, dto.reviewNotes);
  }

  @Post('assessments/:id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelAssessmentDto) {
    return this.assessmentService.cancelAssessment(id, dto.reason);
  }

  // ============================================
  // Scope Management
  // ============================================

  @Post('assessments/:id/controls')
  addControls(@Param('id') id: string, @Body() dto: AddControlsDto) {
    return this.assessmentService.addControls(id, dto.controlIds);
  }

  @Delete('assessments/:id/controls/:controlId')
  removeControl(@Param('id') id: string, @Param('controlId') controlId: string) {
    return this.assessmentService.removeControl(id, controlId);
  }

  @Post('assessments/:id/scope-items')
  addScopeItems(@Param('id') id: string, @Body() dto: AddScopeItemsDto) {
    return this.assessmentService.addScopeItems(id, dto.scopeItemIds);
  }

  @Delete('assessments/:id/scope-items/:scopeItemId')
  removeScopeItem(@Param('id') id: string, @Param('scopeItemId') scopeItemId: string) {
    return this.assessmentService.removeScopeItem(id, scopeItemId);
  }

  // ============================================
  // Test Population
  // ============================================

  @Post('assessments/:id/populate')
  populateTests(@Param('id') id: string) {
    return this.assessmentService.populateTests(id);
  }

  // ============================================
  // My Tests (must come before :testId routes)
  // ============================================

  @Get('my-tests')
  getMyTests(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('testMethod') testMethod?: string,
    @Query('role') role?: 'owner' | 'tester' | 'assessor',
  ) {
    return this.assessmentTestService.getMyTests(req.user?.id, { status, testMethod, role });
  }

  @Get('my-tests/count')
  getMyTestsCount(@Request() req: any) {
    return this.assessmentTestService.getMyTestsCount(req.user?.id);
  }

  // ============================================
  // Assessment Tests — Bulk Operations
  // ============================================

  @Patch('assessment-tests/bulk-assign')
  bulkAssign(@Body() dto: BulkAssignDto) {
    return this.assessmentTestService.bulkAssign(dto.testIds, dto);
  }

  // ============================================
  // Assessment Tests
  // ============================================

  @Get('assessments/:id/tests')
  findTests(@Param('id') id: string, @Query('status') status?: string) {
    return this.assessmentTestService.findByAssessment(id, { status });
  }

  @Get('assessment-tests/:testId')
  findTest(@Param('testId') testId: string) {
    return this.assessmentTestService.findOne(testId);
  }

  @Post('assessment-tests/:testId/execute')
  executeTest(
    @Param('testId') testId: string,
    @Body() dto: ExecuteAssessmentTestDto,
    @Request() req: any,
  ) {
    return this.assessmentTestService.executeTest(
      testId,
      {
        result: dto.result,
        findings: dto.findings,
        recommendations: dto.recommendations,
        evidenceLocation: dto.evidenceLocation,
        evidenceNotes: dto.evidenceNotes,
        evidenceFileIds: dto.evidenceFileIds,
        durationMinutes: dto.durationMinutes,
        samplesReviewed: dto.samplesReviewed,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
      },
      req.user?.id,
    );
  }

  @Patch('assessment-tests/:testId')
  updateTest(@Param('testId') testId: string, @Body() dto: UpdateAssessmentTestDto) {
    return this.assessmentTestService.updateTest(testId, dto);
  }

  @Patch('assessment-tests/:testId/assign')
  assignTester(@Param('testId') testId: string, @Body() dto: AssignTesterDto) {
    return this.assessmentTestService.assignTester(testId, dto.testerId);
  }

  @Patch('assessment-tests/:testId/root-cause')
  updateRootCause(@Param('testId') testId: string, @Body() dto: UpdateRootCauseDto) {
    return this.assessmentTestService.updateRootCause(testId, dto);
  }

  @Post('assessment-tests/:testId/skip')
  skipTest(@Param('testId') testId: string, @Body() dto: SkipTestDto) {
    return this.assessmentTestService.skipTest(testId, dto.justification);
  }

  @Get('assessment-tests/:testId/executions')
  getExecutions(@Param('testId') testId: string) {
    return this.assessmentTestService.getExecutions(testId);
  }
}
