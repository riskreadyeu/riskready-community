# Fix CI Pipeline: Prisma Client Symlinks

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all GitHub Actions CI checks pass (build, gateway, 9 MCP servers, CodeQL).

**Architecture:** The monorepo shares one Prisma client generated in `apps/server/`. All MCP servers, `packages/mcp-shared`, and `gateway` need symlinks to it. The root cause of CI failures is that `@prisma/client` npm package creates a default `.prisma/client/` stub during install, and the MCP server postinstall scripts skip symlink creation because they check `!fs.existsSync(dst)`.

**Tech Stack:** Node.js 22, Prisma 5.19.1, TypeScript 5.5.4, GitHub Actions

---

## Root Cause Analysis

### The symlink flow in the monorepo

```
apps/server/           → prisma generate creates real .prisma/client/ with McpActionType etc.
packages/mcp-shared/   → symlinks .prisma/client → ../../apps/server/node_modules/.prisma/client
apps/mcp-server-*/     → symlinks .prisma/client → ../server/node_modules/.prisma/client
gateway/               → symlinks .prisma/client AND @prisma/client → ../../../apps/server/...
```

### Why CI fails

1. `npm ci` in MCP server installs `@prisma/client@5.19.1` from npm
2. This creates `node_modules/.prisma/client/` with a **generic stub** (no schema-specific types)
3. MCP server postinstall checks `!fs.existsSync('node_modules/.prisma')` → **already exists** → skips symlink
4. TypeScript finds the stub types → `McpActionType` not exported → build fails

### Why it works locally

Locally, `npm install` (not `npm ci`) preserves existing node_modules. The symlink was created the first time before `@prisma/client` created its stub, and subsequent installs don't overwrite it.

### Three packages have this bug

| Package | Postinstall | Bug? |
|---------|-------------|------|
| 8 MCP servers | `if(!fs.existsSync(dst))` → conditional symlink | **YES** |
| `mcp-server-organisation` | `ln -sfn` → force symlink | No (but uses relative paths) |
| `packages/mcp-shared` | `if(!fs.existsSync(dst))` → conditional symlink | **YES** |
| `gateway` | `rm -rf` then `ln -s` → force symlink | No |

---

## File Structure

**Files to modify:**
- `apps/mcp-server-controls/package.json` — fix postinstall
- `apps/mcp-server-risks/package.json` — fix postinstall
- `apps/mcp-server-itsm/package.json` — fix postinstall
- `apps/mcp-server-audits/package.json` — fix postinstall
- `apps/mcp-server-incidents/package.json` — fix postinstall
- `apps/mcp-server-evidence/package.json` — fix postinstall
- `apps/mcp-server-policies/package.json` — fix postinstall
- `apps/mcp-server-agent-ops/package.json` — fix postinstall
- `apps/mcp-server-organisation/package.json` — standardize postinstall
- `packages/mcp-shared/package.json` — fix postinstall
- `.github/workflows/ci.yml` — remove manual symlink workarounds (now unnecessary)

---

## Chunk 1: Fix postinstall scripts

### Task 1: Fix all 9 MCP server postinstall scripts

The gateway already has the correct pattern. Standardize all packages to use it:

**Pattern (for MCP servers in `apps/mcp-server-*`):**
```
"postinstall": "rm -rf node_modules/.prisma/client && mkdir -p node_modules/.prisma && test -d ../server/node_modules/.prisma/client && ln -sfn \"$(cd ../server/node_modules/.prisma/client && pwd)\" node_modules/.prisma/client || true"
```

This:
1. Removes existing `.prisma/client` (the npm stub)
2. Creates `.prisma` directory
3. Creates an absolute-path symlink to the server's generated client (using `-sfn` for force)
4. Fails silently if server deps aren't installed yet (`|| true`)

- [ ] **Step 1: Update `apps/mcp-server-controls/package.json`**

Replace the postinstall script with the new pattern.

- [ ] **Step 2: Update `apps/mcp-server-risks/package.json`**

Same pattern.

- [ ] **Step 3: Update `apps/mcp-server-itsm/package.json`**

Same pattern.

- [ ] **Step 4: Update `apps/mcp-server-audits/package.json`**

Same pattern.

- [ ] **Step 5: Update `apps/mcp-server-incidents/package.json`**

Same pattern.

- [ ] **Step 6: Update `apps/mcp-server-evidence/package.json`**

Same pattern.

- [ ] **Step 7: Update `apps/mcp-server-policies/package.json`**

Same pattern.

- [ ] **Step 8: Update `apps/mcp-server-agent-ops/package.json`**

Same pattern.

- [ ] **Step 9: Update `apps/mcp-server-organisation/package.json`**

Standardize to use the same pattern (currently uses a different shell command).

- [ ] **Step 10: Fix `packages/mcp-shared/package.json`**

**Pattern (for mcp-shared, path goes up 2 levels):**
```
"postinstall": "rm -rf node_modules/.prisma/client && mkdir -p node_modules/.prisma && test -d ../../apps/server/node_modules/.prisma/client && ln -sfn \"$(cd ../../apps/server/node_modules/.prisma/client && pwd)\" node_modules/.prisma/client || true"
```

- [ ] **Step 11: Verify locally — run npm install in one MCP server**

```bash
cd apps/mcp-server-risks
rm -rf node_modules
npm install
ls -la node_modules/.prisma/client/  # should be a symlink
npx tsc --noEmit  # should pass with 0 errors
```

- [ ] **Step 12: Verify locally — run npm install in mcp-shared**

```bash
cd packages/mcp-shared
rm -rf node_modules
npm install
ls -la node_modules/.prisma/client/  # should be a symlink
npm run build  # should succeed
```

---

### Task 2: Simplify CI workflow

Now that postinstall scripts properly handle symlinks, we can remove the manual symlink workarounds from CI.

- [ ] **Step 1: Simplify mcp-servers job in `.github/workflows/ci.yml`**

Replace the current multi-step symlink setup:
```yaml
      - name: Install server dependencies (for Prisma client)
        working-directory: apps/server
        run: npm ci

      - name: Generate Prisma client
        working-directory: apps/server
        run: npx prisma generate --schema=prisma/schema

      - name: Install shared package dependencies and link Prisma
        working-directory: packages/mcp-shared
        run: |
          npm ci
          mkdir -p node_modules/.prisma node_modules/@prisma
          rm -rf node_modules/.prisma/client node_modules/@prisma/client
          ln -s "$(cd ../../apps/server/node_modules/.prisma/client && pwd)" node_modules/.prisma/client
          ln -s "$(cd ../../apps/server/node_modules/@prisma/client && pwd)" node_modules/@prisma/client

      - name: Build shared package
        working-directory: packages/mcp-shared
        run: npm run build
```

With the cleaner version:
```yaml
      - name: Install server dependencies and generate Prisma client
        working-directory: apps/server
        run: npm ci && npx prisma generate --schema=prisma/schema

      - name: Install and build shared package
        working-directory: packages/mcp-shared
        run: npm ci && npm run build

      - name: Install MCP server dependencies
        working-directory: apps/mcp-server-${{ matrix.server }}
        run: npm ci
```

The postinstall scripts now handle the symlink creation correctly.

- [ ] **Step 2: Verify CI passes — push and check**

```bash
git add -A
git commit -m "fix(ci): fix Prisma postinstall symlinks — always overwrite npm stub"
git push origin main
# Wait ~3 minutes, then check:
gh run list --repo riskreadyeu/riskready-community --limit 2
```

Expected: All 12 checks pass (build, gateway, 9 MCP servers, CodeQL).

---

## Verification Checklist

- [ ] All 9 MCP servers pass `npx tsc --noEmit` locally
- [ ] `packages/mcp-shared` builds with `npm run build`
- [ ] Gateway passes `npm test` (76 tests)
- [ ] Server passes `npm test` (all tests)
- [ ] CI build job passes
- [ ] CI gateway job passes
- [ ] All 9 CI mcp-servers jobs pass
- [ ] CodeQL passes
