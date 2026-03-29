import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';

// Mock bcryptjs
jest.mock('bcryptjs');

// Mock single-organisation util
jest.mock('../../shared/utils/single-organisation.util', () => ({
  getSingleOrganisationId: jest.fn().mockResolvedValue('org-1'),
}));

function createMockPrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    refreshSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
    organisationProfile: {
      findMany: jest.fn().mockResolvedValue([{ id: 'org-1' }]),
    },
  };
}

function createMockJwtService() {
  return {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrisma>;
  let jwtService: ReturnType<typeof createMockJwtService>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    jwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@company.com',
      passwordHash: '$2a$12$hash',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      firstName: 'Test',
      lastName: 'User',
    };

    const ctx = { ip: '127.0.0.1', userAgent: 'test' };

    it('returns auth result with user, token, and session on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshSession.create.mockResolvedValue({});
      prisma.auditEvent.create.mockResolvedValue({});

      const result = await service.login('user@company.com', 'password', ctx);

      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('user@company.com');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshSessionId).toBeDefined();
    });

    it('throws UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('nobody@test.com', 'pass', ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.login('user@company.com', 'pass', ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('user@company.com', 'wrong', ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('increments failedLoginAttempts on wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('user@company.com', 'wrong', ctx)).rejects.toThrow();

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { failedLoginAttempts: 1 },
      });
    });

    it('locks account after 5 failed attempts', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 4,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('user@company.com', 'wrong', ctx)).rejects.toThrow();

      const updateCall = prisma.user.update.mock.calls[0][0];
      expect(updateCall.data.failedLoginAttempts).toBe(5);
      expect(updateCall.data.lockedUntil).toBeInstanceOf(Date);
    });

    it('throws when account is locked', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 1000 * 60 * 15), // 15 min from now
      });

      await expect(service.login('user@company.com', 'pass', ctx)).rejects.toThrow(
        'Account temporarily locked',
      );
    });

    it('resets failedLoginAttempts on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 3,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshSession.create.mockResolvedValue({});
      prisma.auditEvent.create.mockResolvedValue({});

      await service.login('user@company.com', 'pass', ctx);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    });

    it('assigns ADMIN role to hardcoded admin emails', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        email: 'admin@riskready.com',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshSession.create.mockResolvedValue({});
      prisma.auditEvent.create.mockResolvedValue({});

      const result = await service.login('admin@riskready.com', 'pass', ctx);

      expect(result.user.role).toBe('ADMIN');
    });

    it('assigns ADMIN role to admin@local.test', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        email: 'admin@local.test',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshSession.create.mockResolvedValue({});
      prisma.auditEvent.create.mockResolvedValue({});

      const result = await service.login('admin@local.test', 'pass', ctx);

      expect(result.user.role).toBe('ADMIN');
    });

    it('assigns USER role to non-admin emails', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshSession.create.mockResolvedValue({});
      prisma.auditEvent.create.mockResolvedValue({});

      const result = await service.login('user@company.com', 'pass', ctx);

      expect(result.user.role).toBe('USER');
    });

    it('creates a refresh session', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshSession.create.mockResolvedValue({});
      prisma.auditEvent.create.mockResolvedValue({});

      const result = await service.login('user@company.com', 'pass', ctx);

      expect(prisma.refreshSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            ip: '127.0.0.1',
            userAgent: 'test',
          }),
        }),
      );
      expect(result.refreshSessionId).toBeTruthy();
    });

    it('creates an audit event', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshSession.create.mockResolvedValue({});
      prisma.auditEvent.create.mockResolvedValue({});

      await service.login('user@company.com', 'pass', ctx);

      expect(prisma.auditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorUserId: 'user-1',
            action: 'auth.login',
          }),
        }),
      );
    });
  });

  describe('logout', () => {
    it('revokes the refresh session', async () => {
      prisma.refreshSession.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('session-id');

      expect(prisma.refreshSession.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-id', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('does nothing when no session id provided', async () => {
      await service.logout(undefined);

      expect(prisma.refreshSession.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('throws when no session id provided', async () => {
      await expect(service.refresh(undefined)).rejects.toThrow(UnauthorizedException);
    });

    it('throws when session is revoked', async () => {
      prisma.refreshSession.findUnique.mockResolvedValue({
        id: 's-1',
        userId: 'u-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(service.refresh('s-1')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when session is expired', async () => {
      prisma.refreshSession.findUnique.mockResolvedValue({
        id: 's-1',
        userId: 'u-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 100000),
      });

      await expect(service.refresh('s-1')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates the refresh session on valid refresh', async () => {
      prisma.refreshSession.findUnique.mockResolvedValue({
        id: 's-1',
        userId: 'u-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100000),
        ip: '1.2.3.4',
        userAgent: 'ua',
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'user@test.com',
        isActive: true,
        firstName: null,
        lastName: null,
      });
      prisma.refreshSession.update.mockResolvedValue({});
      prisma.refreshSession.create.mockResolvedValue({});

      const result = await service.refresh('s-1');

      // Old session should be revoked
      expect(prisma.refreshSession.update).toHaveBeenCalledWith({
        where: { id: 's-1' },
        data: { revokedAt: expect.any(Date) },
      });
      // New session should be created
      expect(prisma.refreshSession.create).toHaveBeenCalled();
      // Result should have a new session id (different from old)
      expect(result.refreshSessionId).not.toBe('s-1');
      expect(result.accessToken).toBe('mock-jwt-token');
    });
  });
});
