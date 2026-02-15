import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SanitizePipe } from './shared/pipes/sanitize.pipe';
import { GlobalExceptionFilter } from './shared/filters/http-exception.filter';
import { EnrichContextInterceptor } from './shared/interceptors/enrich-context.interceptor';

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
  app.useGlobalInterceptors(new EnrichContextInterceptor());

  // CORS configuration
  // In development, allow all origins for Tailscale/remote access
  // In production, set CORS_ORIGIN env var with comma-separated allowed origins
  const isDevelopment = process.env['NODE_ENV'] !== 'production';
  const allowedOrigins = process.env['CORS_ORIGIN'] ? process.env['CORS_ORIGIN'].split(',') : [];
  
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      // In development, allow all origins (Tailscale, localhost, 127.0.0.1, etc.)
      if (isDevelopment) return callback(null, true);
      // In production, check against allowed list
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
