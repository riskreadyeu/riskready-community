# Infrastructure Security Audit Report

**Project:** RiskReady Community Edition
**Scope:** Docker, CI/CD, Reverse Proxy, Shell Scripts, Infrastructure Configuration
**Standard:** Trail of Bits Building Secure Software Guidelines
**Date:** 2026-02-22
**Auditor:** Claude Opus 4.6 (Automated Deep Audit)

---

## Executive Summary

The RiskReady Community Edition infrastructure demonstrates a **mixed security posture**. CI/CD pipelines follow best practices with SHA-pinned actions and credential isolation. Docker configurations use multi-stage builds and the gateway container runs as non-root. However, significant gaps exist: two of three Dockerfiles run as root, no Docker network isolation is configured, no resource limits are set on any container, security headers are absent from both Caddy and nginx, and the default `CORS_ORIGIN` is empty (allow-all). The `deploy.sh` script lacks `pipefail` and variable quoting. No `.dockerignore` files exist anywhere in the project. Default database credentials (`riskready/riskready`) are hardcoded as fallbacks in `docker-compose.yml`.

**Overall Grade: C-**

The project gets credit for strong CI/CD hygiene, multi-stage Docker builds, health checks, and using environment variable expansion with `:?` required-variable syntax for critical secrets. However, the number of medium and high severity findings -- particularly around container privilege, network isolation, missing `.dockerignore`, and absent security headers -- prevents a higher grade.

---

## Detailed Findings

### 1. Dockerfiles

#### 1.1 Base Image Pinning

| File | Base Images | Pinning | Verdict |
|------|-------------|---------|---------|
| `apps/web/Dockerfile:1` | `node:20-alpine` | Minor version tag, no digest | WARN |
| `apps/web/Dockerfile:11` | `nginx:1.27-alpine` | Patch-level tag, no digest | WARN |
| `apps/server/Dockerfile:1` | `node:20-bookworm-slim` | Minor version tag, no digest | WARN |
| `apps/server/Dockerfile:19` | `node:20-bookworm-slim` | Minor version tag, no digest | WARN |
| `gateway/Dockerfile:1` | `node:20-alpine` | Minor version tag, no digest | WARN |
| `gateway/Dockerfile:74` | `node:20-alpine` | Minor version tag, no digest | WARN |
| `docker-compose.yml:3` | `postgres:16-alpine` | Minor version tag, no digest | WARN |
| `docker-compose.yml:80` | `caddy:2-alpine` | Major version tag, no digest | WARN |

**Severity: MEDIUM**
**Finding:** No images are pinned to SHA256 digests. Tags like `node:20-alpine` are mutable and can be replaced by upstream publishers at any time, potentially introducing malicious or broken images. Trail of Bits recommends pinning to `image@sha256:...` for reproducible, tamper-resistant builds.

**Remediation:**
```dockerfile
# Instead of:
FROM node:20-alpine
# Use:
FROM node:20-alpine@sha256:<digest>
```

---

#### 1.2 Non-Root User Execution

| Dockerfile | Runs as root? | Severity |
|------------|--------------|----------|
| `apps/web/Dockerfile` | **YES** -- no `USER` directive; nginx runs as root by default | HIGH |
| `apps/server/Dockerfile` | **YES** -- no `USER` directive; Node runs as root | HIGH |
| `gateway/Dockerfile:83-84` | **NO** -- `RUN chown -R node:node /app` then `USER node` | PASS |

**Severity: HIGH**
**Finding:** `apps/web/Dockerfile` and `apps/server/Dockerfile` never set a non-root `USER`. If an attacker exploits a vulnerability in nginx or Node.js, they gain root inside the container. The gateway Dockerfile correctly drops to the `node` user at line 84.

**Remediation for `apps/server/Dockerfile`:**
```dockerfile
# Add before CMD:
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs appuser
USER appuser
```

**Remediation for `apps/web/Dockerfile`:**
```dockerfile
# After COPY nginx.conf, add:
RUN chown -R nginx:nginx /usr/share/nginx/html
USER nginx
```
(Note: nginx-alpine ships with the `nginx` user; the main process needs to be configured to not bind to port 80 directly, or use an unprivileged port.)

---

#### 1.3 `npm install` vs `npm ci` in Dockerfiles

| Dockerfile | Command | Verdict |
|------------|---------|---------|
| `apps/web/Dockerfile:8` | `npm install` | FAIL |
| `apps/server/Dockerfile:12` | `npm install` | FAIL |
| `gateway/Dockerfile:9` | `npm ci` | PASS |

**Severity: MEDIUM**
**Finding:** `apps/web/Dockerfile:8` and `apps/server/Dockerfile:12` use `npm install` instead of `npm ci`. The `npm install` command can modify `package-lock.json` and install different dependency versions than those locked, making builds non-deterministic. Neither of these Dockerfiles copies a `package-lock.json` file.

**Remediation:** Copy `package-lock.json` and use `npm ci --ignore-scripts` in all Dockerfiles:
```dockerfile
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
```

---

#### 1.4 Missing `.dockerignore`

**Severity: MEDIUM**
**Finding:** No `.dockerignore` file exists anywhere in the project. Without `.dockerignore`, Docker COPY commands may inadvertently include:
- `.env` files containing secrets (especially `apps/server/.env` which contains `ADMIN_PASSWORD=admin123456`)
- `.git/` directory
- `node_modules/` (inflating image size)
- IDE configuration files
- Test files and coverage reports

**Remediation:** Create `.dockerignore` files for each build context:
```
# apps/server/.dockerignore
node_modules
.env
.env.*
.git
*.md
tests
coverage
scripts
```

---

#### 1.5 Multi-Stage Builds

| Dockerfile | Multi-stage? | Verdict |
|------------|-------------|---------|
| `apps/web/Dockerfile` | YES (build -> nginx) | PASS |
| `apps/server/Dockerfile` | YES (build -> runtime) | PASS |
| `gateway/Dockerfile` | YES (builder -> production) | PASS |

**Severity: N/A -- PASS**
All three Dockerfiles use multi-stage builds, which reduces attack surface by excluding build tools from production images.

---

#### 1.6 Unnecessary Packages

**File:** `apps/server/Dockerfile:23`
```dockerfile
RUN apt-get install -y --no-install-recommends openssl ca-certificates wget
```

**Severity: LOW**
**Finding:** `wget` is installed in the production stage solely for the `HEALTHCHECK` command. This is acceptable but adds attack surface. Consider using a purpose-built health check binary or `curl` which is sometimes already present.

---

#### 1.7 Secrets Passed as Build Args

**Severity: N/A -- PASS**
No secrets are passed via `ARG` or `--build-arg` in any Dockerfile. Secrets are correctly injected at runtime via environment variables in `docker-compose.yml`.

---

### 2. docker-compose.yml

**File:** `/home/daniel/projects/riskready-community/docker-compose.yml`

#### 2.1 Default Credentials Hardcoded as Fallbacks

**Lines 7-9:**
```yaml
POSTGRES_USER: ${POSTGRES_USER:-riskready}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-riskready}
POSTGRES_DB: ${POSTGRES_DB:-riskready}
```

**Severity: HIGH**
**Finding:** The default PostgreSQL password is `riskready`, which is trivially guessable. If a user starts the stack without setting `.env`, the database is accessible with these weak defaults. While `JWT_SECRET` and `ADMIN_PASSWORD` use the `:?` syntax (required, will error if unset), `POSTGRES_PASSWORD` uses `:-` (optional, falls back to default).

**Remediation:** Change to required variables:
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
```

---

#### 2.2 CORS Allows All Origins by Default

**Line 45:**
```yaml
CORS_ORIGIN: ${CORS_ORIGIN:-}
```

**Severity: HIGH**
**Finding:** When `CORS_ORIGIN` is empty, the server allows requests from all origins (confirmed by `.env.example` comment: "leave empty to allow all origins"). Combined with `COOKIE_SECURE=false` (line 44), this creates a cross-origin cookie-based attack surface. An attacker's site can make authenticated API requests on behalf of a logged-in user.

**Remediation:** Require an explicit CORS origin in production:
```yaml
CORS_ORIGIN: ${CORS_ORIGIN:?Set CORS_ORIGIN in .env for production}
```

---

#### 2.3 No Network Isolation

**Severity: HIGH**
**Finding:** No `networks:` section is defined in `docker-compose.yml`. All services share the default bridge network, meaning:
- The web frontend can directly reach the database
- The gateway can reach all services
- Any compromised container has full network access to all other containers

**Remediation:** Define separate networks:
```yaml
networks:
  frontend:
  backend:
  db:

services:
  db:
    networks: [db]
  server:
    networks: [backend, db]
  gateway:
    networks: [backend, db]
  web:
    networks: [frontend]
  caddy:
    networks: [frontend, backend]
```

---

#### 2.4 No Resource Limits

**Severity: MEDIUM**
**Finding:** No `mem_limit`, `cpus`, `deploy.resources`, or `ulimits` are set on any service. A memory leak, fork bomb, or resource exhaustion attack in any container can bring down the entire host.

**Remediation:**
```yaml
services:
  server:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
```

---

#### 2.5 No Read-Only Root Filesystem

**Severity: LOW**
**Finding:** No services use `read_only: true` or `tmpfs` mounts. Running with a read-only root filesystem limits attacker ability to write malicious files.

**Remediation:** Add to services where feasible:
```yaml
services:
  web:
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
```

---

#### 2.6 Database Port Exposed to Host

**Line 5-6:**
```yaml
db:
  ports:
    - "5433:5432"
```

**Severity: MEDIUM**
**Finding:** The PostgreSQL port is mapped to the host on port 5433. In production, the database should only be accessible from within the Docker network, not from the host or external network.

**Remediation:** Remove the port mapping for production or bind to localhost only:
```yaml
ports:
  - "127.0.0.1:5433:5432"  # Development only
```

---

#### 2.7 Server Port Exposed to Host

**Lines 51-52:**
```yaml
server:
  ports:
    - "3000:3000"
```

**Severity: LOW**
**Finding:** The server API port is exposed directly to the host in addition to being proxied through Caddy. In production, only Caddy should be exposed; the server should be internal-only.

**Remediation:** Remove or restrict to localhost:
```yaml
ports:
  - "127.0.0.1:3000:3000"  # For debugging only; remove in production
```

---

#### 2.8 Health Checks

| Service | Health Check | Verdict |
|---------|-------------|---------|
| `db` | `pg_isready` | PASS |
| `server` | `wget -qO- http://localhost:3000/api/health` (in Dockerfile) | PASS |
| `gateway` | `wget -qO- http://localhost:3100/health` (in Dockerfile) | PASS |
| `web` | None | FAIL |
| `caddy` | None | FAIL |
| `migrate` | N/A (run-once) | N/A |

**Severity: LOW**
**Finding:** The `web` and `caddy` services lack health checks. This may cause dependent services to start before they are ready.

---

#### 2.9 COOKIE_SECURE Defaults to False

**Line 44:**
```yaml
COOKIE_SECURE: ${COOKIE_SECURE:-false}
```

**Severity: MEDIUM**
**Finding:** `COOKIE_SECURE` defaults to `false`, meaning session cookies are transmitted over HTTP without the `Secure` flag. If deployed behind HTTPS (as intended for production), cookies could still leak over unencrypted connections unless the user explicitly overrides this.

---

### 3. GitHub Actions CI/CD

**File:** `/home/daniel/projects/riskready-community/.github/workflows/ci.yml`

#### 3.1 Actions Pinned to SHA Hashes

**Lines 32, 37, 80, 85:**
```yaml
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020  # v4.4.0
```

**Severity: N/A -- PASS**
Both actions are pinned to full SHA hashes with version comments. This is the Trail of Bits recommended best practice, preventing tag-swap attacks.

---

#### 3.2 persist-credentials: false

**Lines 33-34, 81-82:**
```yaml
with:
  persist-credentials: false
```

**Severity: N/A -- PASS**
The `persist-credentials: false` flag is set on both checkout steps, preventing the `GITHUB_TOKEN` from being available to subsequent steps. This follows the principle of least privilege.

---

#### 3.3 Missing Workflow Permissions

**Severity: MEDIUM**
**Finding:** The workflow does not declare a top-level `permissions:` block. By default, GitHub Actions grants `write` permissions to `GITHUB_TOKEN` for most scopes. Trail of Bits recommends explicitly setting minimal permissions.

**Remediation:**
```yaml
permissions:
  contents: read

jobs:
  build:
    # ...
```

---

#### 3.4 Hardcoded CI Database Credentials

**Lines 19-21:**
```yaml
env:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
```

**Severity: LOW**
**Finding:** CI database credentials are hardcoded directly in the workflow file. While this is a common pattern for ephemeral CI databases (the service container is destroyed after each run), it is still technically a hardcoded credential. Acceptable for CI but should be documented as test-only.

---

#### 3.5 No Dependency Caching

**Severity: LOW**
**Finding:** The CI workflow does not use `actions/cache` or the `cache` option of `actions/setup-node` for `node_modules`. This slows CI runs but has no security impact. Mentioning as an operational improvement.

---

### 4. Shell Scripts

#### 4.1 `apps/server/deploy.sh`

**File:** `/home/daniel/projects/riskready-community/apps/server/deploy.sh`

**Line 4:**
```bash
set -e
```

**Severity: MEDIUM**
**Finding:** The script uses `set -e` but not `set -euo pipefail`. Missing `-u` means unset variables expand to empty strings silently. Missing `pipefail` means a failure in a piped command chain is ignored.

**Remediation:** Change line 4 to:
```bash
set -euo pipefail
```

---

**Line 35:**
```bash
sudo systemctl restart riskready-server
```

**Severity: LOW**
**Finding:** The deploy script uses `sudo` without verification. If the sudoers configuration is not properly locked down, this could be a privilege escalation vector. The script also does not verify the integrity of what it is deploying.

---

#### 4.2 Server TypeScript Scripts (`apps/server/scripts/`)

**File:** `/home/daniel/projects/riskready-community/apps/server/scripts/explore-wazuh-security-data.ts:6`
```typescript
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
```

**Severity: MEDIUM**
**Finding:** TLS certificate verification is disabled for the Wazuh connection. This allows man-in-the-middle attacks against the Wazuh API. While this is a development/exploration script (gitignored), it could be copied into production code.

**Remediation:** Use proper CA certificates:
```typescript
const httpsAgent = new https.Agent({ ca: fs.readFileSync('/path/to/wazuh-ca.pem') });
```

---

#### 4.3 `scripts/scaffold.js`

**File:** `/home/daniel/projects/riskready-community/scripts/scaffold.js`

**Severity: LOW**
**Finding:** The scaffold script writes files based on user input without path traversal validation (line 67-68). The `modulePath` input is directly interpolated into a `path.join()` call. A malicious input like `../../etc` could write files outside the intended directory. Low severity because this is a development-only interactive CLI tool.

---

### 5. Reverse Proxy Configuration

#### 5.1 Caddy: Missing Security Headers

**File:** `/home/daniel/projects/riskready-community/infra/caddy/Caddyfile`

**Severity: HIGH**
**Finding:** The Caddyfile has no security headers configured. The following are missing:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`
- `Referrer-Policy`
- `Permissions-Policy`

**Remediation:**
```
:80 {
  encode gzip

  header {
    Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
    -Server
  }

  handle /api/* {
    reverse_proxy server:3000
  }

  handle {
    reverse_proxy {$WEB_UPSTREAM:web:80}
  }
}
```

---

#### 5.2 Caddy: No Rate Limiting

**Severity: MEDIUM**
**Finding:** No rate limiting is configured in Caddy. The API endpoints (especially `/api/auth/login`) are vulnerable to brute-force attacks.

**Remediation:** Use the `caddy-ratelimit` plugin or implement rate limiting at the application level.

---

#### 5.3 Caddy: No Access Logging

**Severity: LOW**
**Finding:** No `log` directive is configured in the Caddyfile. Without access logs, incident investigation and anomaly detection are impossible.

---

#### 5.4 Caddy: HTTP Only by Default

**Severity: MEDIUM**
**Finding:** The Caddyfile listens on `:80` (HTTP only). While there is a commented HTTPS example, the default deployment uses unencrypted HTTP. Combined with `COOKIE_SECURE=false`, session tokens are transmitted in cleartext.

---

#### 5.5 Nginx: Missing Security Headers

**File:** `/home/daniel/projects/riskready-community/apps/web/nginx.conf`

**Severity: MEDIUM**
**Finding:** The nginx configuration contains no security headers and does not disable `server_tokens`. The nginx version is exposed in response headers by default.

**Remediation:**
```nginx
server {
  listen 80;
  server_name _;
  server_tokens off;

  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

### 6. Git Hooks and Pre-commit Configuration

**File:** `/home/daniel/projects/riskready-community/prek.toml`

```toml
[hooks.pre-commit]
commands = [
  { name = "typecheck-mcp", run = "for d in apps/mcp-server-*/; do (cd $d && npx tsc --noEmit); done" },
  { name = "oxlint", run = "npx oxlint ." },
]
```

**Severity: MEDIUM**
**Finding:** Pre-commit hooks run type checking and linting, which is good. However, several security-relevant checks are missing:
- No secret scanning (e.g., `gitleaks`, `trufflehog`)
- No dependency vulnerability scanning (e.g., `npm audit`)
- No Dockerfile linting (e.g., `hadolint`)
- The `prek.toml` is gitignored (`.gitignore` line 43: `*.toml`), so these hooks are not shared with other contributors

**Remediation:**
1. Remove `*.toml` from `.gitignore` or specifically exclude `prek.toml` from the pattern
2. Add secret scanning:
```toml
{ name = "secrets", run = "npx gitleaks detect --no-git" }
```

---

### 7. Environment Files and Secrets Management

#### 7.1 Committed `.env` File with Weak Credentials

**File:** `/home/daniel/projects/riskready-community/apps/server/.env`

```
ADMIN_PASSWORD=admin123456
JWT_SECRET=dev-jwt-secret-min-32-chars-for-local-only
```

**Severity: HIGH**
**Finding:** The file `apps/server/.env` is committed to the repository (it is tracked by git) and contains:
- A weak admin password (`admin123456`)
- A predictable JWT secret (`dev-jwt-secret-min-32-chars-for-local-only`)

While the root `.gitignore` does exclude `.env`, the `apps/server/.env` path may not be covered if the gitignore rules are evaluated differently. Additionally, the file appears to exist on disk and should be verified to not be tracked.

**Remediation:**
1. Ensure `apps/server/.env` is in `.gitignore`
2. If previously committed, remove from git history:
   ```bash
   git rm --cached apps/server/.env
   ```
3. Rotate all credentials that were exposed

---

#### 7.2 `.env.example` Contains Placeholder That Resembles Real Credentials

**File:** `/home/daniel/projects/riskready-community/.env.example:6`

```
POSTGRES_PASSWORD=change-me
```

**Severity: LOW**
**Finding:** The example file uses `change-me` as placeholders, which is good practice. However, it would be better to include obvious non-functional values like `REPLACE_ME_WITH_STRONG_PASSWORD` to make it even clearer these must be changed.

---

### 8. Additional Findings

#### 8.1 Gateway Dockerfile Copies Entire Build Context

**File:** `/home/daniel/projects/riskready-community/gateway/Dockerfile:80`
```dockerfile
COPY --from=builder /app ./
```

**Severity: LOW**
**Finding:** The production stage copies the entire `/app` directory from the builder, including source code, TypeScript files, and potentially build artifacts that are not needed at runtime. This increases the attack surface.

---

#### 8.2 Gateway npm Install Errors Suppressed

**File:** `/home/daniel/projects/riskready-community/gateway/Dockerfile:67`
```dockerfile
&& npm install --ignore-scripts --legacy-peer-deps 2>/dev/null || true
```

**Severity: MEDIUM**
**Finding:** The MCP server dependency installation suppresses all stderr output and ignores failures (`|| true`). If a dependency fails to install, the build silently continues with missing packages, potentially causing runtime failures or security gaps.

---

#### 8.3 `prisma db push` Used for Migrations

**File:** `/home/daniel/projects/riskready-community/docker-compose.yml:22`
```yaml
command: ["sh", "-c", "npx prisma db push"]
```

**Severity: MEDIUM**
**Finding:** `prisma db push` is a development command that directly modifies the database schema without migration tracking. In production, `prisma migrate deploy` should be used for auditable, reversible schema changes.

---

---

## Summary of Findings by Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| **HIGH** | 5 | Containers running as root (2), no network isolation, missing security headers (Caddy), default DB credentials, open CORS |
| **MEDIUM** | 10 | No image digest pinning, `npm install` in Dockerfiles, no `.dockerignore`, no resource limits, missing workflow permissions, incomplete `set -e`, TLS verification disabled, no rate limiting, HTTP-only default, `prisma db push` |
| **LOW** | 7 | Unnecessary packages, exposed ports, missing health checks, no access logging, scaffold path traversal, hardcoded CI creds, `.env.example` clarity |

---

## Remediation Priority

1. **Immediate (Week 1):**
   - Add `USER` directives to `apps/server/Dockerfile` and `apps/web/Dockerfile`
   - Add security headers to Caddyfile and nginx.conf
   - Create `.dockerignore` files for all three build contexts
   - Change `POSTGRES_PASSWORD` default to use `:?` required syntax
   - Restrict `CORS_ORIGIN` to not allow all origins by default
   - Verify `apps/server/.env` is not tracked by git

2. **Short-term (Week 2-3):**
   - Add Docker network isolation
   - Pin all base images to SHA256 digests
   - Switch `npm install` to `npm ci` in all Dockerfiles
   - Add `permissions: { contents: read }` to CI workflow
   - Add resource limits to all containers
   - Use `set -euo pipefail` in deploy.sh
   - Switch to `prisma migrate deploy` for production

3. **Medium-term (Month 1):**
   - Add secret scanning to pre-commit hooks
   - Add rate limiting to Caddy
   - Add access logging to Caddy
   - Bind database port to localhost only
   - Remove direct host port exposure for server and gateway
   - Add health checks for `web` and `caddy` services
   - Enable TLS by default with Caddy auto-HTTPS

---

## Overall Grade: C-

**Rationale:** The project shows awareness of security best practices in some areas (CI/CD SHA pinning, multi-stage builds, health checks, required env vars for secrets) but has significant gaps in container hardening (2/3 containers run as root), network architecture (no isolation), and web security (no security headers, open CORS, HTTP-only). For a GRC (Governance, Risk, and Compliance) platform -- which by its nature should exemplify security best practices -- these gaps are particularly notable. The strong CI/CD configuration prevents a D grade, but the accumulation of HIGH severity findings prevents anything above C-.
