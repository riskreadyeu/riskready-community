import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  RegulatoryScopePropagationService,
  RegulatoryProfile,
  PropagationResult,
} from './regulatory-scope-propagation.service';

export interface CompleteSurveyResult {
  survey: any;
  propagation?: PropagationResult;
}

@Injectable()
export class RegulatoryEligibilityService {
  private readonly logger = new Logger(RegulatoryEligibilityService.name);

  constructor(
    private prisma: PrismaService,
    private propagationService: RegulatoryScopePropagationService,
  ) {}

  // Survey CRUD
  async findAllSurveys(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.RegulatoryEligibilitySurveyWhereInput;
  }) {
    const { skip, take, where } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.regulatoryEligibilitySurvey.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { responses: true } },
        },
      }),
      this.prisma.regulatoryEligibilitySurvey.count({ where }),
    ]);
    return { results, count };
  }

  async findOneSurvey(id: string) {
    return this.prisma.regulatoryEligibilitySurvey.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            question: true,
          },
          orderBy: { question: { sortOrder: 'asc' } },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async createSurvey(data: Prisma.RegulatoryEligibilitySurveyCreateInput) {
    return this.prisma.regulatoryEligibilitySurvey.create({ data });
  }

  async updateSurvey(id: string, data: Prisma.RegulatoryEligibilitySurveyUpdateInput) {
    return this.prisma.regulatoryEligibilitySurvey.update({ where: { id }, data });
  }

  async deleteSurvey(id: string) {
    return this.prisma.regulatoryEligibilitySurvey.delete({ where: { id } });
  }

  // Questions CRUD
  async findAllQuestions(surveyType?: string) {
    return this.prisma.surveyQuestion.findMany({
      where: surveyType ? { surveyType } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createQuestion(data: Prisma.SurveyQuestionCreateInput) {
    return this.prisma.surveyQuestion.create({ data });
  }

  async updateQuestion(id: string, data: Prisma.SurveyQuestionUpdateInput) {
    return this.prisma.surveyQuestion.update({ where: { id }, data });
  }

  // Responses
  async saveResponse(surveyId: string, questionId: string, answer: string, notes?: string) {
    return this.prisma.surveyResponse.upsert({
      where: { surveyId_questionId: { surveyId, questionId } },
      create: { surveyId, questionId, answer, notes },
      update: { answer, notes },
    });
  }

  async getQuestionsBySurveyType(surveyType: 'dora' | 'nis2') {
    return this.prisma.surveyQuestion.findMany({
      where: { surveyType },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Seed questions from workbook data
  async seedQuestions(questions: Array<{
    surveyType: string;
    stepNumber: string;
    stepCategory: string;
    questionText: string;
    ifYes?: string;
    ifNo?: string;
    legalReference?: string;
    notes?: string;
    sortOrder: number;
  }>) {
    return this.prisma.surveyQuestion.createMany({
      data: questions,
      skipDuplicates: true,
    });
  }

  /**
   * Complete a survey and optionally propagate regulatory scope to all entities
   */
  async completeSurveyAndPropagate(
    surveyId: string,
    result: {
      isApplicable?: boolean;
      applicabilityReason?: string;
      entityClassification?: string;
      regulatoryRegime?: string;
    },
    organisationId?: string,
    propagateScope: boolean = false,
  ): Promise<CompleteSurveyResult> {
    // Update survey with completion data
    const survey = await this.prisma.regulatoryEligibilitySurvey.update({
      where: { id: surveyId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        isApplicable: result.isApplicable,
        applicabilityReason: result.applicabilityReason,
        entityClassification: result.entityClassification,
        regulatoryRegime: result.regulatoryRegime,
      },
    });

    // If propagation is requested and we have an organisation
    let propagation: PropagationResult | undefined;

    if (propagateScope && organisationId) {
      // Build regulatory profile from survey result
      let profile: RegulatoryProfile;

      if (survey.surveyType === 'dora') {
        const doraProfile = this.propagationService.parseDoraResult(result);
        // Get existing NIS2 profile from organisation
        const org = await this.prisma.organisationProfile.findUnique({
          where: { id: organisationId },
          select: {
            isNis2Applicable: true,
            nis2EntityClassification: true,
            nis2Sector: true,
            nis2AnnexType: true,
          },
        });

        profile = {
          isDoraApplicable: doraProfile.isDoraApplicable ?? false,
          doraEntityType: doraProfile.doraEntityType,
          doraRegime: doraProfile.doraRegime,
          isNis2Applicable: org?.isNis2Applicable ?? false,
          nis2EntityClassification: org?.nis2EntityClassification ?? undefined,
          nis2Sector: org?.nis2Sector ?? undefined,
          nis2AnnexType: org?.nis2AnnexType ?? undefined,
        };

        // Update organisation with DORA assessment link
        await this.prisma.organisationProfile.update({
          where: { id: organisationId },
          data: { lastDoraAssessmentId: surveyId },
        });
      } else {
        // NIS2 survey
        const nis2Profile = this.propagationService.parseNis2Result(result);
        // Get existing DORA profile from organisation
        const org = await this.prisma.organisationProfile.findUnique({
          where: { id: organisationId },
          select: {
            isDoraApplicable: true,
            doraEntityType: true,
            doraRegime: true,
          },
        });

        profile = {
          isDoraApplicable: org?.isDoraApplicable ?? false,
          doraEntityType: org?.doraEntityType ?? undefined,
          doraRegime: org?.doraRegime ?? undefined,
          isNis2Applicable: nis2Profile.isNis2Applicable ?? false,
          nis2EntityClassification: nis2Profile.nis2EntityClassification,
          nis2Sector: nis2Profile.nis2Sector,
          nis2AnnexType: nis2Profile.nis2AnnexType,
        };

        // Update organisation with NIS2 assessment link
        await this.prisma.organisationProfile.update({
          where: { id: organisationId },
          data: { lastNis2AssessmentId: surveyId },
        });
      }

      // Propagate scope to all entities
      propagation = await this.propagationService.propagateRegulatoryScope(
        organisationId,
        profile,
      );

      this.logger.log(
        `Survey ${surveyId} completed with propagation: ${JSON.stringify(propagation)}`,
      );
    }

    return { survey, propagation };
  }

  /**
   * Get preview of what will be affected by propagation
   */
  async getPropagationPreview() {
    return this.propagationService.getPropagatioPreview();
  }

  /**
   * Manually propagate current regulatory scope to all entities
   * Reads the organisation's current regulatory profile and updates
   * control/risk applicability based on DORA/NIS2 scope
   */
  async propagateCurrentScope(organisationId?: string): Promise<PropagationResult> {
    // Get the organisation (use first if not specified)
    let org;
    if (organisationId) {
      org = await this.prisma.organisationProfile.findUnique({
        where: { id: organisationId },
      });
    } else {
      org = await this.prisma.organisationProfile.findFirst();
    }

    if (!org) {
      throw new Error('Organisation not found');
    }

    // Build regulatory profile from current org settings
    const profile: RegulatoryProfile = {
      isDoraApplicable: org.isDoraApplicable,
      doraEntityType: org.doraEntityType ?? undefined,
      doraRegime: org.doraRegime ?? undefined,
      isNis2Applicable: org.isNis2Applicable,
      nis2EntityClassification: org.nis2EntityClassification ?? undefined,
      nis2Sector: org.nis2Sector ?? undefined,
      nis2AnnexType: org.nis2AnnexType ?? undefined,
      primarySupervisoryAuthority: org.primarySupervisoryAuthority ?? undefined,
      supervisoryAuthorityCountry: org.supervisoryAuthorityCountry ?? undefined,
    };

    this.logger.log(
      `Propagating current scope for ${org.name}: DORA=${profile.isDoraApplicable}, NIS2=${profile.isNis2Applicable}`,
    );

    // Propagate scope to all entities
    const result = await this.propagationService.propagateRegulatoryScope(
      org.id,
      profile,
    );

    this.logger.log(
      `Propagation complete: ${result.controlsEnabled} controls enabled, ${result.controlsDisabled} controls disabled, ` +
      `${result.risksEnabled} risks enabled, ${result.risksDisabled} risks disabled`,
    );

    return result;
  }
}
