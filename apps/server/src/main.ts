import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SanitizePipe } from './shared/pipes/sanitize.pipe';
import { GlobalExceptionFilter } from './shared/filters/http-exception.filter';
import { EnrichContextInterceptor } from './shared/interceptors/enrich-context.interceptor';
import { PaginationInterceptor } from './shared/interceptors/pagination.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(cookieParser());

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API-only server
    crossOriginEmbedderPolicy: false,
  }));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new EnrichContextInterceptor(), new PaginationInterceptor());

  // CORS configuration
  // When CORS_ORIGIN is set, only those origins are allowed.
  // When CORS_ORIGIN is not set, all origins are allowed (suitable for
  // single-server Docker deployments accessed via localhost, IP, or hostname).
  const corsOriginEnv = process.env['CORS_ORIGIN']?.trim();
  const allowedOrigins = corsOriginEnv ? corsOriginEnv.split(',').map(o => o.trim()) : [];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      // If no CORS_ORIGIN configured, allow all origins
      if (allowedOrigins.length === 0) return callback(null, true);
      // Check against allowed list
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });


  const port = Number(process.env['PORT'] ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
