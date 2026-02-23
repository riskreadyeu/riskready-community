# Audit 05 -- Testing Coverage & Quality

**Standard:** Trail of Bits -- Building Secure Software
**Auditor:** Claude Opus 4.6
**Date:** 2026-02-22
**Scope:** All test files, source files, CI configuration, and test infrastructure in `riskready-community`

---

## Executive Summary

The riskready-community project has **36 test files** across four workspaces containing approximately **15,944 lines of test code**. Test quality where tests exist is **good to excellent** -- services are tested with proper mock isolation, error paths, edge cases, and behavioral assertions. However, coverage is **severely incomplete**: only **23 of 82 server services** have tests (28%), **zero of 67 controllers** are tested, the authentication module is entirely untested, and the web frontend has no unit tests. The CI pipeline runs tests but does **not enforce coverage thresholds**, meaning coverage can silently regress.

| Metric | Value |
|---|---|
| Total test files | 36 |
| Total test lines | ~15,944 |
| Server services tested | 23 / 82 (28%) |
| Server controllers tested | 0 / 67 (0%) |
| Gateway source files with tests | 7 / 22 (32%) |
| MCP servers with tests | 8 / 8 (100% -- registration-only) |
| Web unit tests | 0 |
| Web E2E tests | 3 |
| Coverage gating in CI | No |
| **Overall Grade** | **D+** |

---

## 1. Test Inventory

### 1.1 Server Tests (20 files, ~13,519 lines) -- Jest + ts-jest

| # | File | Lines | Quality | Notes |
|---|---|---|---|---|
| 1 | `src/risks/services/risk-calculation.service.spec.ts` | ~693 | Excellent | Weighted factors, zones, cascade recalc, event emission |
| 2 | `src/risks/services/tolerance-engine.service.spec.ts` | ~448 | Excellent | `it.each` for thresholds, stale evaluations, error resilience |
| 3 | `src/risks/services/risk-scenario.service.spec.ts` | ~573 | Good | CRUD, BIRT categories, weighted impact, cascade delete |
| 4 | `src/risks/integration/risk-scenario-flow.integration.spec.ts` | ~325 | **DEAD CODE** | `describe.skip` -- every test is `expect(true).toBe(true)` |
| 5 | `src/controls/services/control.service.spec.ts` | ~287 | Good | Effectiveness calc, rating thresholds, batch operations |
| 6 | `src/prisma/prisma-audit.middleware.spec.ts` | ~103 | Good | Sensitive field masking, non-blocking audit, model exclusion |
| 7 | `src/shared/context/request-context.spec.ts` | ~50 | Good | AsyncLocalStorage isolation between concurrent runs |
| 8 | `src/shared/constants/audit-config.spec.ts` | ~59 | Good | Sensitive field detection, data masking |
| 9 | `src/policies/services/policy-document.service.spec.ts` | ~1,193 | Excellent | Pagination, hierarchy, stats, 9 document types, audit logging |
| 10 | `src/policies/services/approval-workflow.service.spec.ts` | ~939 | Excellent | Full lifecycle, delegation, 6 approval levels |
| 11 | `src/policies/services/change-request.service.spec.ts` | ~1,023 | Excellent | Full status lifecycle, impact assessment, sequential IDs |
| 12 | `src/policies/services/document-exception.service.spec.ts` | ~889 | Excellent | Approve/activate/revoke/close, auto-expire, review frequencies |
| 13 | `src/policies/services/document-review.service.spec.ts` | ~929 | Excellent | 8 review frequencies, all outcomes, audit logging |
| 14 | `src/policies/services/acknowledgment.service.spec.ts` | ~915 | Excellent | Upsert, 3 acknowledgment methods, bulk reminders, stats |
| 15 | `src/policies/services/document-section.service.spec.ts` | ~771 | Good | Sections, definitions, process steps, RACI matrix, reorder |
| 16 | `src/policies/services/document-mapping.service.spec.ts` | ~866 | Good | Control/risk/document mappings, coverage report, gap analysis |
| 17 | `src/policies/services/document-attachment.service.spec.ts` | ~725 | Good | MIME validation, checksum, secure filenames, size limits |
| 18 | `src/policies/services/policy-dashboard.service.spec.ts` | ~720 | Good | Dashboard stats, compliance scoring, parallel query verification |
| 19 | `src/policies/services/document-version.service.spec.ts` | ~836 | Good | Major/minor versioning, diff, rollback, audit logging |
| 20 | `src/policies/services/policy-audit.service.spec.ts` | ~1,177 | Good | All 10 audit actions, org-wide log, export, activity stats |

### 1.2 Gateway Tests (8 files, ~714 lines) -- Vitest

| # | File | Lines | Quality | Notes |
|---|---|---|---|---|
| 1 | `src/__tests__/integration.test.ts` | ~95 | Good | Real HTTP server, dispatch/health/cancel endpoints |
| 2 | `src/agent/__tests__/skill-registry.test.ts` | ~60 | Good | YAML loading, tag/capability lookup |
| 3 | `src/memory/__tests__/memory.service.test.ts` | ~55 | Good | Store, recall, cleanup with Prisma mock |
| 4 | `src/queue/__tests__/lane-queue.test.ts` | ~162 | Excellent | Serialization, parallelism, overflow, AbortSignal cancel |
| 5 | `src/router/__tests__/router.test.ts` | ~60 | Good | Keyword routing, explicit @skill, word boundaries |
| 6 | `src/run/__tests__/run-manager.test.ts` | ~104 | Good | Event replay, late subscribe, auto-cleanup, fake timers |
| 7 | `src/agent/__tests__/block-extractor.test.ts` | ~42 | Good | Tool result to structured block extraction |
| 8 | `src/channels/__tests__/internal.adapter.test.ts` | ~116 | Good | HTTP dispatch, validation, secret auth (401/200) |

### 1.3 MCP Server Tests (8 files, ~599 lines) -- Vitest

Each of the 8 MCP servers has a single `mutation-tools.test.ts` that verifies:
- `registerMutationTools` is a function
- It does not throw when called
- It registers all expected tool names on the server
- The correct total tool count is registered

**These are registration smoke tests only** -- they do not invoke any tool handler or verify behavior.

| Server | File | Tools Verified |
|---|---|---|
| controls | `src/tools/mutation-tools.test.ts` | 36 tools |
| risks | `src/tools/mutation-tools.test.ts` | varies |
| itsm | `src/tools/mutation-tools.test.ts` | varies |
| audits | `src/tools/mutation-tools.test.ts` | varies |
| incidents | `src/tools/mutation-tools.test.ts` | varies |
| evidence | `src/tools/mutation-tools.test.ts` | varies |
| policies | `src/tools/mutation-tools.test.ts` | varies |
| organisation | `src/tools/mutation-tools.test.ts` | varies |

### 1.4 Web E2E Tests (3 files, ~1,112 lines) -- Playwright

| # | File | Lines | Notes |
|---|---|---|---|
| 1 | `e2e/smoke-api.spec.ts` | ~280 | Hits all route groups, checks status < 500 (not < 400). Some marked `test.fixme`. |
| 2 | `e2e/smoke-pages.spec.ts` | ~260 | Loads ~40 pages, checks for ErrorBoundary and JS exceptions. |
| 3 | `e2e/risk-scenario-detail.spec.ts` | ~570 | Detailed UI tests for scenario detail page. |

### 1.5 Web Unit Tests

**None.** Zero unit tests exist for the 372 web source files (components, hooks, pages, API clients).

---

## 2. Test Framework Assessment

### 2.1 Framework Choices

| Workspace | Framework | ToB Recommendation | Status |
|---|---|---|---|
| Server (`apps/server`) | Jest 29 + ts-jest | Vitest preferred | Non-compliant |
| Gateway (`gateway`) | Vitest 3 | Vitest | Compliant |
| MCP Servers (x8) | Vitest | Vitest | Compliant |
| Web E2E (`apps/web`) | Playwright | Playwright | Compliant |
| Web Unit | None | Vitest + Testing Library | Missing entirely |

**Finding:** The server uses Jest with ts-jest for TypeScript compilation, which is slower than SWC-based alternatives. The project already uses `@swc/core` for production builds but not for test transforms. This creates a split toolchain (SWC for builds, TSC for tests) that slows CI and creates subtle behavior differences.

### 2.2 Configuration Issues

**Server `jest.config.js`:**
- Coverage collection excludes `src/prisma/**`, which means `prisma.service.ts` and `prisma-audit.middleware.ts` are excluded from coverage reports even though tests exist for the middleware.
- `testTimeout: 30000` (30 seconds) is generous; slow tests hide under this threshold.
- No `coverageThreshold` configured -- coverage can decline silently.

**CI Pipeline (`.github/workflows/ci.yml`):**
- Runs `npm test` for server (Jest) and `npx vitest run` for MCP servers.
- Does **not** run gateway tests (`gateway` has no CI step).
- Does **not** run E2E tests.
- Does **not** collect or enforce coverage.
- MCP server test step runs `npx vitest run` which will pass with 0 tests (vitest exits 0 when no tests match unless configured otherwise).

---

## 3. Coverage Gap Analysis

### 3.1 CRITICAL -- Security-Sensitive Modules with Zero Tests

| Module | Files | Importance | Risk |
|---|---|---|---|
| **Auth** (`src/auth/`) | `auth.service.ts`, `auth.controller.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`, `public.decorator.ts` | **CRITICAL** | Authentication bypass, token validation, password handling |
| **Shared Guards** (`src/shared/guards/`) | `resource-owner.guard.ts`, `index.ts` | **CRITICAL** | Authorization bypass, IDOR vulnerabilities |
| **Shared Pipes** (`src/shared/pipes/`) | `sanitize.pipe.ts` | **HIGH** | XSS injection if sanitization is flawed |
| **Shared Interceptors** (`src/shared/interceptors/`) | `enrich-context.interceptor.ts` | **HIGH** | Context injection, tenant isolation failures |

### 3.2 HIGH -- Business Logic Modules with Zero Tests

| Module | Service Count | Controller Count | Test Files |
|---|---|---|---|
| Organisation | 21 services | 19 controllers | 0 |
| ITSM | 8 services | 8 controllers | 0 |
| Incidents | 3 services | 4 controllers | 0 |
| Evidence | 4 services | 4 controllers | 0 |
| Audits | 1 service | 1 controller | 0 |
| Dashboard | 1 service | 1 controller | 0 |
| MCP Approval | 2 services | 1 controller | 0 |
| Gateway Config | 1 service | 1 controller | 0 |

### 3.3 HIGH -- Controllers (0% Tested)

All **67 server controllers** have zero tests. Controllers handle:
- Request validation (DTO parsing, parameter extraction)
- Authorization enforcement (guard composition)
- Response shaping (status codes, pagination headers)
- Error translation (service exceptions to HTTP responses)

This is the single largest structural gap. In the Trail of Bits model, controllers form the API boundary where injection, authorization, and input validation bugs are most commonly introduced.

### 3.4 MEDIUM -- Partially Tested Modules

| Module | Services Tested | Services Untested |
|---|---|---|
| Risks | 3 (calculation, tolerance, scenario) | 9 (risk.service, kri.service, rts.service, treatment-plan.service, risk-event-bus.service, risk-audit.service, risk-export.service, control-risk-integration.service, scenario-entity-resolver.service, treatment-history.service, treatment-notification.service) |
| Controls | 1 (control.service) | 6 (assessment.service, assessment-test.service, control-reporting.service, gap-analysis.service, scope-item.service, soa.service, soa-entry.service) |
| Policies | 11 (all dashboard/lifecycle) | 2 (policy-evidence-collector.service, policy-scheduler.service) |

### 3.5 MEDIUM -- Gateway Untested Components

| Source File | Test | Notes |
|---|---|---|
| `agent/agent-runner.ts` | None | Core AI agent loop -- most complex file in gateway |
| `agent/system-prompt.ts` | None | Prompt construction |
| `channels/discord.adapter.ts` | None | Discord integration |
| `channels/slack.adapter.ts` | None | Slack integration |
| `gateway.ts` | None | Top-level orchestrator |
| `config.ts` | None | Configuration loading |
| `db-config.ts` | None | Database configuration |
| `prisma.ts` | None | Prisma client singleton |
| `logger.ts` | None | Logger setup |
| `memory/distiller.ts` | None | Memory distillation logic |
| `memory/search.service.ts` | None | Semantic search |
| `channels/types.ts` | None | Type definitions (less critical) |
| `channels/channel.interface.ts` | None | Interface (less critical) |
| `queue/types.ts` | None | Type definitions (less critical) |

### 3.6 LOW -- MCP Server Tool Handlers

Each MCP server has 5-8 tool modules containing dozens of tool handlers. Only the `mutation-tools` module in each has a registration smoke test. The read-only tool modules (`control-tools.ts`, `analysis-tools.ts`, etc.) and their actual handler logic have no tests at all.

**Total MCP tool modules without behavioral tests:** ~37 files across 8 servers.

### 3.7 Web Frontend -- Complete Absence

**372 source files** (components, pages, hooks, API clients) have zero unit tests. No testing library (`@testing-library/react`, `vitest`, etc.) is in `devDependencies`. The E2E tests provide smoke-level coverage only.

---

## 4. Test Quality Assessment

### 4.1 Strengths (Where Tests Exist)

**Behavioral Testing:** Tests assert on outcomes rather than implementation details. Example from `risk-calculation.service.spec.ts`:
```typescript
// Tests the BEHAVIOR (zone determination) not the implementation
expect(result.inherentZone).toBe('HIGH');
expect(result.inherentScore).toBe(expectedScore);
```

**Proper Mock Boundaries:** All server tests mock `PrismaService` at the database boundary. No tests mock internal service methods or private functions. This is the correct pattern per ToB guidelines.

**Error Path Coverage:** Tests consistently cover:
- `NotFoundException` for missing resources
- `BadRequestException` for invalid input
- `ConflictException` for duplicate resources
- Edge cases (empty arrays, null values, zero counts, boundary conditions)

**Parametric Testing:** `tolerance-engine.service.spec.ts` uses `it.each` to test all 5 tolerance levels systematically:
```typescript
it.each([
  ['VERY_LOW', 1, 3],
  ['LOW', 4, 6],
  ['MEDIUM', 7, 9],
  ['HIGH', 10, 12],
  ['VERY_HIGH', 13, 15],
])('derives threshold for %s tolerance level', ...)
```

**Audit Logging Verification:** Multiple tests verify that audit log entries are created with correct previous/new values, demonstrating security-relevant behavior testing.

**Transaction Testing:** Tests verify `$transaction` usage for operations requiring atomicity (reorder, cascade operations).

### 4.2 Weaknesses

**Dead Code in CI:** `risk-scenario-flow.integration.spec.ts` uses `describe.skip` and contains only `expect(true).toBe(true)` placeholders. This file runs in CI (Jest still parses it) but provides zero coverage. It creates a false sense that integration tests exist.

**No Negative Security Tests:** No tests verify:
- SQL injection resistance
- XSS payload handling through `sanitize.pipe.ts`
- JWT token expiry, tampering, or algorithm confusion
- Rate limiting behavior
- CORS enforcement
- Cookie security attributes

**No Concurrency Tests (Server):** The request-context test verifies AsyncLocalStorage isolation, but no tests verify:
- Race conditions in sequential ID generation (`change-request.service.ts` generates IDs like `CR-2024-0001`)
- Concurrent writes to the same resource
- Transaction isolation under load

**Over-Reliance on Mock Return Values:** Some tests pre-configure mock return values that exactly match what the service returns, making the test a tautology. Example pattern:
```typescript
mockPrisma.findMany.mockResolvedValue(expectedResult);
const result = await service.findAll();
expect(result).toEqual(expectedResult); // trivially true
```
This verifies the service calls Prisma and returns the result, but not that it transforms, filters, or validates the data correctly. The policy tests are better at this -- they verify computed fields, not just passthrough.

**No Snapshot Tests:** Complex JSON response shapes (dashboard stats, compliance reports, gap analyses) would benefit from snapshot testing to catch accidental structural changes.

**No Performance Assertions:** No tests verify query efficiency, response time budgets, or memory consumption.

### 4.3 MCP Server Tests -- Shallow

The mutation-tools tests verify that tool registration does not throw and that the correct tool names are registered. They do **not**:
- Invoke any tool handler
- Verify input validation (Zod schemas)
- Test Prisma query construction
- Verify the `mcpPendingAction` approval flow
- Test error handling within handlers

---

## 5. CI/CD Test Wiring

### 5.1 Current Pipeline (`.github/workflows/ci.yml`)

```
build job:
  1. Install server deps
  2. TypeScript type check (server)
  3. Build server
  4. Run server tests (Jest)          <-- Only runs server unit tests
  5. Install web deps
  6. TypeScript type check (web)
  7. Build web                        <-- No web tests

mcp-servers job (matrix: 8 servers):
  1. Install server deps (for Prisma)
  2. Install MCP server deps
  3. TypeScript type check
  4. Run tests (vitest run)           <-- Only mutation-tools smoke tests
```

### 5.2 Missing from CI

| Item | Impact |
|---|---|
| Gateway tests not run | 8 test files, ~714 lines never executed in CI |
| E2E tests not run | 3 Playwright specs never executed in CI |
| Coverage collection | No `--coverage` flag, no coverage upload |
| Coverage thresholds | No minimum coverage enforcement |
| Test result reporting | No JUnit XML or similar for PR annotations |
| Flaky test detection | No retry mechanism or flake tracking |

---

## 6. Recommendations

### Priority 1 -- CRITICAL (Security)

| # | Action | Effort | Impact |
|---|---|---|---|
| **R1** | Write tests for `auth.service.ts` and `jwt.strategy.ts` covering token generation, validation, expiry, and password hashing | 2-3 days | Prevents auth bypass regressions |
| **R2** | Write tests for `resource-owner.guard.ts` covering IDOR scenarios | 1 day | Prevents authorization bypass |
| **R3** | Write tests for `sanitize.pipe.ts` with XSS payloads from OWASP | 1 day | Prevents XSS injection |
| **R4** | Delete or implement `risk-scenario-flow.integration.spec.ts` -- dead test code creates false confidence | 1 hour | Removes misleading test |

### Priority 2 -- HIGH (Coverage Foundation)

| # | Action | Effort | Impact |
|---|---|---|---|
| **R5** | Add coverage thresholds to Jest config: `coverageThreshold: { global: { lines: 40, branches: 30 } }` and increase over time | 1 hour | Prevents silent coverage regression |
| **R6** | Add gateway test step to CI pipeline | 30 min | 714 lines of tests now run in CI |
| **R7** | Add E2E test step to CI (or nightly job) | 2 hours | Catches page-load regressions |
| **R8** | Write controller tests for auth, risk-scoring, and risk-scenario controllers as templates | 2-3 days | Establishes controller testing pattern |
| **R9** | Add behavioral tests to MCP server mutation tools (at least test one tool handler end-to-end per server) | 3-4 days | Validates AI tool chain correctness |

### Priority 3 -- MEDIUM (Quality Improvement)

| # | Action | Effort | Impact |
|---|---|---|---|
| **R10** | Migrate server from Jest to Vitest for unified toolchain | 2-3 days | Faster tests, single framework |
| **R11** | Use `@swc/jest` or migrate to Vitest with SWC for faster test transforms | 2 hours | ~3-5x test speed improvement |
| **R12** | Add `vitest` + `@testing-library/react` to `apps/web` and write unit tests for hooks (`useAsync`, `useCurrentUser`) and API clients | 3-5 days | First web unit test coverage |
| **R13** | Write tests for Organisation module services (highest file count: 21 services) | 5-7 days | Major coverage increase |
| **R14** | Write tests for ITSM module services (8 services) | 3-4 days | Covers asset/change management logic |
| **R15** | Write tests for `agent-runner.ts` (gateway) -- the core AI agent loop | 2-3 days | Most complex untested component |

### Priority 4 -- LOW (Hardening)

| # | Action | Effort | Impact |
|---|---|---|---|
| **R16** | Add snapshot tests for dashboard stat response shapes | 1 day | Catches structural regressions |
| **R17** | Add concurrency tests for sequential ID generators | 1 day | Prevents duplicate IDs under load |
| **R18** | Configure vitest in MCP servers to fail on zero tests (or remove vitest config to avoid false positive) | 30 min | Honest CI results |
| **R19** | Add test coverage badge to repository README | 30 min | Visibility into coverage state |
| **R20** | Implement contract tests between server API and web API clients | 3-5 days | Prevents API/client drift |

---

## 7. Detailed Statistics

### 7.1 File Counts

| Workspace | Source Files | Test Files | Test File Ratio |
|---|---|---|---|
| Server (`apps/server`) | 212 | 20 | 9.4% |
| Gateway (`gateway`) | 22 | 8 | 36.4% |
| MCP Servers (x8) | 77 | 8 | 10.4% |
| Web (`apps/web`) | 372 | 0 (+ 3 E2E) | 0% (0.8% with E2E) |
| **Total** | **683** | **36** (+ 3 E2E) | **5.3%** |

### 7.2 Line Counts

| Workspace | Test Lines |
|---|---|
| Server | ~13,519 |
| Gateway | ~714 |
| MCP Servers | ~599 |
| Web E2E | ~1,112 |
| **Total** | **~15,944** |

### 7.3 Server Service Coverage Breakdown

| Module | Services | Tested | Coverage |
|---|---|---|---|
| Policies | 13 | 11 | 85% |
| Risks | 12 | 3 | 25% |
| Controls | 7 | 1 | 14% |
| Organisation | 21 | 0 | 0% |
| ITSM | 8 | 0 | 0% |
| Evidence | 4 | 0 | 0% |
| Incidents | 3 | 0 | 0% |
| Audits | 1 | 0 | 0% |
| Dashboard | 1 | 0 | 0% |
| Auth | 1 | 0 | 0% |
| MCP Approval | 2 | 0 | 0% |
| Gateway Config | 1 | 0 | 0% |
| Prisma | 1 | 1 | 100% |
| Shared | 2 | 2 | 100% |
| **Total** | **82** | **23** | **28%** |

---

## 8. Overall Grade

### Grade: D+

**Rationale:**

| Criterion | Score | Weight | Notes |
|---|---|---|---|
| Test existence | D | 25% | Only 5.3% of source files have corresponding tests |
| Test quality (where tests exist) | A- | 20% | Excellent behavioral testing, proper mocking, error paths |
| Security-critical coverage | F | 25% | Auth, guards, and sanitization completely untested |
| CI integration | D | 15% | Tests run but no coverage enforcement, gateway omitted |
| Framework and tooling | C+ | 15% | Mixed Jest/Vitest, no coverage thresholds, dead test code |

The project demonstrates that the team **knows how to write good tests** (the policies module is exemplary), but has not applied this discipline broadly. The security-critical modules being entirely untested is the most significant finding and is the primary factor driving the grade down.

**To reach a C:** Implement R1-R6 (auth tests, guard tests, sanitize tests, delete dead code, coverage thresholds, gateway in CI).
**To reach a B:** Additionally implement R8-R9, R12, and R13-R14 (controller tests, MCP behavioral tests, web unit tests, Organisation/ITSM coverage).
**To reach an A:** Full service coverage > 70%, controller coverage > 50%, web unit tests, E2E in CI, coverage thresholds enforced at 60%+.
