import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { NonconformityService } from '../services/nonconformity.service';
import {
  CreateNonconformityDto,
  UpdateNonconformityDto,
  LinkNonconformityRisksDto,
  SaveCapDraftDto,
  ApproveCapDto,
  RejectCapDto,
} from '../dto/nonconformity.dto';
import { NonconformitySource, NCSeverity, NCStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedRequest } from '../../shared/types';

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
    @Request() req: AuthenticatedRequest,
    @Body() data: CreateNonconformityDto,
  ) {
    return this.service.create({
      ...data,
      targetClosureDate: data.targetClosureDate ? new Date(data.targetClosureDate) : undefined,
      raisedById: req.user.id,
    });
  }

  @Put(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdateNonconformityDto,
  ) {
    const isVerificationUpdate = Boolean(
      data.verificationMethod ||
      data.verificationDate ||
      data.verificationResult ||
      data.verificationNotes,
    );

    return this.service.update(id, {
      ...data,
      targetClosureDate: data.targetClosureDate ? new Date(data.targetClosureDate) : undefined,
      verificationDate: data.verificationDate ? new Date(data.verificationDate) : undefined,
      verifiedById: isVerificationUpdate ? req.user.id : undefined,
    });
  }

  @Put(':id/close')
  async close(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.close(id, req.user.id);
  }

  @Put(':id/link-risks')
  async linkRisks(@Param('id') id: string, @Body() data: LinkNonconformityRisksDto) {
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
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: SaveCapDraftDto,
  ) {
    return this.service.saveCapDraft(
      id,
      {
        correctiveAction: data.correctiveAction,
        rootCause: data.rootCause,
        responsibleUserId: data.responsibleUserId,
        targetClosureDate: new Date(data.targetClosureDate),
      },
      req.user.id,
    );
  }

  /**
   * Submit CAP for approval
   * POST /nonconformities/:id/cap/submit
   */
  @Post(':id/cap/submit')
  async submitCapForApproval(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.submitCapForApproval(id, req.user.id);
  }

  /**
   * Approve CAP
   * POST /nonconformities/:id/cap/approve
   */
  @Post(':id/cap/approve')
  async approveCap(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: ApproveCapDto,
  ) {
    return this.service.approveCap(id, req.user.id, data.approvalComments);
  }

  /**
   * Reject CAP
   * POST /nonconformities/:id/cap/reject
   */
  @Post(':id/cap/reject')
  async rejectCap(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: RejectCapDto,
  ) {
    return this.service.rejectCap(id, req.user.id, data.rejectionReason);
  }

  /**
   * Mark CAP as not required (for Observations)
   * POST /nonconformities/:id/cap/skip
   */
  @Post(':id/cap/skip')
  async markCapNotRequired(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.service.markCapNotRequired(id, req.user.id);
  }
}
