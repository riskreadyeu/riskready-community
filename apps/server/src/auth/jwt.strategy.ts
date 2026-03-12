import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

function cookieExtractor(req: Request): string | null {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.['access_token'] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = process.env['JWT_SECRET'];
        if (!secret) {
          throw new Error('JWT_SECRET environment variable must be set');
        }
        return secret;
      })(),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role?: 'ADMIN' | 'USER';
    organisationId?: string;
  }) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? 'USER',
      organisationId: payload.organisationId,
    };
  }
}
