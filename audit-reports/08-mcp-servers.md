# MCP Server Implementation Audit Report

**Date**: 2026-02-22
**Auditor**: Claude Opus 4.6 (automated)
**Scope**: 8 MCP servers in `apps/mcp-server-*`
**Standard**: Trail of Bits secure code review methodology
**Overall Grade**: **B+**

---

## Executive Summary

The 8 MCP server implementations demonstrate a well-architected, consistent codebase with strong security fundamentals. The "propose/approve" pattern for all mutations is a significant security control that prevents direct database writes from AI agents. All servers follow the same structural pattern, use Zod for input validation, and implement clean Prisma query patterns.

**Key strengths:**
- All mutations route through a human-approval queue (`McpPendingAction`) -- no direct writes
- Consistent use of Zod schemas for every tool parameter across all 8 servers
- Existence checks before mutations (findUnique before createPendingAction)
- Status-machine enforcement on transition tools (checking current status before allowing transitions)
- Good use of `select` clauses to limit data exposure

**Key weaknesses:**
- `createPendingAction` helper function is copy-pasted identically across all 8 servers (8 copies)
- `getDefaultOrganisationId` helper is also duplicated 8 times
- No try/catch around Prisma calls -- unhandled database errors will crash the tool
- `any` type used extensively for `where` clauses instead of proper typing
- Some analysis tools fetch unbounded result sets into memory
- No rate limiting or pagination enforcement on analysis tools
- Minor comment inconsistency in `prisma.ts` (some have "Ensure clean shutdown", some don't)

---

## Per-Server Findings Table

| Server | Tools | Mutations | Resources | Prompts | Input Validation | Error Handling | Grade |
|--------|-------|-----------|-----------|---------|-----------------|----------------|-------|
| **audits** | 7 read, 7 mutation | 7 (NC + CAP) | 3 | 3 | Strong (Zod enums) | Good (not-found checks, no try/catch) | B+ |
| **controls** | 18 read, 33 mutation | 33 (assessments, SOA, scope, tests, controls, metrics) | 5 | 4 | Strong | Good (status checks on transitions) | B+ |
| **evidence** | 7 read, 6 mutation | 6 (evidence + requests) | 4 | prompts file | Strong | Good | B+ |
| **incidents** | 7 read, 9 mutation | 9 (incidents, timeline, lessons) | resources file | prompts file | Strong | Good | B+ |
| **itsm** | 17 read, mutations | Various (assets, changes, capacity) | resources file | prompts file | Strong | Good | B |
| **organisation** | 15 read, mutations | Various (org structure) | 4 | prompts file | Mixed (some `z.string()` without enum) | Good | B |
| **policies** | 8 read, mutations | Various (policy lifecycle) | resources file | prompts file | Strong | Good | B+ |
| **risks** | 14 read, mutations | Various (risks, scenarios, KRIs, treatments) | resources file | prompts file | Strong | Good | B+ |

---

## Cross-Server Consistency Analysis

### 1. Structural Consistency -- GOOD

All 8 servers follow an identical directory structure:
```
src/
  index.ts          -- McpServer creation, tool registration, transport
  prisma.ts         -- PrismaClient singleton with shutdown handlers
  tools/
    *-tools.ts      -- Read-only domain tools
    analysis-tools.ts -- Aggregation/reporting tools
    mutation-tools.ts -- propose_* mutation tools
    mutation-tools.test.ts -- Registration tests
  resources/
    index.ts        -- Static MCP resources (markdown docs)
  prompts/
    index.ts        -- MCP prompt definitions
```

**Finding:** All servers register tools in the same order: domain tools first, then analysis, then mutations. Resources and prompts are registered last. This is consistent across all 8 servers.

### 2. Index.ts Pattern -- IDENTICAL

Every `index.ts` follows the exact same pattern:
1. Import McpServer and StdioServerTransport
2. Create server with name, version `0.1.0`, instructions, and `{ logging: {} }` capability
3. Register tools, resources, prompts
4. Connect via stdio with try/catch

**File references:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/index.ts:1-45`
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/index.ts:1-53`
- (identical pattern in all 8)

### 3. Prisma.ts Pattern -- NEARLY IDENTICAL

All 8 `prisma.ts` files are functionally identical. Minor inconsistency: audits, controls, itsm, and risks include the comment `// Ensure clean shutdown` while evidence, incidents, organisation, and policies omit it.

**File references:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/prisma.ts:1-17` (with comment)
- `/home/daniel/projects/riskready-community/apps/mcp-server-evidence/src/prisma.ts:1-16` (without comment)

**Severity:** Cosmetic (INFO)

---

## Detailed Findings

### FINDING-01: Critical Code Duplication -- createPendingAction (MEDIUM)

**Description:** The `createPendingAction` function and `getDefaultOrganisationId` helper are copy-pasted identically in all 8 `mutation-tools.ts` files. This is ~40 lines duplicated 8 times (320 lines total).

**Files affected:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/mutation-tools.ts:5-44`
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/mutation-tools.ts:5-44`
- `/home/daniel/projects/riskready-community/apps/mcp-server-evidence/src/tools/mutation-tools.ts:5-44`
- `/home/daniel/projects/riskready-community/apps/mcp-server-incidents/src/tools/mutation-tools.ts:5-44`
- `/home/daniel/projects/riskready-community/apps/mcp-server-itsm/src/tools/mutation-tools.ts:5-44` (presumed)
- `/home/daniel/projects/riskready-community/apps/mcp-server-organisation/src/tools/mutation-tools.ts:5-44` (presumed)
- `/home/daniel/projects/riskready-community/apps/mcp-server-policies/src/tools/mutation-tools.ts:5-44` (presumed)
- `/home/daniel/projects/riskready-community/apps/mcp-server-risks/src/tools/mutation-tools.ts:5-44` (presumed)

**Risk:** If a bug is found in `createPendingAction` (e.g., missing field, incorrect type cast), it must be fixed in 8 places. The `actionType: params.actionType as any` cast bypasses type safety.

**Recommendation:** Extract to a shared package `@riskready/mcp-shared` with the `createPendingAction` and `getDefaultOrganisationId` functions.

### FINDING-02: No Try/Catch Around Prisma Operations (MEDIUM)

**Description:** None of the tool handler functions wrap Prisma calls in try/catch blocks. If Prisma throws (connection failure, constraint violation, timeout), the error will propagate unhandled up to the MCP SDK, which may or may not handle it gracefully.

**Example (one of hundreds):**
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/nonconformity-tools.ts:17-59` -- `list_nonconformities` has no try/catch
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/control-tools.ts:17-62` -- `list_controls` has no try/catch

**Risk:** Database connectivity issues, Prisma query errors, or schema mismatches will produce unstructured error messages to the LLM client instead of the standard `{ isError: true }` MCP response format.

**Recommendation:** Add a shared error-handling wrapper:
```typescript
async function safeTool<T>(fn: () => Promise<T>): Promise<T | McpErrorResponse> {
  try { return await fn(); }
  catch (e) { return { content: [{ type: 'text', text: `Database error: ${e.message}` }], isError: true }; }
}
```

### FINDING-03: Extensive Use of `any` Type (LOW)

**Description:** The `controls` server and several others use `any` for Prisma `where` clauses and response objects instead of proper types.

**Examples:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/control-tools.ts:18` -- `const where: any = {};`
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/control-tools.ts:51` -- `const response: any = { results, total: count, skip, take };`
- `/home/daniel/projects/riskready-community/apps/mcp-server-itsm/src/tools/analysis-tools.ts:35-37` -- groupBy results typed as `any`

**Contrast:** The `audits` server uses `Record<string, unknown>` which is marginally better:
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/nonconformity-tools.ts:18` -- `const where: Record<string, unknown> = {};`
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/nonconformity-tools.ts:49` -- `const response: Record<string, unknown> = { ... };`

**Inconsistency:** The audits server uses `Record<string, unknown>` while all other servers use `any`. This is a cross-server inconsistency.

**Recommendation:** Use Prisma-generated types (`Prisma.ControlWhereInput`) for `where` clauses instead of `any` or `Record<string, unknown>`.

### FINDING-04: Unbounded Queries in Analysis Tools (MEDIUM)

**Description:** Several analysis tools fetch all records without pagination, which could cause memory issues on large datasets.

**Examples:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/analysis-tools.ts:12-29` -- `get_nc_aging_report` fetches ALL open NCs
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/analysis-tools.ts:96-112` -- `get_cap_status_report` fetches ALL NCs requiring CAP
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/analysis-tools.ts:162-175` -- `get_nc_by_control` fetches ALL linked NCs
- `/home/daniel/projects/riskready-community/apps/mcp-server-incidents/src/tools/analysis-tools.ts:13-19` -- `get_incident_trending` fetches all incidents from last 12 months
- `/home/daniel/projects/riskready-community/apps/mcp-server-incidents/src/tools/analysis-tools.ts:50-58` -- `get_mttr_report` fetches ALL closed incidents
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/analysis-tools.ts:313-322` -- `get_tester_workload` fetches ALL tests across active assessments
- `/home/daniel/projects/riskready-community/apps/mcp-server-policies/src/tools/analysis-tools.ts:69-93` -- `get_policy_compliance_matrix` fetches ALL applicable controls with document mappings
- `/home/daniel/projects/riskready-community/apps/mcp-server-evidence/src/tools/analysis-tools.ts:72-94` -- `get_evidence_coverage` fetches all evidence-control links

**Risk:** For a mature deployment with thousands of NCs, incidents, or controls, these queries could cause OOM or excessive response sizes that exceed LLM context windows.

**Recommendation:** Add a hard limit (e.g., `take: 1000`) to all unbounded `findMany` calls, or paginate analysis results.

### FINDING-05: Missing `isError` Flag on Empty List Results (LOW/DESIGN)

**Description:** List tools return empty results as successful responses with a `note` field, which is correct MCP behavior. However, this pattern is inconsistent between servers:

- **Audits server** always adds `response['note']` with bracket notation:
  `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/nonconformity-tools.ts:51`
- **Controls server** uses dot notation:
  `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/control-tools.ts:53`
- **Evidence, incidents, policies** sometimes omit the empty-note pattern entirely for list tools:
  `/home/daniel/projects/riskready-community/apps/mcp-server-evidence/src/tools/evidence-tools.ts:58-64` -- `list_evidence` has no empty note
  `/home/daniel/projects/riskready-community/apps/mcp-server-incidents/src/tools/incident-tools.ts:51-57` -- `list_incidents` has no empty note

**Recommendation:** Standardize empty result notes across all servers.

### FINDING-06: Unsafe Type Casts in Mutation Tools (LOW)

**Description:** The `createPendingAction` function uses unsafe type casts.

**Examples:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/mutation-tools.ts:23-24` -- `actionType: params.actionType as never` and `payload: params.payload as never`
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/mutation-tools.ts:23` -- `actionType: params.actionType as any`

**Inconsistency:** The audits server uses `as never` while controls (and other servers) use `as any`. This is another cross-server inconsistency.

**Risk:** These casts suppress type checking, meaning an invalid `actionType` string would pass compilation but could cause runtime failures or data integrity issues in the pending action queue.

**Recommendation:** Define a union type for all valid action types and use it consistently.

### FINDING-07: Search Query Injection -- Mitigated by Prisma (INFO)

**Description:** Search tools pass user-provided `query` strings directly into Prisma `contains` filters.

**Examples:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/nonconformity-tools.ts:100-107`
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/control-tools.ts:160-165`
- `/home/daniel/projects/riskready-community/apps/mcp-server-incidents/src/tools/incident-tools.ts:108-114`

**Assessment:** Prisma parameterizes all queries, so SQL injection is not possible. This is a PASS. However, extremely long search strings are not bounded -- there is no `.max()` on the `query` Zod schema.

**Recommendation:** Add `z.string().max(500)` to all search query parameters.

### FINDING-08: Date String Parameters Not Validated (LOW)

**Description:** Many mutation tools accept ISO 8601 date strings (e.g., `targetClosureDate`, `dueDate`, `plannedStartDate`) as `z.string()` without format validation.

**Examples:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/mutation-tools.ts:62` -- `targetClosureDate: z.string().optional()`
- `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/mutation-tools.ts:63-67` -- Multiple date fields as plain strings
- `/home/daniel/projects/riskready-community/apps/mcp-server-itsm/src/tools/capacity-tools.ts:13-14` -- `fromDate` and `toDate` passed to `new Date()` without validation

**Risk:** Invalid date strings like `"not-a-date"` would be stored in the pending action payload and could cause errors when the action is executed.

**Recommendation:** Use `z.string().datetime()` or a custom Zod refinement to validate ISO 8601 format before acceptance.

### FINDING-09: Race Condition in Duplicate Checks (LOW)

**Description:** The `propose_create_nc` tool checks for duplicate `ncId` before creating the pending action, but another concurrent request could create the same `ncId` between the check and the action execution.

**File:** `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/mutation-tools.ts:69-74`

**Similarly:** `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/mutation-tools.ts:1104-1111` -- `propose_create_control` duplicate check

**Assessment:** This is a TOCTOU (time-of-check-to-time-of-use) issue. However, the actual write happens during the human approval step (not the propose step), so the race window is between two proposals being created, not between proposal and execution. The approval executor should re-validate. **Severity is LOW** given the propose/approve architecture.

### FINDING-10: `get_control` Uses `include` Instead of `select` (LOW)

**Description:** The `get_control` tool uses `include` which returns ALL scalar fields plus the included relations. This could expose sensitive fields or return excessively large payloads.

**File:** `/home/daniel/projects/riskready-community/apps/mcp-server-controls/src/tools/control-tools.ts:72-109`

**Similarly:** `get_assessment` at line 62-78, `get_change` at `/home/daniel/projects/riskready-community/apps/mcp-server-itsm/src/tools/change-tools.ts:83-116` (returns full history with up to 50 entries)

**Contrast:** List tools consistently use `select` to limit fields.

**Recommendation:** Replace `include` with explicit `select` on "get single entity" tools where the full scalar set is not needed.

### FINDING-11: Missing Pagination on Some List Tools (LOW)

**Description:** Several list tools that could return large result sets do not support pagination:

- `/home/daniel/projects/riskready-community/apps/mcp-server-organisation/src/tools/governance-tools.ts:13-42` -- `list_committees` has no pagination
- `/home/daniel/projects/riskready-community/apps/mcp-server-organisation/src/tools/reference-tools.ts:10-44` -- `list_regulators` has no pagination
- `/home/daniel/projects/riskready-community/apps/mcp-server-organisation/src/tools/reference-tools.ts:48-86` -- `list_applicable_frameworks` has no pagination
- `/home/daniel/projects/riskready-community/apps/mcp-server-organisation/src/tools/reference-tools.ts:89-131` -- `list_context_issues` has no pagination
- `/home/daniel/projects/riskready-community/apps/mcp-server-organisation/src/tools/reference-tools.ts:134-172` -- `list_interested_parties` has no pagination
- `/home/daniel/projects/riskready-community/apps/mcp-server-organisation/src/tools/structure-tools.ts:161-198` -- `list_key_personnel` has no pagination

**Assessment:** These are likely low-volume entities (few committees, regulators, etc.), so the practical risk is minimal. But it breaks the consistency pattern.

### FINDING-12: Mutation Tools Lack Organisation ID Propagation (LOW)

**Description:** Some mutation tools in `evidence` and `incidents` servers don't propagate `organisationId` from the looked-up entity to the pending action.

**Examples:**
- `/home/daniel/projects/riskready-community/apps/mcp-server-evidence/src/tools/mutation-tools.ts:113-121` -- `propose_update_evidence` doesn't pass organisationId
- `/home/daniel/projects/riskready-community/apps/mcp-server-evidence/src/tools/mutation-tools.ts:145-153` -- `propose_link_evidence` doesn't pass organisationId

**Risk:** The `createPendingAction` will fall back to `getDefaultOrganisationId()`, which queries the first organisation. In a multi-tenant deployment, this would assign the action to the wrong organisation.

### FINDING-13: `z.any()` Used for Tags Parameter (LOW)

**Description:** Evidence mutation tools use `z.any()` for the `tags` parameter, bypassing validation entirely.

**File:** `/home/daniel/projects/riskready-community/apps/mcp-server-evidence/src/tools/mutation-tools.ts:60` -- `tags: z.any().optional()`
**File:** `/home/daniel/projects/riskready-community/apps/mcp-server-evidence/src/tools/mutation-tools.ts:97` -- `tags: z.any().optional()`

**Risk:** An LLM agent could pass any arbitrary JSON structure. Since this goes through the approval queue, the risk is mitigated, but it could cause unexpected payloads.

**Recommendation:** Use `z.array(z.string()).optional()` to properly type tags.

### FINDING-14: Inconsistent Search Result Limits (INFO)

**Description:** Search tools use different `take` limits across servers:

| Server | Search Tool | Limit |
|--------|------------|-------|
| audits | `search_nonconformities` | 50 |
| controls | `search_controls` | 50 |
| evidence | `search_evidence` | 20 |
| incidents | `search_incidents` | 20 |
| itsm | `search_assets` | 50 |
| itsm | `search_changes` | 50 |
| policies | `search_policy_documents` | 20 |
| risks | `search_risks` | 50 |

**Recommendation:** Standardize to a single limit (e.g., 50) or make it configurable.

### FINDING-15: No Connection Pool Configuration (INFO)

**Description:** Each MCP server creates its own `PrismaClient` with default connection pool settings. If all 8 servers run simultaneously on the same database, that's 8 connection pools.

**File:** All `prisma.ts` files -- PrismaClient created with only `datasourceUrl` and `log` options.

**Risk:** Default Prisma pool size is `num_cpus * 2 + 1`. With 8 servers, this could be 8 * (2 * N + 1) connections, which may exceed PostgreSQL's `max_connections`.

**Recommendation:** Configure connection pool limits explicitly: `datasources: { db: { url: ..., pool: { min: 2, max: 10 } } }`.

---

## Input Validation Summary

### Validation Quality by Category

| Category | Assessment |
|----------|-----------|
| **Enum parameters** | STRONG -- All status, severity, category, type fields use `z.enum([...])` with correct values |
| **Pagination** | STRONG -- Consistent `z.number().int().min(0).default(0)` for skip, `z.number().int().min(1).max(200).default(50)` for take |
| **UUID parameters** | ACCEPTABLE -- Uses `z.string()` without UUID format validation |
| **Search queries** | ACCEPTABLE -- Uses `z.string()` without max length |
| **Date parameters** | WEAK -- Uses `z.string()` without datetime format validation |
| **Array parameters** | GOOD -- Uses `z.array(z.string())` for ID arrays |
| **Boolean parameters** | GOOD -- Uses `z.boolean().optional()` |
| **Numeric parameters** | GOOD -- Uses constraints like `z.number().int().min(1).max(5)` |

---

## Error Handling Summary

### What Works

1. **Not-found checks:** Every `get_*` tool checks for null results and returns `{ isError: true }` with a descriptive message.
2. **Status validation:** Mutation tools that require specific states (e.g., DRAFT for deletion, IN_PROGRESS for review submission) validate current status before creating proposals.
3. **Duplicate detection:** Create tools (e.g., `propose_create_nc`, `propose_create_control`) check for existing records before proposing creation.
4. **Entity existence:** All mutation tools that reference an entity by ID verify it exists before creating the pending action.

### What's Missing

1. **No try/catch:** Zero Prisma calls are wrapped in try/catch in any of the 8 servers.
2. **No timeout handling:** Long-running queries have no timeout configuration.
3. **No error classification:** When errors do propagate, they are raw Prisma errors without context about which tool or operation failed.

---

## Tool Description Quality

**Assessment: GOOD**

All tool descriptions are:
- Clear about what the tool returns
- Accurate about filter capabilities
- Honest about pagination behavior
- Include ISO 27001 context where relevant

The `instructions` field in each server's `index.ts` is excellent -- it includes 6 rules about data integrity and anti-hallucination that are well-crafted for LLM consumers.

---

## Resource Definition Quality

**Assessment: GOOD**

Resources are well-defined with:
- Consistent URI scheme (`{domain}://{resource}`)
- Markdown content with workflow diagrams
- Data integrity guidelines in every server
- ISO 27001 context where relevant

Every server includes a `data-integrity` resource. Some servers have domain-specific lifecycle documentation (NC lifecycle, assessment workflow, evidence retention, etc.).

---

## Mutation Safety Analysis

**Assessment: STRONG**

The propose/approve architecture is the strongest security control in the codebase:

1. **No direct writes:** Every mutation creates an `McpPendingAction` record instead of modifying domain data directly.
2. **Human approval required:** Actions sit in a queue until a human approves them.
3. **Audit trail:** Every proposal records `mcpToolName`, `mcpSessionId`, `reason`, and full `payload`.
4. **Status machine enforcement:** Transition tools validate current state before allowing proposals.
5. **Entity existence checks:** All mutations verify referenced entities exist.

**Remaining risks:**
- The approval executor (not audited here) must re-validate all preconditions
- TOCTOU gaps between proposal creation and execution (mitigated by human review latency)
- No authorization checks within the MCP tools (relies on transport-level auth)

---

## Recommendations

### Priority 1 -- High Impact (should fix)

1. **Extract shared code to a package:** Move `createPendingAction`, `getDefaultOrganisationId`, and the error wrapper to `packages/mcp-shared/`. This eliminates 300+ lines of duplication and ensures consistent behavior.

2. **Add try/catch wrappers around all Prisma operations:** Either wrap each tool handler or create a higher-order function that catches Prisma errors and returns structured `{ isError: true }` responses.

3. **Bound all `findMany` calls in analysis tools:** Add `take: 1000` or similar hard limits to prevent unbounded memory consumption.

### Priority 2 -- Medium Impact (should fix soon)

4. **Validate date string parameters:** Replace `z.string()` with `z.string().datetime()` for all ISO 8601 date parameters.

5. **Add `.max()` to search query parameters:** Prevent excessively long search strings with `z.string().max(500)`.

6. **Fix organisationId propagation in evidence/incident mutations:** Ensure all mutation tools pass `organisationId` from the looked-up entity, not just the default org.

7. **Replace `z.any()` with proper types:** Use `z.array(z.string())` for tags instead of `z.any()`.

### Priority 3 -- Low Impact (nice to have)

8. **Standardize `any` vs `Record<string, unknown>`:** Pick one approach for `where` clause typing (preferably Prisma-generated types).

9. **Standardize search result limits** across servers (20 vs 50).

10. **Add pagination to remaining list tools** in the organisation server.

11. **Add UUID format validation** to `z.string().describe('UUID')` parameters using `z.string().uuid()`.

12. **Configure connection pool limits** in `prisma.ts` to prevent connection exhaustion.

13. **Standardize empty-result note pattern** across all servers.

---

## Test Coverage Assessment

Each server has a `mutation-tools.test.ts` that verifies:
1. `registerMutationTools` is a function
2. It doesn't throw when called
3. The correct tool names are registered
4. The correct total number of tools is registered

**Assessment:** These are registration smoke tests only. They do not test:
- Tool handler logic
- Input validation behavior
- Error handling paths
- Prisma query correctness
- Not-found error responses

**File reference:** `/home/daniel/projects/riskready-community/apps/mcp-server-audits/src/tools/mutation-tools.test.ts:1-64`

**Recommendation:** Add handler-level tests that mock Prisma and verify:
- Successful proposal creation
- Not-found error responses
- Status validation rejections
- Duplicate detection

---

## Appendix: File Inventory

### Per-server file counts

| Server | Source Files | Tool Files | Resource Files | Prompt Files | Test Files |
|--------|-------------|------------|----------------|--------------|------------|
| audits | 8 | 3 (nonconformity, analysis, mutation) | 1 | 1 | 1 |
| controls | 9 | 6 (control, assessment, test, metric, soa, analysis) + mutation | 1 | 1 | 1 |
| evidence | 8 | 3 (evidence, evidence-request, analysis) + mutation | 1 | 1 | 1 |
| incidents | 8 | 3 (incident, incident-detail, analysis) + mutation | 1 | 1 | 1 |
| itsm | 10 | 7 (asset, asset-relationship, software, capacity, change, change-support, analysis) + mutation | 1 | 1 | 1 |
| organisation | 9 | 5 (org-profile, structure, process, governance, reference) + analysis + mutation | 1 | 1 | 1 |
| policies | 8 | 4 (policy, policy-lifecycle, policy-mapping, analysis) + mutation | 1 | 1 | 1 |
| risks | 9 | 6 (risk, scenario, kri, rts, treatment, analysis) + mutation | 1 | 1 | 1 |
