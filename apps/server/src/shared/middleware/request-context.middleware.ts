import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import {
  requestContextStorage,
  RequestContextData,
} from '../context/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const ctx: RequestContextData = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: (req.headers['x-request-id'] as string) || randomUUID(),
      organisationId: (req.query['organisationId'] as string) || undefined,
    };

    // Store reference on request so guards/interceptors can enrich it later
    (req as any)._requestContext = ctx;

    requestContextStorage.run(ctx, () => next());
  }
}
