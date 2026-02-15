import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { NonconformityService } from '../services/nonconformity.service';
import { CreateNonconformityDto, UpdateNonconformityDto } from '../dto/nonconformity.dto';
import { NonconformitySource, NCSeverity, NCCategory, NCStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('nonconformities')
export class NonconformityController {
  constructor(
    private readonly service: NonconformityService,
    private readonly prisma: PrismaService,
  ) {}

  // Simple users endpoint for the responsible person dropdown
  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    return users;
  }

  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('source') source?: NonconformitySource,
    @Query('severity') severity?: NCSeverity,
    @Query('status') status?: NCStatus,
    @Query('responsibleUserId') responsibleUserId?: string,
    @Query('controlId') controlId?: string,
  ) {
    return this.service.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      source,
      severity,
      status,
      responsibleUserId,
      controlId,
    });
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Body() data: CreateNonconformityDto,
  ) {
    return this.service.create({
      ...data,
      targetClosureDate: data.targetClosureDate ? new Date(data.targetClosureDate) : undefined,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateNonconformityDto,
  ) {
    return this.service.update(id, {
      ...data,
      targetClosureDate: data.targetClosureDate ? new Date(data.targetClosureDate) : undefined,
      verificationDate: data.verificationDate ? new Date(data.verificationDate) : undefined,
    });
  }

  @Put(':id/close')
  async close(@Param('id') id: string, @Body() data: { closedById: string }) {
    return this.service.close(id, data.closedById);
  }

  @Put(':id/link-risks')
  async linkRisks(@Param('id') id: string, @Body() data: { riskIds: string[] }) {
    return this.service.linkRisks(id, data.riskIds);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  // ============================================
  // CAP WORKFLOW ENDPOINTS
  // ============================================

  /**
   * Save/Update CAP as draft
   * POST /nonconformities/:id/cap/draft
   */
  @Post(':id/cap/draft')
  async saveCapDraft(
    @Param('id') id: string,
    @Body()
    data: {
      correctiveAction: string;
      rootCause?: string;
      responsibleUserId: string;
      targetClosureDate: string;
      draftedById: string;
    },
  ) {
    return this.service.saveCapDraft(
      id,
      {
        correctiveAction: data.correctiveAction,
        rootCause: data.rootCause,
        responsibleUserId: data.responsibleUserId,
        targetClosureDate: new Date(data.targetClosureDate),
      },
      data.draftedById,
    );
  }

  /**
   * Submit CAP for approval
   * POST /nonconformities/:id/cap/submit
   */
  @Post(':id/cap/submit')
  async submitCapForApproval(
    @Param('id') id: string,
    @Body() data: { submittedById: string },
  ) {
    return this.service.submitCapForApproval(id, data.submittedById);
  }

  /**
   * Approve CAP
   * POST /nonconformities/:id/cap/approve
   */
  @Post(':id/cap/approve')
  async approveCap(
    @Param('id') id: string,
    @Body() data: { approvedById: string; approvalComments?: string },
  ) {
    return this.service.approveCap(id, data.approvedById, data.approvalComments);
  }

  /**
   * Reject CAP
   * POST /nonconformities/:id/cap/reject
   */
  @Post(':id/cap/reject')
  async rejectCap(
    @Param('id') id: string,
    @Body() data: { rejectedById: string; rejectionReason: string },
  ) {
    return this.service.rejectCap(id, data.rejectedById, data.rejectionReason);
  }

  /**
   * Mark CAP as not required (for Observations)
   * POST /nonconformities/:id/cap/skip
   */
  @Post(':id/cap/skip')
  async markCapNotRequired(
    @Param('id') id: string,
    @Body() data: { userId: string },
  ) {
    return this.service.markCapNotRequired(id, data.userId);
  }
}
