import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOnly, AdminOnlyGuard } from '../shared/guards/admin-only.guard';
import { McpKeyService } from './mcp-key.service';
import { CreateMcpKeyDto } from './mcp-key.dto';
import { AuthenticatedRequest } from '../shared/types';
import { PrismaService } from '../prisma/prisma.service';
import { resolveSingleOrganisationId } from '../shared/utils/single-organisation.util';

@Controller('gateway-config/mcp-keys')
export class McpKeyController {
  constructor(
    private readonly service: McpKeyService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @AdminOnly()
  async createKey(
    @Body() dto: CreateMcpKeyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const organisationId = await resolveSingleOrganisationId(
      this.prisma,
      undefined,
    );
    return this.service.createKey(req.user.id, organisationId!, dto.name);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @AdminOnly()
  async listKeys(@Request() req: AuthenticatedRequest) {
    const organisationId = await resolveSingleOrganisationId(
      this.prisma,
      undefined,
    );
    return this.service.listKeys(req.user.id, organisationId!);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminOnlyGuard)
  @AdminOnly()
  async revokeKey(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.service.revokeKey(id, req.user.id);
    return { success: true };
  }

  @Post('validate')
  async validateKey(
    @Body() body: { key: string },
    @Headers('x-gateway-secret') secret?: string,
  ) {
    const expectedSecret =
      process.env['GATEWAY_SECRET'] || process.env['JWT_SECRET'];
    if (!expectedSecret || !secret) {
      throw new UnauthorizedException();
    }

    // Timing-safe comparison to prevent timing attacks
    try {
      const secretBuf = Buffer.from(secret);
      const expectedBuf = Buffer.from(expectedSecret);
      if (
        secretBuf.length !== expectedBuf.length ||
        !timingSafeEqual(secretBuf, expectedBuf)
      ) {
        throw new UnauthorizedException();
      }
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException();
    }

    return this.service.validateKey(body.key);
  }
}
