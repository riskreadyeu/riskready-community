# Security Audit Report

**Application:** RiskReady GRC Platform
**Report Date:** January 8, 2026
**Auditor:** Automated Security Analysis
**Severity Rating:** HIGH RISK

---

## Executive Summary

The RiskReady application has a sound authentication foundation using JWT tokens with refresh sessions, but suffers from **critical authorization gaps** where 7 controllers containing admin/sensitive endpoints are completely unprotected. Additionally, potential XSS vulnerabilities exist in the frontend, and several security hardening measures (CSRF, rate limiting, Helmet) are missing.

### Risk Summary

| Category | Severity | Issues Found |
|----------|----------|--------------|
| Authentication | LOW | 2 minor issues |
| Authorization | **CRITICAL** | 7 unprotected controllers |
| Input Validation | MEDIUM | 3 issues |
| Data Protection | LOW | 2 issues |
| Common Vulnerabilities | HIGH | 5 issues |
| Secrets Management | MEDIUM | 3 issues |

### Overall Security Score: **45/100** (HIGH RISK)

---

## 1. Authentication

### 1.1 Implementation Overview

**Technology Stack:**
- JWT-based authentication via `@nestjs/jwt` and `passport-jwt`
- bcryptjs for password hashing (cost factor: 12)
- HTTP-only cookies for token storage
- Refresh session mechanism with database-backed sessions

**Files Analyzed:**
- [auth.service.ts](apps/server/src/auth/auth.service.ts)
- [auth.controller.ts](apps/server/src/auth/auth.controller.ts)
- [jwt.strategy.ts](apps/server/src/auth/jwt.strategy.ts)
- [jwt-auth.guard.ts](apps/server/src/auth/jwt-auth.guard.ts)

### 1.2 Password Handling

```typescript
// auth.service.ts:171 - Password hashing
const passwordHash = await bcrypt.hash(password, 12);

// auth.service.ts:36 - Password verification
const ok = await bcrypt.compare(password, user.passwordHash);
```

**Assessment:** ✅ GOOD
- Cost factor of 12 is appropriate
- Using bcryptjs (secure implementation)
- Passwords never logged or returned in responses

### 1.3 Token Handling

**Access Token:**
- Storage: HTTP-only cookie ✅
- TTL: 900 seconds (15 minutes) ✅
- Claims: `{ sub: user.id, email: user.email }` ⚠️ (email in token is unnecessary)

**Refresh Session:**
- Storage: HTTP-only cookie ✅
- TTL: 14 days (configurable)
- Database-backed with revocation support ✅
- IP and User-Agent tracking for session audit ✅

**Cookie Security:**
```typescript
// auth.service.ts:124-128
const cookieOptions: any = {
  httpOnly: true,
  secure: isProduction,  // Only HTTPS in production
  sameSite: 'lax' as const,
  path: '/',
};
```

**Assessment:** ✅ GOOD with minor issues
- HTTP-only prevents XSS token theft
- Secure flag properly conditional on environment
- SameSite=Lax provides CSRF protection for GET requests

### 1.4 Session Management

**Refresh Session Model:**
- Session ID stored in database with `expiresAt` timestamp
- `revokedAt` field allows session invalidation
- IP and User-Agent logged for audit trail

**Logout Implementation:**
```typescript
// auth.service.ts:105-112
async logout(refreshSessionId: string | undefined) {
  if (!refreshSessionId) return;
  await this.prisma.refreshSession.updateMany({
    where: { id: refreshSessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
```

**Assessment:** ✅ GOOD
- Proper session revocation on logout
- Sessions tracked in database

### 1.5 Issues Found

| Issue | Severity | Description |
|-------|----------|-------------|
| JWT Secret Fallback | **HIGH** | Default secret `'change-me'` if env not set |
| Login Debug Logging | LOW | `console.log('Login called...')` in production code |

**Critical Issue - JWT Secret Fallback:**
```typescript
// auth.module.ts:13
secret: process.env.JWT_SECRET ?? 'change-me',

// jwt.strategy.ts:17
secretOrKey: process.env.JWT_SECRET ?? 'change-me',
```

**Risk:** If `JWT_SECRET` is not set in production, tokens would be signed with a known default, allowing token forgery.

---

## 2. Authorization

### 2.1 Authorization Model

**Model Type:** Route-level authentication only (No RBAC/ABAC implemented)

The application uses `@UseGuards(JwtAuthGuard)` at the controller level for authentication, but has **no role-based or attribute-based authorization** implemented. All authenticated users have equal access to all protected endpoints.

### 2.2 Protected Controllers (94 instances of @UseGuards)

Most controllers ARE protected with `@UseGuards(JwtAuthGuard)`:
- ✅ `risk.controller.ts`
- ✅ `control.controller.ts`
- ✅ `incident.controller.ts`
- ✅ `vendor.controller.ts`
- ✅ `evidence.controller.ts`
- ✅ Plus 80+ other controllers

### 2.3 CRITICAL: Unprotected Controllers

**7 controllers are missing authentication guards entirely:**

| Controller | Path | Severity | Impact |
|------------|------|----------|--------|
| `evidence-migration.controller.ts` | `/api/evidence-migration/*` | **CRITICAL** | Admin migration endpoints publicly accessible |
| `governance.controller.ts` | `/api/governance/*` | **CRITICAL** | Governance data (RACI, escalation) exposed |
| `threat-catalog.controller.ts` | `/api/threats/*` | **HIGH** | Threat intelligence data exposed |
| `risk-aggregation.controller.ts` | `/api/risks/aggregation/*` | **CRITICAL** | Risk data + admin recalculate endpoint |
| `governance-role.controller.ts` | `/api/governance/roles/*` | **CRITICAL** | Role assignment without auth! |
| `risk-scheduler.controller.ts` | `/api/admin/scheduler/*` | **CRITICAL** | Admin job execution endpoint |
| `risk-notification.controller.ts` | `/api/notifications/*` | **HIGH** | User notifications accessible |
| `health.controller.ts` | `/api/health` | ACCEPTABLE | Intentional for monitoring |

**Detailed Analysis:**

#### evidence-migration.controller.ts (CRITICAL)
```typescript
@Controller('evidence-migration')
export class EvidenceMigrationController {
  // Comment says "should be protected" but NO @UseGuards!
  @Post('run')
  async runMigration(@Query('dryRun') dryRun?: string) { ... }
}
```
**Risk:** Anyone can trigger database migrations.

#### governance-role.controller.ts (CRITICAL)
```typescript
@Controller('governance/roles')
export class GovernanceRoleController {
  // NO AUTH GUARD - Role assignment is PUBLIC!
  @Post('assign')
  async assignRole(@Body() dto: AssignRoleDto) { ... }

  @Delete('revoke')
  async revokeRole(@Body() dto: RevokeRoleDto) { ... }
}
```
**Risk:** Anyone can assign/revoke governance roles.

#### risk-scheduler.controller.ts (CRITICAL)
```typescript
@Controller('admin/scheduler')
export class RiskSchedulerController {
  // NO AUTH GUARD on admin endpoints!
  @Post('jobs/:jobName/run')
  async runJob(@Param('jobName') jobName: string) { ... }
}
```
**Risk:** Anyone can trigger scheduled jobs.

### 2.4 Resource-Level Authorization

**Finding:** NO resource-level authorization exists.

Current pattern (all protected controllers):
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.service.findById(id);  // No ownership check!
}
```

**Risk:** Any authenticated user can access any resource by ID (IDOR vulnerability).

### 2.5 Multi-Tenancy Authorization

**Finding:** Organisation filtering exists but is NOT enforced.

```typescript
// risk.controller.ts:41
if (organisationId) where.organisationId = organisationId;
```

The `organisationId` filter is **optional** and user-controlled. An authenticated user could omit it to access all organisations' data.

---

## 3. Input Validation

### 3.1 Validation Framework

**Technologies:**
- `class-validator` with NestJS `ValidationPipe`
- `zod` for runtime validation
- NestJS pipes with `whitelist: true` and `forbidNonWhitelisted: true`

```typescript
// main.ts:17-26
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Reject unknown properties
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**Assessment:** ✅ GOOD baseline configuration

### 3.2 Login Validation Example

```typescript
// auth.controller.ts:8-11
const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

**Assessment:** ✅ GOOD - Zod schema validation

### 3.3 SQL Injection Analysis

**ORM:** Prisma (parameterized queries by default)

**Raw Query Found:**
```typescript
// policy-audit.service.ts:159-167
this.prisma.$queryRaw`
  SELECT DATE("performedAt") as date, COUNT(*) as count
  FROM "PolicyDocumentAuditLog" pal
  JOIN "PolicyDocument" pd ON pal."documentId" = pd.id
  WHERE pd."organisationId" = ${organisationId}
    AND pal."performedAt" >= ${startDate}
  GROUP BY DATE("performedAt")
  ORDER BY date
`
```

**Assessment:** ✅ SAFE
- Using tagged template literals with Prisma
- Variables are parameterized, not interpolated

### 3.4 XSS Vulnerabilities

**Finding:** 2 instances of `dangerouslySetInnerHTML` without sanitization

```typescript
// PolicyDocumentDetailPage.tsx:785
dangerouslySetInnerHTML={{ __html: document.content }}

// chart.tsx:76
dangerouslySetInnerHTML={{...}}
```

**Risk:** If `document.content` contains user-supplied HTML, XSS attacks are possible.

**Missing:** No DOMPurify or similar sanitization library.

### 3.5 File Upload Security

**Finding:** Multer is installed but no file upload endpoints found in controllers.

```json
// package-lock.json shows multer dependency
"multer": "2.0.2"
```

**Assessment:** ⚠️ NEEDS REVIEW if file upload is implemented

---

## 4. Data Protection

### 4.1 Sensitive Data in API Responses

**User Data Filtering:**
```typescript
// auth.controller.ts:23-29
select: {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  // passwordHash NOT selected ✅
}
```

**Assessment:** ✅ GOOD - Password hash excluded

### 4.2 Logging of Sensitive Data

**Search Results:** No sensitive data logging found.

```typescript
// auth.service.ts:77-81 - Login error logging
console.error('Login error details:', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  email,  // ⚠️ Email logged on error
});
```

**Assessment:** ⚠️ MINOR - Email logged on login failure (could aid enumeration)

### 4.3 Encryption at Rest

**Finding:** No encryption at rest configuration found.

- Database encryption: Not configured (relies on PostgreSQL settings)
- Field-level encryption: Not implemented

### 4.4 HTTPS Enforcement

**Finding:** No HTTPS enforcement in application code.

```typescript
// main.ts - No HTTPS redirect
app.enableCors({
  origin: true,
  credentials: true,
});
```

**Note:** HTTPS should be enforced at the infrastructure level (load balancer/reverse proxy).

---

## 5. Common Vulnerabilities

### 5.1 CSRF Protection

**Finding:** ❌ NO CSRF protection implemented.

SameSite=Lax cookies provide partial protection, but:
- POST/PUT/DELETE from cross-origin forms are still possible
- No CSRF tokens implemented

**Risk:** State-changing operations vulnerable to CSRF attacks.

### 5.2 Rate Limiting

**Finding:** ❌ NO rate limiting implemented.

No `@nestjs/throttler` or similar rate limiting middleware.

**Risk:**
- Brute force attacks on login
- API abuse and DoS
- Resource exhaustion

### 5.3 Security Headers (Helmet)

**Finding:** ❌ Helmet middleware NOT configured.

Missing headers:
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Content-Security-Policy`
- `Strict-Transport-Security`

### 5.4 CORS Configuration

**Finding:** ⚠️ Overly permissive CORS.

```typescript
// main.ts:28-31
app.enableCors({
  origin: true,  // Allows ALL origins!
  credentials: true,
});
```

**Risk:** Any website can make authenticated requests to the API.

### 5.5 Error Information Leakage

**Finding:** Generic errors used (GOOD), but some debug logging exists.

```typescript
// auth.controller.ts:43
console.log('Login called, authService:', !!this.authService, 'prisma:', !!this.prisma);
```

**Assessment:** ⚠️ Debug logging should be removed in production.

### 5.6 Dependency Vulnerabilities

**npm audit result:** ✅ 0 vulnerabilities found

```json
{
  "vulnerabilities": {
    "info": 0,
    "low": 0,
    "moderate": 0,
    "high": 0,
    "critical": 0,
    "total": 0
  }
}
```

---

## 6. Secrets Management

### 6.1 Environment Variables

**Required Secrets:**
- `JWT_SECRET` - JWT signing key
- `DATABASE_URL` - Database connection string
- `ADMIN_EMAIL` - Bootstrap admin email
- `ADMIN_PASSWORD` - Bootstrap admin password

### 6.2 .gitignore Review

```gitignore
# .gitignore - Environment files
.env
.env.local
.env.*.local
```

**Assessment:** ✅ GOOD - .env files properly ignored

### 6.3 Hardcoded Secrets

**Critical Finding - Default JWT Secret:**
```typescript
// auth.module.ts:13
secret: process.env.JWT_SECRET ?? 'change-me',
```

**Development .env File:**
```bash
# apps/server/.env
JWT_SECRET=dev-secret-change-in-production
```

**Assessment:** ⚠️ WARNING
- Development secret is weak but labeled
- Production deployment MUST override

### 6.4 API Key Exposure

**Finding:** No hardcoded API keys found in source code.

### 6.5 Frontend Token Storage

**Finding:** Mixed storage patterns.

```typescript
// lib/api.ts - Cookies (GOOD)
credentials: 'include',

// lib/supply-chain-api.ts - localStorage (BAD)
const token = localStorage.getItem('token');

// lib/bcm-api.ts - localStorage (BAD)
const token = localStorage.getItem('token');
```

**Risk:** localStorage tokens are vulnerable to XSS attacks.

---

## 7. Recommendations

### Critical Priority (Fix Immediately)

1. **Add Authentication Guards to Unprotected Controllers**
   ```typescript
   // Add to all 7 unprotected controllers
   @Controller('governance')
   @UseGuards(JwtAuthGuard)  // ADD THIS
   export class GovernanceController { ... }
   ```
   Files to fix:
   - `evidence-migration.controller.ts`
   - `governance.controller.ts`
   - `threat-catalog.controller.ts`
   - `risk-aggregation.controller.ts`
   - `governance-role.controller.ts`
   - `risk-scheduler.controller.ts`
   - `risk-notification.controller.ts`

2. **Remove JWT Secret Fallback**
   ```typescript
   // auth.module.ts - Change to:
   secret: process.env.JWT_SECRET ||
     (() => { throw new Error('JWT_SECRET is required'); })(),
   ```

3. **Sanitize HTML Content**
   ```typescript
   // Install: npm install dompurify @types/dompurify
   import DOMPurify from 'dompurify';

   dangerouslySetInnerHTML={{
     __html: DOMPurify.sanitize(document.content)
   }}
   ```

### High Priority

4. **Add Rate Limiting**
   ```typescript
   // Install: npm install @nestjs/throttler
   // app.module.ts
   ThrottlerModule.forRoot({
     ttl: 60,
     limit: 100,
   }),
   ```

5. **Add Helmet Middleware**
   ```typescript
   // Install: npm install helmet
   // main.ts
   import helmet from 'helmet';
   app.use(helmet());
   ```

6. **Fix CORS Configuration**
   ```typescript
   app.enableCors({
     origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
     credentials: true,
   });
   ```

7. **Implement Resource-Level Authorization**
   ```typescript
   @Get(':id')
   async findOne(@Param('id') id: string, @Request() req) {
     const resource = await this.service.findById(id);
     if (resource.organisationId !== req.user.organisationId) {
       throw new ForbiddenException();
     }
     return resource;
   }
   ```

### Medium Priority

8. **Remove Debug Console Logs**
   - `auth.controller.ts:43`

9. **Standardize Frontend Token Storage**
   - Remove localStorage usage in `supply-chain-api.ts` and `bcm-api.ts`
   - Use HTTP-only cookies consistently

10. **Add CSRF Protection**
    ```typescript
    // Install: npm install csurf
    import csurf from 'csurf';
    app.use(csurf({ cookie: true }));
    ```

11. **Implement Role-Based Access Control**
    - Add roles to User model
    - Create RolesGuard
    - Apply to sensitive endpoints

### Low Priority

12. **Remove Email from JWT Payload**
    - `sub` is sufficient for user identification

13. **Add Request ID Logging**
    - Helps trace security incidents

14. **Implement Account Lockout**
    - After N failed login attempts

---

## 8. Summary

### Security Controls Present

| Control | Status |
|---------|--------|
| Password Hashing | ✅ bcrypt (cost 12) |
| JWT Authentication | ✅ Implemented |
| Session Management | ✅ Database-backed |
| HTTP-Only Cookies | ✅ Configured |
| Secure Cookies (Prod) | ✅ Conditional |
| SameSite Cookies | ✅ Lax |
| Input Validation | ✅ ValidationPipe + Zod |
| SQL Injection Protection | ✅ Prisma ORM |
| .env Git Ignore | ✅ Configured |
| Dependency Audit | ✅ Clean |

### Security Controls Missing

| Control | Status | Priority |
|---------|--------|----------|
| Auth Guards (7 controllers) | ❌ Missing | CRITICAL |
| Rate Limiting | ❌ Not implemented | HIGH |
| CSRF Protection | ❌ Not implemented | HIGH |
| Helmet Headers | ❌ Not configured | HIGH |
| RBAC/ABAC | ❌ Not implemented | HIGH |
| Resource Authorization | ❌ Not implemented | HIGH |
| XSS Sanitization | ❌ Not implemented | HIGH |
| Proper CORS | ⚠️ Permissive | MEDIUM |

### Overall Assessment

The application has **critical security vulnerabilities** that must be addressed before production deployment:

1. **7 controllers expose sensitive endpoints without authentication**
2. **No authorization beyond authentication** - all users have equal access
3. **XSS vulnerabilities** in HTML rendering
4. **Missing security hardening** - rate limiting, CSRF, Helmet

**Recommended Action:** Halt production deployment until Critical and High priority issues are resolved.

---

*Security audit performed January 8, 2026*
*Methodology: Static code analysis and pattern matching*
