import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

type LoginContext = {
  ip?: string;
  userAgent?: string;
};

type AuthResult = {
  user: { id: string; email: string };
  accessToken: string;
  refreshSessionId: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async login(email: string, password: string, ctx: LoginContext): Promise<AuthResult> {
    try {
      // Ensure bootstrap admin exists (completely non-blocking - run in background)
      this.ensureBootstrapAdmin().catch((error) => {
        console.error('Error ensuring bootstrap admin (non-blocking):', error);
      });

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new UnauthorizedException('Invalid credentials');

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

      const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });

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
        console.error('Error creating login audit event:', auditError);
        // Continue even if audit event creation fails
      }

      return {
        user: { id: user.id, email: user.email },
        accessToken,
        refreshSessionId,
      };
    } catch (error) {
      console.error('Login error details:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        email,
      });
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

    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshSessionId: session.id,
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
    const cookies = (req as any).cookies as Record<string, string> | undefined;
    return cookies?.['refresh_session'];
  }

  setAuthCookies(res: Response, result: AuthResult) {
    try {
      const cookieDomain = process.env['COOKIE_DOMAIN'];
      const isProduction = process.env['NODE_ENV'] === 'production';

      const cookieOptions: any = {
        httpOnly: true,
        secure: process.env['COOKIE_SECURE'] === 'true' || (isProduction && process.env['COOKIE_SECURE'] !== 'false'),
        sameSite: 'lax' as const,
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
      console.error('Error setting auth cookies:', error);
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

      const count = await this.prisma.user.count();
      if (count > 0) return;

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
        console.error('Error creating bootstrap admin audit event:', auditError);
        // Continue even if audit event creation fails
      }
    } catch (error) {
      console.error('Error in ensureBootstrapAdmin:', error);
      throw error;
    }
  }
}
