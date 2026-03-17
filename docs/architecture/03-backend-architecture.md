# Backend Architecture

This document details the NestJS backend application architecture, module structure, and API design patterns.

---

## Table of Contents

1. [Application Structure](#application-structure)
2. [NestJS Fundamentals](#nestjs-fundamentals)
3. [Module Architecture](#module-architecture)
4. [Controllers](#controllers)
5. [Services](#services)
6. [Authentication](#authentication)
7. [Validation](#validation)
8. [Error Handling](#error-handling)

---

## Application Structure

### Directory Layout

```
apps/server/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── worker.ts               # Background worker entry
│   │
│   ├── auth/                   # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── dto/
│   │
│   ├── organisation/           # Organisation module
│   │   ├── organisation.module.ts
│   │   ├── organisation.controller.ts
│   │   ├── organisation.service.ts
│   │   └── dto/
│   │
│   ├── health/                 # Health check module
│   │   └── health.controller.ts
│   │
│   └── prisma/                 # Database service
│       └── prisma.service.ts
│
├── prisma/
│   ├── schema/                 # Prisma schema files
│   │   ├── base.prisma         # Datasource config
│   │   ├── auth.prisma         # Auth models
│   │   └── organisation.prisma # Organisation models
│   ├── seed.ts                 # Database seeding
│   └── migrations/             # Database migrations
│
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

### Entry Point

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Middleware
  app.use(cookieParser());
  
  // CORS configuration
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}

bootstrap();
```

### Root Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OrganisationModule } from './organisation/organisation.module';
import { HealthController } from './health/health.controller';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    AuthModule,
    OrganisationModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
```

---

## NestJS Fundamentals

### Core Concepts

| Concept | Purpose |
|---------|---------|
| **Modules** | Organise application into feature areas |
| **Controllers** | Handle incoming requests and return responses |
| **Services** | Contain business logic and data access |
| **Guards** | Protect routes (authentication, authorisation) |
| **Pipes** | Transform and validate input data |
| **Interceptors** | Add extra logic before/after method execution |

### Dependency Injection

NestJS uses dependency injection for loose coupling:

```typescript
@Injectable()
export class OrganisationService {
  constructor(private prisma: PrismaService) {}
  
  async getDepartments() {
    return this.prisma.department.findMany();
  }
}

@Controller('organisation')
export class OrganisationController {
  constructor(private organisationService: OrganisationService) {}
  
  @Get('departments')
  getDepartments() {
    return this.organisationService.getDepartments();
  }
}
```

### Decorators

| Decorator | Purpose |
|-----------|---------|
| `@Module()` | Define a module |
| `@Controller()` | Define a controller |
| `@Injectable()` | Mark class for DI |
| `@Get()`, `@Post()`, etc. | HTTP method handlers |
| `@Param()` | Extract route parameters |
| `@Body()` | Extract request body |
| `@Query()` | Extract query parameters |
| `@UseGuards()` | Apply guards |

---

## Module Architecture

### Module Structure

Each feature module follows this pattern:

```
module/
├── module.module.ts      # Module definition
├── module.controller.ts  # HTTP handlers
├── module.service.ts     # Business logic
└── dto/                  # Data transfer objects
    ├── create-entity.dto.ts
    └── update-entity.dto.ts
```

### Module Definition

```typescript
// organisation/organisation.module.ts
import { Module } from '@nestjs/common';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [OrganisationController],
  providers: [OrganisationService, PrismaService],
  exports: [OrganisationService],
})
export class OrganisationModule {}
```

### Current Modules

| Module | Purpose | Entities |
|--------|---------|----------|
| **AuthModule** | Authentication & users | User, Session |
| **OrganisationModule** | Organisation management | Department, Location, etc. |
| **HealthModule** | Health checks | - |
| **PrismaModule** | Database access | - |

---

## Controllers

### Controller Pattern

```typescript
// organisation/organisation.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganisationService } from './organisation.service';

@Controller('organisation')
@UseGuards(JwtAuthGuard)
export class OrganisationController {
  constructor(private organisationService: OrganisationService) {}

  // GET /api/organisation/departments
  @Get('departments')
  async getDepartments(@Query() query: any) {
    return this.organisationService.getDepartments(query);
  }

  // GET /api/organisation/departments/:id
  @Get('departments/:id')
  async getDepartment(@Param('id') id: string) {
    return this.organisationService.getDepartment(id);
  }

  // POST /api/organisation/departments
  @Post('departments')
  async createDepartment(@Body() data: any, @Request() req: any) {
    return this.organisationService.createDepartment(data, req.user.id);
  }

  // PUT /api/organisation/departments/:id
  @Put('departments/:id')
  async updateDepartment(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.organisationService.updateDepartment(id, data, req.user.id);
  }

  // DELETE /api/organisation/departments/:id
  @Delete('departments/:id')
  async deleteDepartment(@Param('id') id: string) {
    return this.organisationService.deleteDepartment(id);
  }
}
```

### Route Organisation

Routes are organised by entity within the controller:

```typescript
@Controller('organisation')
export class OrganisationController {
  // Profile routes
  @Get('profile')
  getProfile() {}
  
  @Put('profile')
  updateProfile() {}

  // Department routes
  @Get('departments')
  getDepartments() {}
  
  @Get('departments/:id')
  getDepartment() {}
  
  @Post('departments')
  createDepartment() {}

  // Location routes
  @Get('locations')
  getLocations() {}
  
  // ... etc
}
```

### Request Context

Access request data using decorators:

```typescript
@Post('departments')
async createDepartment(
  @Body() body: CreateDepartmentDto,     // Request body
  @Param('id') id: string,               // Route parameter
  @Query('filter') filter: string,       // Query parameter
  @Request() req: any,                   // Full request object
  @Headers('authorization') auth: string, // Header value
) {
  const userId = req.user.id;  // From JWT payload
  return this.service.create(body, userId);
}
```

---

## Services

### Service Pattern

```typescript
// organisation/organisation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganisationService {
  constructor(private prisma: PrismaService) {}

  // List with filtering
  async getDepartments(query?: {
    isActive?: boolean;
    parentId?: string;
  }) {
    return this.prisma.department.findMany({
      where: {
        isActive: query?.isActive,
        parentId: query?.parentId,
      },
      include: {
        departmentHead: {
          select: { id: true, name: true, email: true },
        },
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { members: true, children: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Get single entity
  async getDepartment(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        departmentHead: true,
        deputyHead: true,
        parent: true,
        children: true,
        members: {
          include: { user: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }

    return department;
  }

  // Create entity
  async createDepartment(data: any, userId: string) {
    return this.prisma.department.create({
      data: {
        ...data,
        createdById: userId,
        updatedById: userId,
      },
    });
  }

  // Update entity
  async updateDepartment(id: string, data: any, userId: string) {
    // Verify exists
    await this.getDepartment(id);

    return this.prisma.department.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId,
        updatedAt: new Date(),
      },
    });
  }

  // Delete entity (soft delete)
  async deleteDepartment(id: string) {
    await this.getDepartment(id);

    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Hard delete (if needed)
  async hardDeleteDepartment(id: string) {
    await this.getDepartment(id);
    return this.prisma.department.delete({ where: { id } });
  }
}
```

### Prisma Service

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Service Patterns

#### Pagination

```typescript
async getDepartments(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.prisma.department.findMany({
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    this.prisma.department.count(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

#### Transactions

```typescript
async transferDepartmentHead(
  departmentId: string,
  newHeadId: string,
  userId: string,
) {
  return this.prisma.$transaction(async (tx) => {
    // Get current department
    const department = await tx.department.findUnique({
      where: { id: departmentId },
    });

    // Update old head's role
    if (department.departmentHeadId) {
      await tx.user.update({
        where: { id: department.departmentHeadId },
        data: { role: 'member' },
      });
    }

    // Update new head's role
    await tx.user.update({
      where: { id: newHeadId },
      data: { role: 'department_head' },
    });

    // Update department
    return tx.department.update({
      where: { id: departmentId },
      data: {
        departmentHeadId: newHeadId,
        updatedById: userId,
      },
    });
  });
}
```

---

## Authentication

### Auth Module Structure

```
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── jwt.strategy.ts
├── jwt-auth.guard.ts
└── dto/
    ├── login.dto.ts
    └── register.dto.ts
```

### Auth Controller

```typescript
// auth/auth.controller.ts
import { Controller, Post, Body, Res, UseGuards, Get, Request } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.authService.login(
      body.email,
      body.password,
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return { user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: any) {
    return this.authService.getUser(req.user.id);
  }
}
```

### Auth Service

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }
}
```

### JWT Strategy

```typescript
// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from cookie
        (req: Request) => req?.cookies?.token,
        // Fallback to Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### Auth Guard

```typescript
// auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

---

## Validation

### Using Zod

```typescript
import { z } from 'zod';

// Define schema
const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  departmentCode: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  departmentHeadId: z.string().optional(),
  criticalityLevel: z.enum(['critical', 'high', 'medium', 'low']).optional(),
});

type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

// Use in controller
@Post('departments')
async createDepartment(@Body() body: any, @Request() req: any) {
  const data = CreateDepartmentSchema.parse(body);
  return this.service.createDepartment(data, req.user.id);
}
```

### Validation Pipe

```typescript
// Custom validation pipe using Zod
import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors,
      });
    }
    return result.data;
  }
}

// Usage
@Post('departments')
@UsePipes(new ZodValidationPipe(CreateDepartmentSchema))
async createDepartment(@Body() data: CreateDepartmentInput) {
  return this.service.createDepartment(data);
}
```

---

## Error Handling

### Built-in Exceptions

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// Usage
async getDepartment(id: string) {
  const department = await this.prisma.department.findUnique({
    where: { id },
  });

  if (!department) {
    throw new NotFoundException(`Department ${id} not found`);
  }

  return department;
}

async createDepartment(data: any) {
  // Check for duplicate code
  const existing = await this.prisma.department.findUnique({
    where: { departmentCode: data.departmentCode },
  });

  if (existing) {
    throw new ConflictException(
      `Department with code ${data.departmentCode} already exists`,
    );
  }

  return this.prisma.department.create({ data });
}
```

### Global Exception Filter

```typescript
// filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        details = (exceptionResponse as any).errors || {};
      }
    }

    response.status(status).json({
      error: {
        code: HttpStatus[status],
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Register in main.ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

### Error Response Format

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Department clx123 not found",
    "details": {},
    "timestamp": "2024-12-15T10:30:00.000Z"
  }
}
```

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {
      "name": "Name is required",
      "departmentCode": "Code must be unique"
    },
    "timestamp": "2024-12-15T10:30:00.000Z"
  }
}
```
