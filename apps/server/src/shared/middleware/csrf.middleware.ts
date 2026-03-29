import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

/**
 * Double-submit cookie CSRF protection.
 *
 * - GET/HEAD/OPTIONS: set a non-httpOnly XSRF-TOKEN cookie so the frontend can read it.
 * - POST/PUT/PATCH/DELETE: verify that the X-XSRF-TOKEN header matches the XSRF-TOKEN cookie.
 *
 * Routes that use API key auth (e.g. /api/gateway-config/mcp-keys/validate)
 * are excluded because they don't use cookie-based sessions.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Route prefixes that skip CSRF (API-key authenticated, no cookies). */
const CSRF_SKIP_PREFIXES = [
  '/api/gateway-config/mcp-keys/validate',
  '/api/health',
];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Skip CSRF for excluded routes
    const path = req.originalUrl?.split('?')[0] ?? req.path;
    if (CSRF_SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return next();
    }

    if (SAFE_METHODS.has(req.method)) {
      // Issue a new CSRF token on safe requests if one isn't already set
      if (!req.cookies?.['XSRF-TOKEN']) {
        const token = randomBytes(32).toString('hex');
        res.cookie('XSRF-TOKEN', token, {
          httpOnly: false, // Frontend must read this
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'lax',
          path: '/',
        });
      }
      return next();
    }

    // State-changing request: validate CSRF token
    const cookieToken = req.cookies?.['XSRF-TOKEN'];
    const headerToken = req.headers['x-xsrf-token'];

    if (
      !cookieToken ||
      !headerToken ||
      typeof headerToken !== 'string' ||
      cookieToken !== headerToken
    ) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return next();
  }
}
