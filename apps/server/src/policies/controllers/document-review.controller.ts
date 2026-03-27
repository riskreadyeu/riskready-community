import { Controller, Get, Post, Put, Param, Query, Body, Request } from '@nestjs/common';
import { DocumentReviewService } from '../services/document-review.service';
import {
  CreateDocumentReviewDto,
  RescheduleDocumentReviewDto,
} from '../dto/workflow.dto';
import { AuthenticatedRequest } from '../../shared/types';

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
    @Request() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
    @Body() data: CreateDocumentReviewDto,
  ) {
    return this.service.createReview({ documentId, ...data, reviewedById: req.user.id });
  }

  @Put(':documentId/reschedule-review')
  async rescheduleReview(
    @Request() req: AuthenticatedRequest,
    @Param('documentId') documentId: string,
    @Body() data: RescheduleDocumentReviewDto,
  ) {
    return this.service.rescheduleReview(documentId, new Date(data.nextReviewDate), req.user.id);
  }
}
