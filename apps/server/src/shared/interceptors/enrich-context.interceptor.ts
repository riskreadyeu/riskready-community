import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextData } from '../context/request-context';

@Injectable()
export class EnrichContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const ctx: RequestContextData | undefined = req._requestContext;

    if (ctx && req.user) {
      ctx.userId = req.user.id;
      ctx.userEmail = req.user.email;
    }

    // Also pick up organisationId from body for POST/PUT/PATCH
    if (ctx && !ctx.organisationId && req.body?.organisationId) {
      ctx.organisationId = req.body.organisationId;
    }

    return next.handle();
  }
}
