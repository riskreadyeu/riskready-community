# Authentication & Authorization

This document details the authentication system, JWT implementation, and authorization patterns.

---

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [JWT Implementation](#jwt-implementation)
3. [Login Flow](#login-flow)
4. [Session Management](#session-management)
5. [Route Protection](#route-protection)
6. [Authorization Patterns](#authorization-patterns)
7. [Security Best Practices](#security-best-practices)

---

## Authentication Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                                            │
│  │   Client    │                                                            │
│  │   (React)   │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         │ 1. POST /api/auth/login                                           │
│         │    { email, password }                                            │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         NestJS Server                                │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │    │
│  │  │    Auth     │───▶│   Verify    │───▶│   Issue     │              │    │
│  │  │ Controller  │    │  Password   │    │    JWT      │              │    │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘              │    │
│  └───────────────────────────────────────────────┼──────────────────────┘    │
│                                                  │                           │
│         ┌────────────────────────────────────────┘                          │
│         │ 2. Set-Cookie: token=<JWT>; HttpOnly                              │
│         ▼                                                                    │
│  ┌─────────────┐                                                            │
│  │   Client    │  Stores JWT in HTTP-only cookie                            │
│  │   (React)   │  (not accessible via JavaScript)                           │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         │ 3. GET /api/organisation/departments                              │
│         │    Cookie: token=<JWT>                                            │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         NestJS Server                                │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │    │
│  │  │    JWT      │───▶│   Validate  │───▶│   Attach    │              │    │
│  │  │   Guard     │    │    Token    │    │    User     │              │    │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘              │    │
│  │                                               │                      │    │
│  │                                               ▼                      │    │
│  │                                        ┌─────────────┐              │    │
│  │                                        │  Controller │              │    │
│  │                                        │   Handler   │              │    │
│  │                                        └─────────────┘              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose |
|-----------|---------|
| **AuthController** | Handle login/logout/me endpoints |
| **AuthService** | Validate credentials, issue tokens |
| **JwtStrategy** | Extract and validate JWT from requests |
| **JwtAuthGuard** | Protect routes requiring authentication |
| **Passport** | Authentication middleware framework |

---

## JWT Implementation

### Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "clx123abc",      // User ID
    "email": "user@example.com",
    "role": "admin",
    "iat": 1702648800,       // Issued at
    "exp": 1702735200        // Expires at
  },
  "signature": "..."
}
```

### Token Configuration

```typescript
// auth/auth.module.ts
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: '24h',
      },
    }),
  ],
})
export class AuthModule {}
```

### Environment Variables

```bash
# .env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h
```

---

## Login Flow

### 1. Client Login Request

```typescript
// Frontend: LoginPage.tsx
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important: include cookies
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const { user } = await response.json();
    // User is now authenticated
    // JWT is stored in HTTP-only cookie automatically
    navigate('/dashboard');
  }
};
```

### 2. Server Authentication

```typescript
// auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    // Validate credentials and get token
    const { user, token } = await this.authService.login(
      body.email,
      body.password,
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,                              // Not accessible via JS
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'lax',                             // CSRF protection
      maxAge: 24 * 60 * 60 * 1000,                 // 24 hours
      path: '/',                                   // Available on all paths
    });

    // Return user info (not the token)
    return { user };
  }
}
```

### 3. Password Verification

```typescript
// auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
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
}
```

---

## Session Management

### JWT Strategy

```typescript
// auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract JWT from cookie or Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Primary: HTTP-only cookie
        (req: Request) => {
          return req?.cookies?.token || null;
        },
        // Fallback: Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // This is called after JWT is verified
    // Return value is attached to request.user
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### Logout

```typescript
// auth/auth.controller.ts
@Post('logout')
async logout(@Res({ passthrough: true }) res: Response) {
  // Clear the token cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return { message: 'Logged out successfully' };
}
```

### Get Current User

```typescript
// auth/auth.controller.ts
@Get('me')
@UseGuards(JwtAuthGuard)
async me(@Request() req: any) {
  // req.user is populated by JwtStrategy.validate()
  return this.authService.getUser(req.user.id);
}

// auth/auth.service.ts
async getUser(id: string) {
  const user = await this.prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      jobTitle: true,
    },
  });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  return user;
}
```

---

## Route Protection

### JWT Auth Guard

```typescript
// auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Call parent AuthGuard which uses JwtStrategy
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Handle authentication errors
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
```

### Protecting Routes

```typescript
// Controller-level protection (all routes)
@Controller('organisation')
@UseGuards(JwtAuthGuard)
export class OrganisationController {
  // All routes require authentication
}

// Route-level protection (specific routes)
@Controller('public')
export class PublicController {
  @Get('health')
  health() {
    // Public route
    return { status: 'ok' };
  }

  @Get('protected')
  @UseGuards(JwtAuthGuard)
  protected(@Request() req: any) {
    // Protected route
    return { user: req.user };
  }
}
```

### Accessing User in Controllers

```typescript
@Controller('organisation')
@UseGuards(JwtAuthGuard)
export class OrganisationController {
  @Post('departments')
  async createDepartment(
    @Body() data: CreateDepartmentDto,
    @Request() req: any,
  ) {
    // Access authenticated user
    const userId = req.user.id;
    const userRole = req.user.role;

    return this.service.createDepartment(data, userId);
  }
}
```

---

## Authorization Patterns

### Role-Based Access Control (RBAC)

```typescript
// User roles
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
}

// Role hierarchy
const roleHierarchy = {
  admin: ['admin', 'manager', 'user', 'viewer'],
  manager: ['manager', 'user', 'viewer'],
  user: ['user', 'viewer'],
  viewer: ['viewer'],
};
```

### Roles Guard

```typescript
// auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.includes(user.role);
  }
}

// Roles decorator
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### Using Roles

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles('admin')
  async getUsers() {
    // Only admins can access
  }

  @Get('reports')
  @Roles('admin', 'manager')
  async getReports() {
    // Admins and managers can access
  }
}
```

### Resource-Based Authorization

```typescript
// Service-level authorization
@Injectable()
export class DepartmentService {
  async updateDepartment(
    id: string,
    data: UpdateDepartmentDto,
    userId: string,
    userRole: string,
  ) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Check authorization
    const canEdit =
      userRole === 'admin' ||
      department.departmentHeadId === userId ||
      department.createdById === userId;

    if (!canEdit) {
      throw new ForbiddenException('Not authorized to edit this department');
    }

    return this.prisma.department.update({
      where: { id },
      data: { ...data, updatedById: userId },
    });
  }
}
```

---

## Security Best Practices

### Password Security

```typescript
// Password hashing
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Hash password before storing
const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verify password
const isValid = await bcrypt.compare(plainPassword, passwordHash);
```

### JWT Security

| Practice | Implementation |
|----------|----------------|
| **Strong secret** | Use long, random secret key |
| **Short expiration** | 24 hours or less |
| **HTTP-only cookie** | Prevent XSS token theft |
| **Secure flag** | HTTPS only in production |
| **SameSite** | Prevent CSRF attacks |

### Cookie Configuration

```typescript
res.cookie('token', token, {
  httpOnly: true,      // Cannot be accessed by JavaScript
  secure: true,        // Only sent over HTTPS
  sameSite: 'lax',     // Sent with same-site requests and top-level navigation
  maxAge: 86400000,    // 24 hours in milliseconds
  path: '/',           // Available on all paths
  domain: undefined,   // Current domain only
});
```

### Input Validation

```typescript
// Validate login input
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

@Post('login')
async login(@Body() body: any) {
  const { email, password } = LoginSchema.parse(body);
  // ...
}
```

### Rate Limiting

```typescript
// Implement rate limiting for auth endpoints
// Using express-rate-limit or similar

import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
});

// Apply to auth routes
app.use('/api/auth/login', authLimiter);
```

### Security Headers

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
```

### Audit Logging

```typescript
// Log authentication events
async login(email: string, password: string, ip: string) {
  try {
    const result = await this.validateAndLogin(email, password);
    
    // Log successful login
    await this.auditLog.create({
      event: 'LOGIN_SUCCESS',
      userId: result.user.id,
      ip,
      timestamp: new Date(),
    });
    
    return result;
  } catch (error) {
    // Log failed login attempt
    await this.auditLog.create({
      event: 'LOGIN_FAILED',
      email,
      ip,
      reason: error.message,
      timestamp: new Date(),
    });
    
    throw error;
  }
}
```

---

## Frontend Authentication

### Auth Context (Optional Pattern)

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { user: userData } = await response.json();
    setUser(userData);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Protected Route Component

```typescript
// components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```
