import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { DocumentReviewService } from '../services/document-review.service';
import { ReviewType, ReviewOutcome } from '@prisma/client';

@Controller('policies')
export class DocumentReviewController {
  constructor(private readonly service: DocumentReviewService) {}

  @Get(':documentId/reviews')
  async findAll(@Param('documentId') documentId: string) {
    return this.service.findAll(documentId);
  }

  @Get('reviews/upcoming')
  async getUpcomingReviews(
    @Query('organisationId') organisationId: string,
    @Query('days') days?: string,
  ) {
    return this.service.getUpcomingReviews(organisationId, days ? parseInt(days) : 30);
  }

  @Get('reviews/overdue')
  async getOverdueReviews(@Query('organisationId') organisationId: string) {
    return this.service.getOverdueReviews(organisationId);
  }

  @Get('reviews/stats')
  async getReviewStats(@Query('organisationId') organisationId: string) {
    return this.service.getReviewStats(organisationId);
  }

  @Post(':documentId/reviews')
  async createReview(
    @Param('documentId') documentId: string,
    @Body() data: {
      reviewType: ReviewType;
      outcome: ReviewOutcome;
      findings?: string;
      recommendations?: string;
      actionItems?: string;
      changesRequired?: boolean;
      changeDescription?: string;
      reviewedById: string;
    },
  ) {
    return this.service.createReview({ documentId, ...data });
  }

  @Put(':documentId/reschedule-review')
  async rescheduleReview(
    @Param('documentId') documentId: string,
    @Body() data: { nextReviewDate: string; userId?: string },
  ) {
    return this.service.rescheduleReview(documentId, new Date(data.nextReviewDate), data.userId);
  }
}
