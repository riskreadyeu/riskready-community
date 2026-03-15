import { BadRequestException, Body, Controller, Get, Post, Req, Res, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { PrismaService } from '../prisma/prisma.service';

const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const LOGIN_THROTTLE_LIMIT = process.env['NODE_ENV'] === 'production' ? 5 : 20;

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

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
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' },
      ],
    });
    return { results: users, count: users.length };
  }

  @Public()
  @Throttle({ default: { limit: LOGIN_THROTTLE_LIMIT, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      this.logger.debug('Login called');
      if (!this.authService) {
        this.logger.error('AuthService is undefined!');
        throw new Error('AuthService not initialized');
      }
      const parsed = LoginDto.safeParse(body);
      if (!parsed.success) {
        throw new BadRequestException('Invalid email or password');
      }
      const dto = parsed.data;
      const ip = req.ip;
      const userAgent = req.get('user-agent');

      const result = await this.authService.login(dto.email, dto.password, { ip, userAgent });
      this.authService.setAuthCookies(res, result);

      return { user: result.user };
    } catch (error) {
      this.logger.error('Login error', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshSessionId = this.authService.getRefreshSessionIdFromRequest(req);
    const result = await this.authService.refresh(refreshSessionId);
    this.authService.setAuthCookies(res, result);
    return { user: result.user };
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshSessionId = this.authService.getRefreshSessionIdFromRequest(req);
    await this.authService.logout(refreshSessionId);
    this.authService.clearAuthCookies(res);
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    return { user: req.user };
  }
}
