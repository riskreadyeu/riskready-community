# Deployment & Infrastructure

This document details the deployment architecture, environment configuration, and infrastructure setup for the RiskReady application.

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Configuration](#environment-configuration)
3. [Development Setup](#development-setup)
4. [Production Deployment](#production-deployment)
5. [Database Management](#database-management)
6. [Monitoring & Logging](#monitoring--logging)
7. [Security Considerations](#security-considerations)

---

## Deployment Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────┐                                │
│                              │   Users     │                                │
│                              └──────┬──────┘                                │
│                                     │                                        │
│                                     ▼                                        │
│                         ┌───────────────────────┐                           │
│                         │    CDN / DNS          │                           │
│                         │  (CloudFlare/Route53) │                           │
│                         └───────────┬───────────┘                           │
│                                     │                                        │
│                    ┌────────────────┴────────────────┐                      │
│                    │                                 │                      │
│                    ▼                                 ▼                      │
│         ┌─────────────────────┐         ┌─────────────────────┐            │
│         │   Static Hosting    │         │   Load Balancer     │            │
│         │   (Vercel/Netlify)  │         │   (nginx/ALB)       │            │
│         │                     │         │                     │            │
│         │   React Frontend    │         └──────────┬──────────┘            │
│         └─────────────────────┘                    │                        │
│                                     ┌──────────────┼──────────────┐        │
│                                     │              │              │        │
│                                     ▼              ▼              ▼        │
│                              ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│                              │ Server 1 │  │ Server 2 │  │ Server N │     │
│                              │ (NestJS) │  │ (NestJS) │  │ (NestJS) │     │
│                              └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│                                   │             │             │            │
│                                   └─────────────┼─────────────┘            │
│                                                 │                          │
│                                                 ▼                          │
│                                    ┌────────────────────────┐              │
│                                    │      PostgreSQL        │              │
│                                    │   (RDS/Cloud SQL)      │              │
│                                    └────────────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Deployment Options

| Component | Development | Production Options |
|-----------|-------------|-------------------|
| **Frontend** | Vite dev server | Vercel, Netlify, S3+CloudFront |
| **Backend** | Node.js local | EC2, ECS, Cloud Run, Railway |
| **Database** | Local PostgreSQL | RDS, Cloud SQL, Supabase |
| **File Storage** | Local filesystem | S3, Cloud Storage |

---

## Environment Configuration

### Environment Files

```
apps/server/
├── .env                 # Local development (git-ignored)
├── .env.example         # Template for environment variables
└── .env.production      # Production config (git-ignored)

apps/web/
├── .env                 # Local development (git-ignored)
├── .env.example         # Template
└── .env.production      # Production config (git-ignored)
```

### Server Environment Variables

```bash
# .env.example (apps/server)

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/riskready?schema=public"

# Authentication
JWT_SECRET="your-super-secret-key-min-32-characters"
JWT_EXPIRATION="24h"

# Server
PORT=3000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Optional: Logging
LOG_LEVEL="debug"

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

```bash
# .env.example (apps/web)

# API URL
VITE_API_URL="http://localhost:3000/api"

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS="false"
VITE_ENABLE_DEBUG="true"
```

### Environment-Specific Configuration

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
});
```

---

## Development Setup

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| PostgreSQL | 14+ | Database |
| Git | Latest | Version control |

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd riskready-community

# Install server dependencies
cd apps/server
npm install

# Install web dependencies
cd ../web
npm install
```

### Database Setup

```bash
cd apps/server

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

### Running Development Servers

```bash
# Terminal 1: Backend
cd apps/server
npm run dev
# Server runs on http://localhost:3000

# Terminal 2: Frontend
cd apps/web
npm run dev
# Frontend runs on http://localhost:5173
```

### Development Scripts

#### Server Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start dev server with hot reload |
| `build` | `npm run build` | Build for production |
| `start` | `npm run start` | Start production server |
| `prisma:generate` | `npm run prisma:generate` | Generate Prisma client |
| `prisma:migrate` | `npm run prisma:migrate` | Run migrations |
| `prisma:seed` | `npm run prisma:seed` | Seed database |
| `db:reset` | `npm run db:reset` | Reset and reseed database |

#### Web Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server |
| `build` | `npm run build` | Build for production |
| `preview` | `npm run preview` | Preview production build |

---

## Production Deployment

### Build Process

#### Backend Build

```bash
cd apps/server

# Install dependencies
npm ci

# Generate Prisma client
npm run prisma:generate

# Build TypeScript
npm run build

# Output in dist/ directory
```

#### Frontend Build

```bash
cd apps/web

# Install dependencies
npm ci

# Build for production
npm run build

# Output in dist/ directory
```

### Deployment Checklist

```markdown
## Pre-Deployment Checklist

### Environment
- [ ] All environment variables configured
- [ ] JWT_SECRET is strong and unique
- [ ] DATABASE_URL points to production database
- [ ] CORS_ORIGIN set to production domain

### Database
- [ ] Production database created
- [ ] Migrations applied: `prisma migrate deploy`
- [ ] Database backups configured
- [ ] Connection pooling configured

### Security
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured

### Monitoring
- [ ] Health check endpoint accessible
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
```

### Docker Deployment

#### Server Dockerfile

```dockerfile
# apps/server/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npm run prisma:generate

# Copy source
COPY . .

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
```

#### Frontend Dockerfile

```dockerfile
# apps/web/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: riskready
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: riskready
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  server:
    build:
      context: ./apps/server
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://riskready:${DB_PASSWORD}@postgres:5432/riskready
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  postgres_data:
```

### Cloud Platform Deployment

#### Vercel (Frontend)

```json
// apps/web/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Railway/Render (Backend)

```yaml
# railway.toml or render.yaml
services:
  - type: web
    name: riskready-api
    env: node
    buildCommand: npm run build
    startCommand: npm run start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: riskready-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
```

---

## Database Management

### Migration Workflow

```bash
# Development: Create and apply migration
npm run prisma:migrate

# Production: Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Backup Strategy

```bash
# PostgreSQL backup
pg_dump -h hostname -U username -d riskready > backup_$(date +%Y%m%d).sql

# Restore
psql -h hostname -U username -d riskready < backup_20241215.sql
```

### Connection Pooling

For production, use connection pooling:

```bash
# Using PgBouncer or Prisma Data Proxy
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/riskready?pgbouncer=true"
```

---

## Monitoring & Logging

### Health Check Endpoint

```typescript
// health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  }
}
```

### Logging Configuration

```typescript
// main.ts
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // ...
}
```

### Recommended Monitoring Tools

| Tool | Purpose |
|------|---------|
| **Sentry** | Error tracking |
| **Datadog/New Relic** | APM & metrics |
| **Prometheus + Grafana** | Metrics & dashboards |
| **ELK Stack** | Log aggregation |

---

## Security Considerations

### Production Security Checklist

```markdown
## Security Checklist

### Transport Security
- [ ] HTTPS enforced (TLS 1.2+)
- [ ] HSTS header enabled
- [ ] Secure cookies (Secure flag)

### Authentication
- [ ] Strong JWT secret (32+ characters)
- [ ] Short token expiration
- [ ] HTTP-only cookies
- [ ] Rate limiting on auth endpoints

### Headers
- [ ] Content-Security-Policy
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] X-XSS-Protection

### Database
- [ ] Parameterized queries (Prisma handles this)
- [ ] Least privilege database user
- [ ] Encrypted connections (SSL)
- [ ] Regular backups

### Application
- [ ] Input validation
- [ ] Output encoding
- [ ] Error handling (no stack traces in production)
- [ ] Dependency updates
```

### Security Headers (Helmet)

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

### Rate Limiting

```typescript
// main.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});

app.use(limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts',
});

app.use('/api/auth/login', authLimiter);
```

---

## Scaling Considerations

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCALED ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌─────────────────┐                                 │
│                         │  Load Balancer  │                                 │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│            ┌─────────────────────┼─────────────────────┐                   │
│            │                     │                     │                   │
│            ▼                     ▼                     ▼                   │
│     ┌─────────────┐       ┌─────────────┐       ┌─────────────┐           │
│     │  Server 1   │       │  Server 2   │       │  Server 3   │           │
│     │  (NestJS)   │       │  (NestJS)   │       │  (NestJS)   │           │
│     └──────┬──────┘       └──────┬──────┘       └──────┬──────┘           │
│            │                     │                     │                   │
│            └─────────────────────┼─────────────────────┘                   │
│                                  │                                          │
│                         ┌────────▼────────┐                                │
│                         │  Connection     │                                │
│                         │    Pooler       │                                │
│                         │  (PgBouncer)    │                                │
│                         └────────┬────────┘                                │
│                                  │                                          │
│                    ┌─────────────┴─────────────┐                           │
│                    │                           │                           │
│                    ▼                           ▼                           │
│            ┌─────────────┐             ┌─────────────┐                     │
│            │  Primary    │────────────▶│  Replica    │                     │
│            │  Database   │  Replication│  Database   │                     │
│            └─────────────┘             └─────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scaling Strategies

| Component | Strategy |
|-----------|----------|
| **Frontend** | CDN caching, edge deployment |
| **Backend** | Horizontal scaling, stateless design |
| **Database** | Read replicas, connection pooling |
| **Sessions** | JWT (stateless, no session store needed) |

### Performance Optimizations

| Area | Optimization |
|------|--------------|
| **Database** | Indexes, query optimization, connection pooling |
| **API** | Response compression, pagination, selective fields |
| **Frontend** | Code splitting, lazy loading, caching |
| **Network** | CDN, HTTP/2, compression |
