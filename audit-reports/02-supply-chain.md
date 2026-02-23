## DEEP AUDIT: DEPENDENCY PINNING & SUPPLY CHAIN SECURITY

### SUMMARY TABLE: Package.json Analysis

| Package | Location | Total Deps | Pinned Exact | Caret (^) | Tilde (~) | Postinstall Script |
|---------|----------|-----------|--------------|-----------|-----------|-------------------|
| server | apps/server/ | 26 | 26 (100%) | 0 | 0 | None |
| web | apps/web/ | 19 | 19 (100%) | 0 | 0 | None |
| gateway | gateway/ | 14 | 0 (0%) | 14 (100%) | 0 | YES - File system |
| mcp-audits | apps/mcp-server-audits/ | 7 | 7 (100%) | 0 | 0 | YES - File system |
| mcp-controls | apps/mcp-server-controls/ | 7 | 7 (100%) | 0 | 0 | YES - File system |
| mcp-evidence | apps/mcp-server-evidence/ | 7 | 7 (100%) | 0 | 0 | YES - File system |
| mcp-incidents | apps/mcp-server-incidents/ | 7 | 7 (100%) | 0 | 0 | YES - File system |
| mcp-itsm | apps/mcp-server-itsm/ | 7 | 7 (100%) | 0 | 0 | YES - File system |
| mcp-organisation | apps/mcp-server-organisation/ | 7 | 7 (100%) | 0 | 0 | YES - File system |
| mcp-policies | apps/mcp-server-policies/ | 7 | 7 (100%) | 0 | 0 | YES - File system |
| mcp-risks | apps/mcp-server-risks/ | 7 | 7 (100%) | 0 | 0 | YES - File system |

---

### 1. VERSION PINNING ANALYSIS

#### Excellent (Server & Web Applications)
- **apps/server**: ALL 26 dependencies use exact pinning (e.g., `"@nestjs/common": "11.1.11"`)
- **apps/web**: ALL 19 dependencies use exact pinning (e.g., `"react": "18.3.1"`)

#### Critical Risk (Gateway Application)
- **gateway**: ALL 14 dependencies use caret ranges (`^`):
  - `"@anthropic-ai/claude-agent-sdk": "^0.2.42"` - Allows 0.3.x, 0.4.x, etc.
  - `"@anthropic-ai/sdk": "^0.74.0"` - Allows up to 0.999.x
  - `"discord.js": "^14.25.1"` - Allows up to 14.999.x
  - `"fastify": "^5.2.1"` - Allows up to 5.999.x
  - `"pino": "^9.6.0"` - Allows up to 9.999.x
  - `"yaml": "^2.7.0"` - Allows up to 2.999.x
  - `"zod": "^3.23.8"` - Allows up to 3.999.x

#### Moderate (MCP Servers)
- **All 8 MCP servers**: Use exact pinning for dependencies, but with potential version mismatches:
  - mcp-organisation has DIFFERENT versions than others:
    - `@prisma/client: 5.22.0` vs `5.19.1` in other servers
    - `@types/node: 25.3.0` vs `20.19.33` in other servers
    - `tsx: 4.19.4` vs `4.21.0` in other servers
    - `typescript: 5.7.3` vs `5.5.4` in other servers

---

### 2. POSTINSTALL SCRIPTS ANALYSIS

**9 packages have postinstall scripts** - All are file system operations for Prisma client linking:

#### Gateway (HIGH RISK)
```json
"postinstall": "rm -rf node_modules/.prisma/client node_modules/@prisma/client &&
mkdir -p node_modules/.prisma &&
ln -s ../../../apps/server/node_modules/.prisma/client node_modules/.prisma/client &&
ln -s ../../../apps/server/node_modules/@prisma/client node_modules/@prisma/client"
```
**Risk**: Uses `rm -rf` with glob patterns - potential for data loss if paths are wrong

#### MCP Servers (MODERATE RISK)
```json
"postinstall": "node -e \"const fs=require('fs');const src='../server/node_modules/.prisma';
const dst='node_modules/.prisma';if(fs.existsSync(src)&&!fs.existsSync(dst)){
fs.mkdirSync('node_modules',{recursive:true});
fs.symlinkSync(require('path').resolve(src),dst)}\""
```
**Risk**: Inline Node.js code in JSON - harder to audit, but safer than shell

#### mcp-organisation (DIFFERENT PATTERN)
```json
"postinstall": "test -d ../server/node_modules/.prisma &&
ln -sfn ../../server/node_modules/.prisma node_modules/.prisma || true"
```
**Risk**: Uses `ln -sfn` (force symlink) - could overwrite if file exists

---

### 3. LOCK FILES COMMITTED

**Status**: YES - All 11 package-lock.json files ARE COMMITTED to git
- Initial commit (7599e44) includes all lock files
- Current status shows modifications: `M apps/server/package-lock.json`, `M apps/web/package-lock.json`
- **Positive**: Lock files ensure deterministic builds
- **Note**: `.gitignore` does NOT explicitly exclude lock files

---

### 4. CI/CD SECURITY CONFIGURATION

#### npm ci (Correct)
- Used in `.github/workflows/ci.yml` for all installations
- Uses `npm ci` instead of `npm install` - safer for CI/CD

#### Audit Configuration
- **NO `npm audit` or `npm audit fix` in CI pipeline**
- **NO Dependabot configuration** (no `.dependabot/config.yml`)
- **NO Renovate configuration** (no `renovate.json`)
- **NO `--ignore-scripts` flags** in CI (uses npm default behavior)

#### Recent Security Activity
- Commit `2bdf008`: "Fix security vulnerabilities from scan"
  - Path traversal fixes
  - Hardcoded encryption salt vulnerability
  - Pagination DoS protection
  - Application-level fixes (NOT dependency updates)

---

### 5. SPECIFIC SECURITY CONCERNS

#### A. Gateway Package - Caret Pinning Risk
**Worst unpinned dependencies** (by security relevance):

| Package | Current | Risk | Impact |
|---------|---------|------|--------|
| `zod@^3.23.8` | May pull up to 3.999.x | Input validation framework | Could break schema validation |
| `fastify@^5.2.1` | May pull up to 5.999.x | Web framework | HTTP handling changes |
| `@anthropic-ai/sdk@^0.74.0` | May pull up to 0.999.x | AI API client | Breaking API changes |
| `@slack/bolt@^4.6.0` | May pull up to 4.999.x | Slack integration | Integration failures |
| `discord.js@^14.25.1` | May pull up to 14.999.x | Discord API client | Discord integration issues |

#### B. MCP Server Version Drift
`mcp-organisation` uses DIFFERENT versions than all other MCP servers:
- Could cause subtle bugs in Prisma client interactions
- Different TypeScript versions may produce different output
- Inconsistent @types/node versions across monorepo

---

### 6. SUPPLY CHAIN ATTACK VECTORS

#### Present:
1. **Postinstall scripts** (9 packages) - Scripts execute during `npm install`
   - Could be compromised if upstream package is hijacked
   - Filesystem manipulation increases attack surface

2. **Caret versioning in gateway** - Allows automatic updates to major versions
   - No control over what gets installed
   - Transitive dependencies can introduce vulnerabilities

3. **No audit automation** - Manual audits only
   - Vulnerabilities discovered post-publication may not be caught quickly
   - No continuous monitoring

#### Absent (Good):
1. No `npm-scripts` field manipulation
2. No `preinstall`/`prepare` scripts (except `postinstall`)
3. No GitHub Actions using `npm install` (uses `npm ci`)
4. No commits ignoring lock files

---

### 7. LOCK FILE STATUS

| File | Committed | Current Status |
|------|-----------|-----------------|
| apps/server/package-lock.json | YES (7599e44) | MODIFIED |
| apps/web/package-lock.json | YES (7599e44) | MODIFIED |
| apps/mcp-server-audits/package-lock.json | YES (7599e44) | No changes |
| apps/mcp-server-controls/package-lock.json | YES (7599e44) | No changes |
| apps/mcp-server-evidence/package-lock.json | YES (7599e44) | No changes |
| apps/mcp-server-incidents/package-lock.json | YES (7599e44) | No changes |
| apps/mcp-server-itsm/package-lock.json | YES (7599e44) | No changes |
| apps/mcp-server-organisation/package-lock.json | YES (7599e44) | No changes |
| apps/mcp-server-policies/package-lock.json | YES (7599e44) | No changes |
| apps/mcp-server-risks/package-lock.json | YES (7599e44) | No changes |
| gateway/package-lock.json | YES (7599e44) | No changes |

---

### 8. CONFIGURATION FILES

| Type | Status | Finding |
|------|--------|---------|
| .npmrc | NOT FOUND | No npm security configuration |
| .yarnrc | NOT FOUND | Not using Yarn |
| renovate.json | NOT FOUND | No automated dependency updates |
| .dependabot | NOT FOUND | No Dependabot |
| Audit in CI | NOT FOUND | No `npm audit` in GitHub Actions |

---

## OVERALL RISK ASSESSMENT

### By Severity:

| Severity | Finding | Affected | Mitigation |
|----------|---------|----------|------------|
| **CRITICAL** | Gateway uses caret versioning (`^`) on 14 critical deps | gateway/ | Pin all to exact versions |
| **HIGH** | No npm audit in CI pipeline | All packages | Add `npm audit` step to CI |
| **HIGH** | postinstall scripts with `rm -rf` glob | gateway/ | Use safer file operations or remove |
| **MEDIUM** | Version drift in mcp-organisation | 8 MCP servers | Align versions with others |
| **MEDIUM** | No dependency update automation | All packages | Implement Dependabot or Renovate |
| **LOW** | Postinstall scripts present | 9 packages | Document and monitor changes |

---

## FINAL GRADE: **B- (FAIR)**

### Breakdown:
- **Version Pinning**: B+ (10/11 packages use exact pinning, but gateway is critical risk)
- **Lock Files**: A (All committed, deterministic builds)
- **CI Security**: C+ (Uses npm ci, but no audit automation)
- **Postinstall Scripts**: B- (Necessary but risky, especially gateway)
- **Dependency Management**: D (No automation, version drift, no audit)

### Key Recommendations:

1. **URGENT**: Change gateway from caret (`^`) to exact pinning for all 14 dependencies
2. Add `npm audit --audit-level=moderate` to GitHub Actions CI
3. Replace `rm -rf` in gateway postinstall with safer Node.js operations
4. Align mcp-organisation versions with other MCP servers
5. Implement Dependabot or Renovate for automated dependency updates
6. Add `.npmrc` with security settings: `audit-level=moderate`, `engine-strict=true`
7. Document postinstall scripts and their security rationale
8. Consider using `npm ci --audit-level=moderate` in CI/CD
