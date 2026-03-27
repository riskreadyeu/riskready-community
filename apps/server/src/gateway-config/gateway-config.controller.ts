import { Controller, Get, Put, Body, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly, AdminOnlyGuard } from '../shared/guards/admin-only.guard';
import { GatewayConfigService } from './gateway-config.service';
import { UpdateGatewayConfigDto } from './gateway-config.dto';
import { AuthenticatedRequest } from '../shared/types';
import { PrismaService } from '../prisma/prisma.service';
import { resolveSingleOrganisationId } from '../shared/utils/single-organisation.util';

@Controller('gateway-config')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@AdminOnly()
export class GatewayConfigController {
  constructor(
    private readonly service: GatewayConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getConfig(@Query('organisationId') organisationId?: string) {
    const resolvedOrganisationId = await resolveSingleOrganisationId(this.prisma, organisationId);
    return this.service.getConfig(resolvedOrganisationId!);
  }

  @Get('usage')
  async getUsage(@Query('organisationId') organisationId?: string) {
    const resolvedOrganisationId = await resolveSingleOrganisationId(this.prisma, organisationId);
    return this.service.getUsage(resolvedOrganisationId!);
  }

  @Put()
  async updateConfig(
    @Query('organisationId') organisationId: string | undefined,
    @Body() dto: UpdateGatewayConfigDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const resolvedOrganisationId = await resolveSingleOrganisationId(this.prisma, organisationId);
    return this.service.upsertConfig(resolvedOrganisationId!, dto, req.user?.id);
  }
}
