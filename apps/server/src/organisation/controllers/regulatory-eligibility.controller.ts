import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RegulatoryEligibilityService } from '../services/regulatory-eligibility.service';
import {
  CompleteSurveyDto,
  CreateRegulatoryEligibilitySurveyDto,
  CreateSurveyQuestionDto,
  CreateSurveyResponseDto,
  PropagateScopeDto,
  SeedSurveyQuestionsDto,
  UpdateRegulatoryEligibilitySurveyDto,
  UpdateSurveyQuestionDto,
} from '../dto/organisation-crud.dto';

@Controller('organisation/regulatory-eligibility')
export class RegulatoryEligibilityController {
  constructor(private readonly service: RegulatoryEligibilityService) {}

  // Surveys
  @Get('surveys')
  async findAllSurveys(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('surveyType') surveyType?: string,
    @Query('status') status?: string,
  ) {
    const where: Prisma.RegulatoryEligibilitySurveyWhereInput = {};
    if (surveyType) where.surveyType = surveyType;
    if (status) where.status = status;

    return this.service.findAllSurveys({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  @Get('surveys/:id')
  async findOneSurvey(@Param('id') id: string) {
    return this.service.findOneSurvey(id);
  }

  @Post('surveys')
  async createSurvey(@Body() data: CreateRegulatoryEligibilitySurveyDto) {
    return this.service.createSurvey(data);
  }

  @Put('surveys/:id')
  async updateSurvey(
    @Param('id') id: string,
    @Body() data: UpdateRegulatoryEligibilitySurveyDto,
  ) {
    return this.service.updateSurvey(id, data);
  }

  @Delete('surveys/:id')
  async deleteSurvey(@Param('id') id: string) {
    return this.service.deleteSurvey(id);
  }

  // Questions
  @Get('questions')
  async findAllQuestions(@Query('surveyType') surveyType?: string) {
    return this.service.findAllQuestions(surveyType);
  }

  @Get('questions/:surveyType')
  async getQuestionsBySurveyType(@Param('surveyType') surveyType: 'dora' | 'nis2') {
    return this.service.getQuestionsBySurveyType(surveyType);
  }

  @Post('questions')
  async createQuestion(@Body() data: CreateSurveyQuestionDto) {
    return this.service.createQuestion(data);
  }

  @Put('questions/:id')
  async updateQuestion(@Param('id') id: string, @Body() data: UpdateSurveyQuestionDto) {
    return this.service.updateQuestion(id, data);
  }

  // Responses
  @Post('surveys/:surveyId/responses')
  async saveResponse(
    @Param('surveyId') surveyId: string,
    @Body() data: CreateSurveyResponseDto,
  ) {
    return this.service.saveResponse(surveyId, data.questionId, data.answer, data.notes);
  }

  // Seed questions
  @Post('questions/seed')
  async seedQuestions(@Body() data: SeedSurveyQuestionsDto) {
    return this.service.seedQuestions(data.questions);
  }

  // Complete survey and propagate scope
  @Post('surveys/:id/complete')
  async completeSurvey(
    @Param('id') id: string,
    @Body() data: CompleteSurveyDto,
  ) {
    return this.service.completeSurveyAndPropagate(
      id,
      {
        isApplicable: data.isApplicable,
        applicabilityReason: data.applicabilityReason,
        entityClassification: data.entityClassification,
        regulatoryRegime: data.regulatoryRegime,
      },
      data.organisationId,
      data.propagateScope ?? false,
    );
  }

  // Get propagation preview
  @Get('propagation-preview')
  async getPropagationPreview() {
    return this.service.getPropagationPreview();
  }

  /**
   * Manually trigger regulatory scope propagation
   * Updates control and risk applicability based on current org regulatory profile
   */
  @Post('propagate-scope')
  async propagateScope(@Body() data: PropagateScopeDto) {
    return this.service.propagateCurrentScope(data.organisationId);
  }
}
