# Security Audit Report: RiskReady Community Edition

**Date:** 2026-02-22
**Auditor:** Claude Opus 4.6 (Automated Static Analysis)
**Standards:** Trail of Bits Methodology, OWASP Top 10 (2021)
**Scope:** Full source code review of `apps/server`, `apps/web`, `gateway`, and all MCP servers
**Commit:** `2bdf008` (main branch)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH     | 4 |
| MEDIUM   | 5 |
| LOW      | 3 |
| INFO     | 4 |
| **Total** | **18** |

**Overall Security Grade: C+**

RiskReady Community Edition demonstrates several sound security practices -- JWT-based authentication with httpOnly cookies, bcrypt password hashing, input sanitization via a global XSS pipe, rate limiting, Helmet headers, parameterized Prisma queries, and an MCP human-in-the-loop approval system for mutations. However, the audit uncovered two critical issues (CORS misconfiguration with credentials and stored XSS via unsafe HTML rendering), multiple high-severity issues (weak default secrets, missing RBAC, missing tenant isolation on several endpoints, and sensitive data in error logs), and a collection of medium/low findings that should be addressed before any internet-facing deployment.

---

## Detailed Findings

---

### OWASP A01: Broken Access Control

#### FINDING-01: No Role-Based Access Control (RBAC) System [HIGH]

**Location:** `apps/server/src/auth/` (entire module)

The application has no concept of user roles or permissions. Every authenticated user has identical access to every endpoint -- they can manage gateway API keys, run database migrations, approve MCP actions, delete evidence, and access all organisation data.

```
// apps/server/src/auth/jwt.strategy.ts:27-29
async validate(payload: any) {
  return { id: payload.sub, email: payload.email };
}
```

The JWT payload carries only `sub` (user ID) and `email`. No role, permission set, or scope is included. The `JwtAuthGuard` at `apps/server/src/auth/jwt-auth.guard.ts` simply checks if a route is `@Public()` or requires any valid JWT -- it never checks authorization level.

**Impact:** Any authenticated user can perform administrative actions such as:
- Updating gateway API keys (`PUT /api/gateway-config`)
- Running database migrations (`POST /api/evidence-migration/run`)
- Approving or rejecting MCP pending actions (`POST /api/mcp-approvals/:id/approve`)

**Remediation:** Implement role-based access control:
1. Add a `role` field to the User model (e.g., `ADMIN`, `AUDITOR`, `VIEWER`).
2. Create a `@Roles()` decorator and `RolesGuard`.
3. Apply it to sensitive endpoints like gateway-config, evidence-migration, and mcp-approvals.

---

#### FINDING-02: Missing Tenant Isolation on Evidence Endpoints [HIGH]

**Location:** `apps/server/src/evidence/services/evidence.service.ts`

The evidence service performs no `organisationId` filtering on any query. A user in Organisation A can read, update, and delete evidence belonging to Organisation B by simply knowing the record UUID.

```typescript
// apps/server/src/evidence/services/evidence.service.ts:87-88
async findOne(id: string) {
  const evidence = await this.prisma.evidence.findUnique({
    where: { id },
    // No organisationId check
  });
```

Similarly, `findAll()` at line 18 builds its `where` clause without any organisation scoping, and `delete()` at line 313 deletes by ID alone.

**Impact:** In a multi-tenant deployment, complete cross-tenant data access to all evidence records.

**Remediation:** Add `organisationId` to all evidence queries and enforce it from the authenticated user's context. Apply the same pattern across all domain services.

---

#### FINDING-03: Evidence Migration Endpoints Lack Admin Protection [MEDIUM]

**Location:** `apps/server/src/evidence/controllers/evidence-migration.controller.ts:9-48`

The migration controller comment states "These endpoints should be protected and only accessible by administrators," but no guard or decorator enforces this:

```typescript
// apps/server/src/evidence/controllers/evidence-migration.controller.ts:8-9
@Controller('evidence-migration')
export class EvidenceMigrationController {
```

Any authenticated user can trigger full database migrations via `POST /api/evidence-migration/run`.

**Remediation:** Add an admin-only guard or restrict this controller to CLI/startup operations only. Remove from the production HTTP surface if not needed at runtime.

---

#### FINDING-04: Gateway Config API Key Management Lacks Authorization [MEDIUM]

**Location:** `apps/server/src/gateway-config/gateway-config.controller.ts:8-25`

Any authenticated user can read (masked) and write Anthropic API keys for any organisation by supplying an arbitrary `organisationId` query parameter:

```typescript
// apps/server/src/gateway-config/gateway-config.controller.ts:8-10
@Get()
async getConfig(@Query('organisationId') organisationId: string) {
  return this.service.getConfig(organisationId);
}
```

There is no check that the requesting user belongs to the specified organisation.

**Remediation:** Validate that `organisationId` matches the authenticated user's organisation. Apply admin-only authorization for API key management.

---

### OWASP A02: Cryptographic Failures

#### FINDING-05: Weak Default Secrets in Configuration [HIGH]

**Location:** `apps/server/.env` (not tracked in git, but present on disk)

```
# apps/server/.env:2
JWT_SECRET=dev-jwt-secret-min-32-chars-for-local-only

# apps/server/.env:8
ADMIN_PASSWORD=admin123456
```

The `.env.example` file and `docker-compose.yml` use placeholder values like `change-me` and `riskready` as defaults:

```yaml
# docker-compose.yml:8
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-riskready}
```

```
# .env.example:10
JWT_SECRET=change-me-min-32-chars
```

While `.env` is properly gitignored and the docker-compose uses `${JWT_SECRET:?Set JWT_SECRET in .env}` to force it at runtime, the database password defaults to `riskready` if unset. The on-disk `.env` has a weak admin password (`admin123456`).

**Impact:** If deployed with default credentials, the database and admin account are trivially compromisable. The JWT secret at 42 characters is of adequate length for dev but is a static, predictable string.

**Remediation:**
1. Generate cryptographically random secrets during initial setup (e.g., `openssl rand -base64 48`).
2. Add startup validation that rejects known-weak/placeholder secrets in production (`NODE_ENV=production`).
3. Require `POSTGRES_PASSWORD` in docker-compose (use `?` syntax like JWT_SECRET).
4. Enforce minimum password complexity for ADMIN_PASSWORD.

---

#### FINDING-06: Legacy Encryption Uses Hardcoded Salt [LOW]

**Location:** `apps/server/src/shared/utils/crypto.util.ts:75`

```typescript
// apps/server/src/shared/utils/crypto.util.ts:75
const key = scryptSync(legacyKey, 'riskready-credential-salt', 32);
```

The legacy decryption path uses a hardcoded, non-random salt string. While the new encryption format properly generates random salts, the legacy path remains for backward compatibility.

**Impact:** Credentials encrypted with the old format have weaker key derivation. An attacker with the JWT_SECRET and the ciphertext could derive the same key deterministically.

**Remediation:** Migrate all existing encrypted credentials to the new format with random salts. Add a one-time migration script and remove the legacy code path.

---

### OWASP A03: Injection

#### FINDING-07: Stored XSS via Unsafe HTML Rendering on Policy Content [CRITICAL]

**Location:** `apps/web/src/pages/policies/PolicyDocumentDetailPage.tsx:832-835`

The policy document detail page renders `document.content` as raw HTML using React's unsafe inner HTML mechanism. While the server has a `SanitizePipe` that applies XSS filtering on request bodies (`apps/server/src/shared/pipes/sanitize.pipe.ts`), this pipe only sanitizes on input. If data was inserted before the pipe was added, via direct database manipulation, MCP tools, or another code path that bypasses the pipe, the stored content is rendered unsanitized.

The `SanitizePipe` also only processes `body` type metadata (line 7), meaning query parameters and path parameters pass through unsanitized. However, in this case the risk is specifically about stored content in the database being rendered as HTML.

**Impact:** Any user who can create or edit policy documents can inject arbitrary JavaScript that executes in the browser of every user who views the document. This enables session hijacking, data exfiltration, and privilege escalation.

**Remediation:**
1. Use a robust client-side HTML sanitizer (e.g., DOMPurify) immediately before rendering.
2. Alternatively, use a markdown renderer instead of raw HTML.
3. Implement Content-Security-Policy headers that restrict inline scripts.

---

#### FINDING-08: Raw SQL Queries -- Parameterized but Present [INFO]

**Location:**
- `apps/server/src/policies/services/policy-audit.service.ts:159-167`
- `gateway/src/memory/search.service.ts:30-46` and `50-64`

Both files use Prisma's `$queryRaw` with tagged template literals, which provides automatic parameterization:

```typescript
// apps/server/src/policies/services/policy-audit.service.ts:159-167
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

This is safe. The tagged template literal syntax ensures parameters are properly escaped. No `$queryRawUnsafe` or `$executeRawUnsafe` calls were found anywhere in the codebase.

**Status:** No vulnerability. Noted for audit completeness.

---

### OWASP A05: Security Misconfiguration

#### FINDING-09: CORS Allows All Origins with Credentials [CRITICAL]

**Location:** `apps/server/src/main.ts:47-63`

```typescript
// apps/server/src/main.ts:47-55
const corsOriginEnv = process.env['CORS_ORIGIN']?.trim();
const allowedOrigins = corsOriginEnv ? corsOriginEnv.split(',').map(o => o.trim()) : [];

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);  // ALL origins allowed
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,  // Cookies sent cross-origin
```

The default configuration (`.env.example` line 21: `CORS_ORIGIN=`) leaves CORS_ORIGIN empty, meaning **all origins are allowed** while `credentials: true` is set. This is the default for Docker deployments as documented.

Although browsers theoretically block `Access-Control-Allow-Credentials: true` with `Access-Control-Allow-Origin: *`, this implementation uses a dynamic origin callback that echoes back the requesting origin (by returning `true`), effectively bypassing that browser restriction. Any malicious website can make authenticated cross-origin requests.

**Impact:** An attacker can host a malicious page that makes authenticated API requests to the RiskReady server, stealing data or performing actions on behalf of the logged-in user. This enables CSRF-like attacks even with `sameSite: lax` cookies in some scenarios.

**Remediation:**
1. When `CORS_ORIGIN` is empty, deny all cross-origin requests with credentials rather than allowing all.
2. Alternatively, require explicit origin configuration and fail-closed:
   ```typescript
   if (allowedOrigins.length === 0) {
     return callback(new Error('CORS_ORIGIN must be configured'), false);
   }
   ```
3. Log a startup warning when CORS is in permissive mode.

---

#### FINDING-10: Helmet CSP Disabled [LOW]

**Location:** `apps/server/src/main.ts:20-23`

```typescript
// apps/server/src/main.ts:20-23
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
```

Content-Security-Policy is disabled. The comment says "Disable CSP for API-only server," which is reasonable since the API server does not serve HTML pages. However, if the Caddy reverse proxy does not add CSP headers for the web frontend, the application has no CSP protection.

**Impact:** Reduced defense-in-depth against XSS attacks on the frontend.

**Remediation:** Configure CSP headers in the Caddy reverse proxy for the web frontend. At minimum, add `script-src 'self'` to prevent inline script injection.

---

#### FINDING-11: Default Cookie Secure Flag is `false` [MEDIUM]

**Location:** `apps/server/src/auth/auth.service.ts:126` and `.env.example:25`

```typescript
// apps/server/src/auth/auth.service.ts:126
secure: process.env['COOKIE_SECURE'] === 'true' ||
        (isProduction && process.env['COOKIE_SECURE'] !== 'false'),
```

```
# .env.example:25
COOKIE_SECURE=false
```

The default configuration sets `COOKIE_SECURE=false`, and both the root `.env.example` and the Docker `docker-compose.yml` propagate this default. The Caddy configuration serves over plain HTTP (`:80`). This means authentication cookies are transmitted in cleartext.

The logic at line 126 does correctly default to `true` in production when `COOKIE_SECURE` is not explicitly set to `false`, but the `.env.example` template explicitly sets it to `false`, which overrides the production default.

**Impact:** Cookies containing JWT access tokens and refresh session IDs are transmitted over unencrypted HTTP, susceptible to network sniffing.

**Remediation:**
1. Change the `.env.example` default to `COOKIE_SECURE=true`.
2. Add a startup warning when `COOKIE_SECURE=false` in production.
3. Document that HTTPS is required for any non-localhost deployment.

---

### OWASP A04: Insecure Design

#### FINDING-12: No Account Lockout or Brute-Force Protection on Login [MEDIUM]

**Location:** `apps/server/src/auth/auth.service.ts:26-84`

The login flow validates credentials against bcrypt hashes but has no failed-attempt tracking or account lockout mechanism. While the application has a global rate limiter (`ThrottlerModule` at 100 requests/minute in `apps/server/src/app.module.ts:23-25`), this applies per-IP globally, not per-account.

An attacker can attempt 100 password guesses per minute per IP address, and unlimited attempts from distributed IPs.

**Impact:** The admin account with a simple password (like the default `admin123456`) could be brute-forced.

**Remediation:**
1. Implement per-account rate limiting with exponential backoff (e.g., lock after 5 failed attempts for 15 minutes).
2. Apply a stricter rate limit specifically to the `/api/auth/login` endpoint.
3. Consider adding CAPTCHA after N failed attempts.

---

#### FINDING-13: Refresh Token Not Rotated on Use [MEDIUM]

**Location:** `apps/server/src/auth/auth.service.ts:86-103`

```typescript
// apps/server/src/auth/auth.service.ts:86-103
async refresh(refreshSessionId: string | undefined): Promise<AuthResult> {
  // ...validates session...
  const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });
  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshSessionId: session.id,  // Same session ID returned
  };
}
```

The refresh endpoint issues a new access token but reuses the same refresh session ID. If a refresh token is stolen, the attacker can use it indefinitely (up to the TTL) even after the legitimate user performs a refresh.

**Impact:** A stolen refresh token remains valid for the full session lifetime (default 14 days) with no way for the server to detect concurrent usage.

**Remediation:** Implement refresh token rotation:
1. On each refresh, revoke the old session and create a new one.
2. If a revoked session is used, revoke all sessions for that user (detect replay).

---

### OWASP A07: Identification and Authentication Failures

#### FINDING-14: Bootstrap Admin Created on Every Login Attempt [LOW]

**Location:** `apps/server/src/auth/auth.service.ts:28-31`

```typescript
// apps/server/src/auth/auth.service.ts:28-31
// Ensure bootstrap admin exists (completely non-blocking - run in background)
this.ensureBootstrapAdmin().catch((error) => {
  console.error('Error ensuring bootstrap admin (non-blocking):', error);
});
```

The `ensureBootstrapAdmin()` method is called on every login attempt (not just startup). While it is idempotent (only creates if no users exist), this is an unnecessary database query on every authentication request and could lead to a race condition during initial setup.

**Impact:** Minor performance concern. No direct security vulnerability since the function checks `count > 0` before creating.

**Remediation:** Move bootstrap admin creation to application startup (`onModuleInit`) instead of calling it on every login.

---

### OWASP A08: Software and Data Integrity Failures

#### FINDING-15: MCP Tool Inputs Not Sanitized for XSS [INFO]

**Location:** `apps/mcp-server-controls/src/tools/mutation-tools.ts` and all MCP server tool files

MCP tool inputs use Zod schemas for type validation (string, enum, boolean, etc.) but do not apply XSS sanitization. For example:

```typescript
// apps/mcp-server-controls/src/tools/mutation-tools.ts:57-58
title: z.string().describe('Assessment title'),
description: z.string().optional().describe('Assessment description'),
```

These values are stored directly in the database via `prisma.mcpPendingAction.create()`. If later rendered as HTML, they could enable XSS.

However, the MCP mutation tools use the "propose and approve" pattern -- all writes go through `mcpPendingAction` and require human approval before execution. The API server's `SanitizePipe` would sanitize data when the executor service creates the actual records through the NestJS pipeline.

**Status:** Low practical risk due to the approval workflow. Noted for defense-in-depth.

**Remediation:** Add `.transform(val => xss(val))` to string fields in MCP Zod schemas, or ensure the executor service routes data through the sanitization pipeline.

---

### OWASP A09: Security Logging and Monitoring Failures

#### FINDING-16: Email Address Logged in Authentication Errors [HIGH]

**Location:** `apps/server/src/auth/auth.service.ts:77-81`

```typescript
// apps/server/src/auth/auth.service.ts:77-81
console.error('Login error details:', {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  email,  // User email logged in cleartext
});
```

On every failed login attempt, the email address is written to console logs along with the full stack trace. In a containerized deployment, these logs are often aggregated to external logging services.

**Impact:** PII (email addresses) leaked to log aggregation systems. Combined with the login error at line 63 (`console.error('Login error:', error)`), full error details including stack traces are logged.

**Remediation:**
1. Remove `email` from the error log or hash/mask it.
2. Replace `console.error` with the NestJS `Logger` service to ensure consistent log formatting and level control.
3. Implement structured logging that tags PII fields for automatic redaction.

---

#### FINDING-17: Global Exception Filter Exposes Error Details [INFO]

**Location:** `apps/server/src/shared/filters/http-exception.filter.ts:46-48`

```typescript
// apps/server/src/shared/filters/http-exception.filter.ts:46-48
} else if (exception instanceof Error) {
  message = exception.message;
  error = exception.name;
```

For unhandled exceptions (non-HttpException), the raw error message and class name are returned to the client. While stack traces are not included in the response (only logged server-side), the error message could leak internal implementation details.

**Impact:** Error messages from Prisma, Node.js internals, or third-party libraries could reveal database schema, file paths, or internal logic to an attacker.

**Remediation:** For non-HttpException errors (5xx), return a generic message to the client:
```typescript
} else if (exception instanceof Error) {
  message = 'Internal server error';  // Generic message to client
  error = 'Internal Server Error';
  // Log the real error server-side only
}
```

---

### OWASP A06: Vulnerable and Outdated Components

#### FINDING-18: No Dependency Vulnerability Scanning Observed [INFO]

No evidence of automated dependency scanning (e.g., `npm audit`, Snyk, Dependabot) was found in the repository configuration. The `package-lock.json` files have uncommitted modifications.

**Remediation:** Add `npm audit` to CI/CD pipeline. Consider GitHub Dependabot or Snyk for continuous monitoring.

---

## Positive Security Findings

The following security controls are properly implemented:

1. **Password Hashing:** bcrypt with cost factor 12 (`apps/server/src/auth/auth.service.ts:171`).
2. **JWT Validation:** Tokens are extracted from httpOnly cookies, not headers; expiration is enforced (`ignoreExpiration: false` in `apps/server/src/auth/jwt.strategy.ts:16`).
3. **Cookie Security:** Cookies are set with `httpOnly: true`, `sameSite: 'lax'`, and configurable `secure` flag (`apps/server/src/auth/auth.service.ts:124-128`).
4. **Global Input Sanitization:** A `SanitizePipe` applies XSS filtering to all request bodies (`apps/server/src/shared/pipes/sanitize.pipe.ts`).
5. **Global Input Validation:** `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strips and rejects unexpected fields (`apps/server/src/main.ts:29-36`).
6. **Rate Limiting:** Global throttler at 100 req/min (`apps/server/src/app.module.ts:23-25`).
7. **Parameterized Queries:** All Prisma queries use the ORM's built-in parameterization. `$queryRaw` uses tagged template literals for safe parameter binding.
8. **No Command Injection:** No use of `exec`, `spawn`, `child_process` in the server application.
9. **No Path Traversal:** No user-controlled filesystem operations found in the server.
10. **Audit Logging:** Comprehensive Prisma middleware logs all CUD operations with sensitive field masking (`apps/server/src/prisma/prisma-audit.middleware.ts` and `apps/server/src/shared/constants/audit-config.ts`).
11. **Credential Encryption:** API keys stored encrypted with AES-256-GCM and scrypt key derivation (`apps/server/src/shared/utils/crypto.util.ts`).
12. **MCP Human-in-the-Loop:** All MCP mutation operations require human approval before execution (`apps/mcp-server-*/src/tools/mutation-tools.ts`).
13. **Helmet Headers:** Security headers enabled via Helmet (`apps/server/src/main.ts:20-23`).
14. **Gateway Auth:** Internal gateway adapter uses timing-safe secret comparison (`gateway/src/channels/internal.adapter.ts:34-36`).
15. **Pagination Limits:** Global `PaginationInterceptor` caps `skip`/`take`/`limit` to prevent DoS (`apps/server/src/shared/interceptors/pagination.interceptor.ts`).
16. **Sensitive Field Redaction in Audit Logs:** Fields like `passwordHash`, `apiKey`, `token` are automatically masked (`apps/server/src/shared/constants/audit-config.ts`).
17. **Database Credentials Masked in Gateway Logs:** `gateway/src/main.ts:12` uses regex to mask credentials in the database URL before logging.
18. **`.env` Files Gitignored:** The `.gitignore` properly excludes `.env`, `.env.local`, and `.env.*.local`.
19. **No Dynamic Code Execution:** No usage of dangerous dynamic code execution patterns found in server source code.

---

## Remediation Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| P0 - Immediate | FINDING-09: CORS + credentials misconfiguration | Low |
| P0 - Immediate | FINDING-07: Stored XSS on policy content | Low |
| P1 - This Sprint | FINDING-01: No RBAC system | Medium |
| P1 - This Sprint | FINDING-02: Missing tenant isolation (evidence) | Medium |
| P1 - This Sprint | FINDING-05: Weak default secrets | Low |
| P1 - This Sprint | FINDING-16: PII in error logs | Low |
| P2 - Next Sprint | FINDING-03: Migration endpoints unprotected | Low |
| P2 - Next Sprint | FINDING-04: Gateway config lacks authz | Low |
| P2 - Next Sprint | FINDING-11: Cookie Secure default false | Low |
| P2 - Next Sprint | FINDING-12: No account lockout | Medium |
| P2 - Next Sprint | FINDING-13: Refresh token not rotated | Medium |
| P3 - Backlog | FINDING-06: Legacy hardcoded salt | Low |
| P3 - Backlog | FINDING-10: CSP disabled | Low |
| P3 - Backlog | FINDING-14: Bootstrap admin on every login | Low |

---

## Methodology Notes

This audit was performed via static source code analysis. The following areas were examined:
- All TypeScript files in `apps/server/src/`, `apps/web/src/`, `gateway/src/`, and `apps/mcp-server-*/src/`
- Configuration files: `docker-compose.yml`, `.env.example`, `Caddyfile`, `.gitignore`
- Searched for injection patterns: `$queryRaw`, `$executeRaw`, unsafe HTML rendering, `innerHTML`, `exec`, `spawn`, `fs.readFile`, `password`, `secret`, `token`, `@Public`, `@Roles`, `organisationId`, `console.error`

No dynamic testing, penetration testing, or dependency version analysis was performed. Findings should be validated with runtime testing before remediation.
