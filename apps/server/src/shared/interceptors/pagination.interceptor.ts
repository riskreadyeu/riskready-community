import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

const MAX_TAKE = 500;
const MAX_SKIP = 1_000_000;

/**
 * Clamps skip/take query parameters to safe ranges across all controllers.
 * Prevents DoS via absurdly large pagination values.
 */
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    if (req.query) {
      if (req.query.skip !== undefined) {
        const val = parseInt(req.query.skip, 10);
        req.query.skip = String(Math.max(0, Math.min(isNaN(val) ? 0 : val, MAX_SKIP)));
      }
      if (req.query.take !== undefined) {
        const val = parseInt(req.query.take, 10);
        req.query.take = String(Math.max(1, Math.min(isNaN(val) ? 20 : val, MAX_TAKE)));
      }
      if (req.query.limit !== undefined) {
        const val = parseInt(req.query.limit, 10);
        req.query.limit = String(Math.max(1, Math.min(isNaN(val) ? 20 : val, MAX_TAKE)));
      }
    }
    return next.handle();
  }
}
