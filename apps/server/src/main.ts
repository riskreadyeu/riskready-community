import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SanitizePipe } from './shared/pipes/sanitize.pipe';
import { GlobalExceptionFilter } from './shared/filters/http-exception.filter';
import { EnrichContextInterceptor } from './shared/interceptors/enrich-context.interceptor';
import { PaginationInterceptor } from './shared/interceptors/pagination.interceptor';
import { CsrfMiddleware } from './shared/middleware/csrf.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(cookieParser());

  // CSRF protection (double-submit cookie pattern)
  const csrf = new CsrfMiddleware();
  app.use(csrf.use.bind(csrf));

  // Trust first proxy hop (Caddy/nginx) for correct req.ip
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new EnrichContextInterceptor(), new PaginationInterceptor());

  // CORS configuration
  // When CORS_ORIGIN is set, only those origins are allowed.
  // When CORS_ORIGIN is not set, CORS is disabled (origin: false).
  // Single-origin Caddy deployments don't need CORS since all requests
  // are same-origin through the reverse proxy.
  const corsOriginEnv = process.env['CORS_ORIGIN']?.trim();
  const allowedOrigins = corsOriginEnv ? corsOriginEnv.split(',').map(o => o.trim()) : [];

  app.enableCors({
    origin: allowedOrigins.length === 0
      ? false
      : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // Allow requests with no origin (like mobile apps or curl)
          if (!origin) return callback(null, true);
          // Check against allowed list
          if (allowedOrigins.includes(origin)) return callback(null, true);
          // Reject disallowed origins without throwing (avoids 500 errors)
          return callback(null, false);
        },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-TOKEN'],
  });


  const port = Number(process.env['PORT'] ?? 4000);
  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`Server listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start server', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
