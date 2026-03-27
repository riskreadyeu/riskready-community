import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { getSingleOrganisationId } from '../shared/utils/single-organisation.util';

type LoginContext = {
  ip?: string;
  userAgent?: string;
};

type AuthResult = {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'ADMIN' | 'USER';
    organisationId?: string;
  };
  accessToken: string;
  refreshSessionId: string;
};

function resolveUserRole(email: string): 'ADMIN' | 'USER' {
  const configuredAdmins = (process.env['ADMIN_EMAILS'] ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const adminEmails = new Set([
    'admin@riskready.com',
    'admin@local.test',
    'ciso@clearstream.ie',
    process.env['ADMIN_EMAIL']?.trim().toLowerCase(),
    ...configuredAdmins,
  ].filter((value): value is string => Boolean(value)));

  return adminEmails.has(email.trim().toLowerCase()) ? 'ADMIN' : 'USER';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async login(email: string, password: string, ctx: LoginContext): Promise<AuthResult> {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

      // Check account lockout
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new UnauthorizedException('Account temporarily locked. Try again later.');
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        // Increment failed login attempts and lock account if threshold reached
        const attempts = user.failedLoginAttempts + 1;
        const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = { failedLoginAttempts: attempts };
        if (attempts >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
        await this.prisma.user.update({ where: { id: user.id }, data: updateData });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Reset failed login attempts on successful login
      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });
      }

      const refreshSessionId = randomUUID();
      const ttlDays = Number(process.env['REFRESH_SESSION_TTL_DAYS'] ?? 14);
      const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

      await this.prisma.refreshSession.create({
        data: {
          id: refreshSessionId,
          userId: user.id,
          expiresAt,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        },
      });

      const organisationId = await getSingleOrganisationId(this.prisma, { allowMissing: true });
      const role = resolveUserRole(user.email);
      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role,
        organisationId,
      });

      // Create audit event (non-blocking)
      try {
        await this.prisma.auditEvent.create({
          data: {
            actorUserId: user.id,
            action: 'auth.login',
            entityType: 'User',
            entityId: user.id,
            data: { ip: ctx.ip, userAgent: ctx.userAgent },
          },
        });
      } catch (auditError) {
        this.logger.error('Error creating login audit event', auditError instanceof Error ? auditError.stack : String(auditError));
        // Continue even if audit event creation fails
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          role,
          organisationId,
        },
        accessToken,
        refreshSessionId,
      };
    } catch (error) {
      this.logger.error('Login error', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async refresh(refreshSessionId: string | undefined): Promise<AuthResult> {
    if (!refreshSessionId) throw new UnauthorizedException('No refresh session');

    const session = await this.prisma.refreshSession.findUnique({ where: { id: refreshSessionId } });
    if (!session || session.revokedAt) throw new UnauthorizedException('Invalid refresh session');
    if (session.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Expired refresh session');

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid user');

    // Revoke the old session to prevent refresh-token reuse attacks
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Create a new session with a fresh refresh token
    const newRefreshSessionId = randomUUID();
    const ttlDays = Number(process.env['REFRESH_SESSION_TTL_DAYS'] ?? 14);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshSession.create({
      data: {
        id: newRefreshSessionId,
        userId: user.id,
        expiresAt,
        ip: session.ip,
        userAgent: session.userAgent,
      },
    });

    const organisationId = await getSingleOrganisationId(this.prisma, { allowMissing: true });
    const role = resolveUserRole(user.email);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role,
      organisationId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
          role,
          organisationId,
        },
      accessToken,
      refreshSessionId: newRefreshSessionId,
    };
  }

  async logout(refreshSessionId: string | undefined) {
    if (!refreshSessionId) return;

    await this.prisma.refreshSession.updateMany({
      where: { id: refreshSessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  getRefreshSessionIdFromRequest(req: Request): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.['refresh_session'];
  }

  setAuthCookies(res: Response, result: AuthResult) {
    try {
      const cookieDomain = process.env['COOKIE_DOMAIN'];
      const isProduction = process.env['NODE_ENV'] === 'production';

      const cookieOptions: { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string; domain?: string } = {
        httpOnly: true,
        secure: process.env['COOKIE_SECURE'] === 'true' || (isProduction && process.env['COOKIE_SECURE'] !== 'false'),
        sameSite: 'lax',
        path: '/',
      };

      // Only set domain if it's provided and not empty
      if (cookieDomain && cookieDomain.trim() !== '') {
        cookieOptions.domain = cookieDomain;
      }

      res.cookie('access_token', result.accessToken, {
        ...cookieOptions,
        maxAge: Number(process.env['ACCESS_TOKEN_TTL_SECONDS'] ?? 900) * 1000,
      });

      res.cookie('refresh_session', result.refreshSessionId, {
        ...cookieOptions,
        maxAge: Number(process.env['REFRESH_SESSION_TTL_DAYS'] ?? 14) * 24 * 60 * 60 * 1000,
      });
    } catch (error) {
      this.logger.error('Error setting auth cookies', error instanceof Error ? error.stack : String(error));
      // Don't throw - cookies are optional, login should still succeed
    }
  }

  clearAuthCookies(res: Response) {
    const cookieDomain = process.env['COOKIE_DOMAIN'];

    res.clearCookie('access_token', { path: '/', domain: cookieDomain });
    res.clearCookie('refresh_session', { path: '/', domain: cookieDomain });
  }

  async ensureBootstrapAdmin() {
    try {
      const email = process.env['ADMIN_EMAIL'];
      const password = process.env['ADMIN_PASSWORD'];

      if (!email || !password) return;

      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) return;

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          isActive: true,
        },
      });

      // Create audit event (non-blocking - don't fail if this fails)
      try {
        await this.prisma.auditEvent.create({
          data: {
            actorUserId: user.id,
            action: 'auth.bootstrap_admin',
            entityType: 'User',
            entityId: user.id,
            data: { email },
          },
        });
      } catch (auditError) {
        this.logger.error('Error creating bootstrap admin audit event', auditError instanceof Error ? auditError.stack : String(auditError));
        // Continue even if audit event creation fails
      }
    } catch (error) {
      this.logger.error('Error in ensureBootstrapAdmin', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
