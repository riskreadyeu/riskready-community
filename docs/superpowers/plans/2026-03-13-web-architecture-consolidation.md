# Web Architecture Consolidation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the `apps/web` frontend so routing, layout composition, auth ownership, and large-page structure are coherent and maintainable without rewriting the product.

**Architecture:** Keep the current domain-oriented product shape, but consolidate cross-cutting concerns into one route composition model, one page-layout system, one auth/session source of truth, and smaller container-driven pages. Prefer incremental migrations that preserve behavior and reduce risk. Each chunk should leave the app in a working state.

**Tech Stack:** React 18, Vite, TypeScript, React Router 6, Tailwind CSS, Radix UI, Playwright

---

## File Map

**Routing**
- Modify: `apps/web/src/App.tsx`
- Create: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/routes/dashboard-routes.tsx`
- Create: `apps/web/src/routes/risks-routes.tsx`
- Create: `apps/web/src/routes/controls-routes.tsx`
- Create: `apps/web/src/routes/policies-routes.tsx`
- Create: `apps/web/src/routes/audits-routes.tsx`
- Create: `apps/web/src/routes/incidents-routes.tsx`
- Create: `apps/web/src/routes/evidence-routes.tsx`
- Create: `apps/web/src/routes/itsm-routes.tsx`
- Create: `apps/web/src/routes/organisation-routes.tsx`
- Create: `apps/web/src/routes/settings-routes.tsx`

**Shell**
- Modify: `apps/web/src/components/app-shell.tsx`
- Create: `apps/web/src/lib/navigation.ts`

**Auth**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/contexts/AuthContext.tsx`
- Modify: `apps/web/src/hooks/useCurrentUser.ts`
- Search: `apps/web/src/**/*.{ts,tsx}` for direct `getMe`, `login`, `logout`, and `localStorage` auth usage

**Layout consolidation**
- Modify: `apps/web/src/components/common/index.ts`
- Modify: `apps/web/src/components/common/page-header.tsx`
- Modify: `apps/web/src/components/common/detail-page-layout.tsx`
- Modify: `apps/web/src/components/archer/index.ts`
- Modify: `apps/web/src/components/archer/list-page-layout.tsx`
- Modify: `apps/web/src/components/archer/detail-page-layout.tsx`
- Modify: representative pages in:
  - `apps/web/src/pages/risks`
  - `apps/web/src/pages/controls`
  - `apps/web/src/pages/policies`

**Large page decomposition**
- Modify: `apps/web/src/pages/policies/PolicyDocumentDetailPage.tsx`
- Create: `apps/web/src/components/policies/detail/*`
- Create: `apps/web/src/hooks/policies/usePolicyDocumentDetail.ts`
- Modify: `apps/web/src/pages/audits/NonconformityDetailPage.tsx`
- Create: `apps/web/src/components/audits/nonconformity-detail/*`
- Create: `apps/web/src/hooks/audits/useNonconformityDetail.ts`
- Modify: `apps/web/src/pages/incidents/IncidentDetailPage.tsx`
- Create: `apps/web/src/components/incidents/detail/*`
- Create: `apps/web/src/hooks/incidents/useIncidentDetail.ts`

**Verification**
- Modify or add tests under:
  - `apps/web/e2e`
  - `apps/web/src/**/__tests__` if a unit/integration test setup exists

---

## Chunk 1: Route Modularization

### Task 1: Capture the current route inventory

**Files:**
- Modify: `apps/web/src/App.tsx`
- Create: `apps/web/src/routes/index.tsx`

- [ ] **Step 1: Write down the current route groups**

Document the route families currently defined in `App.tsx`:
- `/dashboard`
- `/risks/*`
- `/controls/*`
- `/policies/*`
- `/audits/*`
- `/incidents/*`
- `/evidence/*`
- `/itsm/*`
- `/organisation/*`
- `/settings/*`

- [ ] **Step 2: Create a route registry module**

Create `apps/web/src/routes/index.tsx` exporting grouped route fragments or route components for each domain.

- [ ] **Step 3: Move one low-risk route family first**

Start with `settings` and `dashboard` so the extraction pattern is proven on small surface area before migrating large modules.

- [ ] **Step 4: Verify app still boots**

Run: `npm run build`
Expected: build succeeds with no missing imports

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/routes/index.tsx apps/web/src/routes/*.tsx
git commit -m "refactor(web): extract initial route modules"
```

### Task 2: Move each domain into its own route module

**Files:**
- Create: `apps/web/src/routes/risks-routes.tsx`
- Create: `apps/web/src/routes/controls-routes.tsx`
- Create: `apps/web/src/routes/policies-routes.tsx`
- Create: `apps/web/src/routes/audits-routes.tsx`
- Create: `apps/web/src/routes/incidents-routes.tsx`
- Create: `apps/web/src/routes/evidence-routes.tsx`
- Create: `apps/web/src/routes/itsm-routes.tsx`
- Create: `apps/web/src/routes/organisation-routes.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Move the risks routes into `risks-routes.tsx`**
- [ ] **Step 2: Run `npm run build` and verify behavior is unchanged**
- [ ] **Step 3: Repeat for controls and policies**
- [ ] **Step 4: Repeat for audits, incidents, evidence, ITSM, organisation**
- [ ] **Step 5: Replace the large inline route table in `App.tsx` with imported route groups**
- [ ] **Step 6: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/routes/*.tsx
git commit -m "refactor(web): modularize route definitions by domain"
```

### Task 3: Add route-level lazy loading

**Files:**
- Modify: `apps/web/src/routes/*.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Introduce `React.lazy` for page-level or module-level route entrypoints**
- [ ] **Step 2: Wrap route rendering in `Suspense` with an existing lightweight loading UI**
- [ ] **Step 3: Keep lazy boundaries coarse enough to avoid turning every single page into micro-chunks**
- [ ] **Step 4: Run `npm run build` and confirm chunks are emitted**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/routes/*.tsx
git commit -m "perf(web): lazy load route modules"
```

---

## Chunk 2: Shell and Navigation Consolidation

### Task 4: Replace route-specific branching in the shell with configuration

**Files:**
- Modify: `apps/web/src/components/app-shell.tsx`
- Create: `apps/web/src/lib/navigation.ts`

- [ ] **Step 1: Define a module navigation config**

Create `apps/web/src/lib/navigation.ts` with:
- primary nav groups
- module route matchers
- module-specific secondary sidebar mapping
- shell labels/version constants

- [ ] **Step 2: Refactor `app-shell.tsx` to derive module state from config**

Remove repeated booleans like:
- `isOrganisationRoute`
- `isControlsRoute`
- `isRisksRoute`

Replace them with a single resolved current-module object.

- [ ] **Step 3: Replace repeated secondary sidebar `<aside>` blocks with one data-driven render path**
- [ ] **Step 4: Run `npm run build`**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/app-shell.tsx apps/web/src/lib/navigation.ts
git commit -m "refactor(web): make app shell navigation config-driven"
```

### Task 5: Remove prototype residue from the shell

**Files:**
- Modify: `apps/web/src/components/app-shell.tsx`

- [ ] **Step 1: Replace hardcoded user name and role with derived user data or neutral fallback labels**
- [ ] **Step 2: Remove or clearly mark static notifications and fake AI insight content**
- [ ] **Step 3: Keep UX stable by using empty states where dynamic data is not wired yet**
- [ ] **Step 4: Run `npm run build`**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/app-shell.tsx
git commit -m "refactor(web): remove hardcoded shell placeholder content"
```

---

## Chunk 3: Auth Single Source of Truth

### Task 6: Choose and enforce one auth model

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Make `AuthContext` the single source of truth**

Reason:
- it already exists
- auth state should not live inside the root route component
- app shell and pages need shared session access

- [ ] **Step 2: Wrap the app in `AuthProvider` from `main.tsx`**
- [ ] **Step 3: Remove direct auth state from `AppInner`**
- [ ] **Step 4: Convert login/logout flows to call the context**
- [ ] **Step 5: Ensure session bootstrap uses server truth first, local cache only as fallback if needed**
- [ ] **Step 6: Run `npm run build`**
- [ ] **Step 7: Commit**

```bash
git add apps/web/src/main.tsx apps/web/src/App.tsx apps/web/src/contexts/AuthContext.tsx
git commit -m "refactor(web): centralize auth state in context"
```

### Task 7: Remove duplicate auth access patterns

**Files:**
- Modify: `apps/web/src/hooks/useCurrentUser.ts`
- Modify: all direct auth consumers found by search

- [ ] **Step 1: Search for direct `getMe`, `login`, `logout`, and auth-related `localStorage` usage**
- [ ] **Step 2: Replace those calls with `useAuth()` or a thin shared hook**
- [ ] **Step 3: Remove dead auth code paths**
- [ ] **Step 4: Run `npm run build`**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useCurrentUser.ts apps/web/src/contexts/AuthContext.tsx apps/web/src/pages apps/web/src/components
git commit -m "refactor(web): remove duplicate auth access paths"
```

---

## Chunk 4: Layout System Consolidation

### Task 8: Decide the canonical page composition system

**Files:**
- Modify: `apps/web/src/components/common/index.ts`
- Modify: `apps/web/src/components/archer/index.ts`

- [ ] **Step 1: Keep `archer` as the canonical list/detail page composition layer**
- [ ] **Step 2: Limit `common` to generic primitives that do not overlap with `archer` page composition**
- [ ] **Step 3: Mark overlapping exports in `common/index.ts` as deprecated comments or remove them if no longer used**
- [ ] **Step 4: Run `npm run build`**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/common/index.ts apps/web/src/components/archer/index.ts
git commit -m "refactor(web): define canonical page composition layer"
```

### Task 9: Migrate representative modules to the canonical layout

**Files:**
- Modify: `apps/web/src/pages/risks/risk-register.tsx`
- Modify: `apps/web/src/pages/risks/risk-detail.tsx`
- Modify: `apps/web/src/pages/controls/controls-library/ControlsLibraryPage.tsx`
- Modify: `apps/web/src/pages/policies/PolicyDocumentListPage.tsx`

- [ ] **Step 1: Use risks as the reference implementation for list/detail standards**
- [ ] **Step 2: Migrate controls list pages to the same list-page layout conventions**
- [ ] **Step 3: Migrate policy list/detail headers where practical without changing behavior**
- [ ] **Step 4: Avoid broad visual redesign; the goal is structural consistency**
- [ ] **Step 5: Run `npm run build`**
- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/risks apps/web/src/pages/controls apps/web/src/pages/policies apps/web/src/components/common apps/web/src/components/archer
git commit -m "refactor(web): align core modules to shared page layout patterns"
```

---

## Chunk 5: Shared Data Fetching Conventions

### Task 10: Introduce data hooks for page orchestration

**Files:**
- Create: `apps/web/src/hooks/risks/useRiskRegister.ts`
- Create: `apps/web/src/hooks/controls/useControlsLibrary.ts`
- Create: `apps/web/src/hooks/policies/usePolicyDocumentDetail.ts`
- Modify: representative pages that currently inline fetch logic

- [ ] **Step 1: Start with one list page and one detail page**
- [ ] **Step 2: Move loading, fetch, refresh, and error logic into dedicated hooks**
- [ ] **Step 3: Keep hooks focused on orchestration, not UI concerns**
- [ ] **Step 4: Refactor pages to become render-focused containers**
- [ ] **Step 5: Run `npm run build`**
- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hooks apps/web/src/pages
git commit -m "refactor(web): extract page data orchestration into hooks"
```

### Task 11: Standardize error handling

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: representative pages/hooks

- [ ] **Step 1: Define a consistent frontend error handling pattern**
- [ ] **Step 2: Replace raw `console.error`-only flows with user-visible failure handling where needed**
- [ ] **Step 3: Keep logging centralized where practical**
- [ ] **Step 4: Run `npm run build`**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/hooks apps/web/src/pages
git commit -m "refactor(web): standardize frontend error handling"
```

---

## Chunk 6: Large Page Decomposition

### Task 12: Decompose `PolicyDocumentDetailPage`

**Files:**
- Modify: `apps/web/src/pages/policies/PolicyDocumentDetailPage.tsx`
- Create: `apps/web/src/components/policies/detail/PolicyDetailHeader.tsx`
- Create: `apps/web/src/components/policies/detail/PolicyDetailActions.tsx`
- Create: `apps/web/src/components/policies/detail/PolicyReviewDialog.tsx`
- Create: `apps/web/src/components/policies/detail/PolicyApprovalDialog.tsx`
- Create: `apps/web/src/hooks/policies/usePolicyDocumentDetail.ts`

- [ ] **Step 1: Extract data loading and mutations into `usePolicyDocumentDetail`**
- [ ] **Step 2: Extract dialog state and dialog components**
- [ ] **Step 3: Keep the page file as a coordinator that wires sections together**
- [ ] **Step 4: Run `npm run build`**
- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/policies/PolicyDocumentDetailPage.tsx apps/web/src/components/policies/detail apps/web/src/hooks/policies/usePolicyDocumentDetail.ts
git commit -m "refactor(web): split policy document detail page"
```

### Task 13: Decompose `NonconformityDetailPage`

**Files:**
- Modify: `apps/web/src/pages/audits/NonconformityDetailPage.tsx`
- Create: `apps/web/src/components/audits/nonconformity-detail/*`
- Create: `apps/web/src/hooks/audits/useNonconformityDetail.ts`

- [ ] **Step 1: Extract data and mutation orchestration into a hook**
- [ ] **Step 2: Extract CAP workflow sections into focused components**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/audits/NonconformityDetailPage.tsx apps/web/src/components/audits/nonconformity-detail apps/web/src/hooks/audits/useNonconformityDetail.ts
git commit -m "refactor(web): split nonconformity detail page"
```

### Task 14: Decompose `IncidentDetailPage`

**Files:**
- Modify: `apps/web/src/pages/incidents/IncidentDetailPage.tsx`
- Create: `apps/web/src/components/incidents/detail/*`
- Create: `apps/web/src/hooks/incidents/useIncidentDetail.ts`

- [ ] **Step 1: Extract fetch and save flows into a hook**
- [ ] **Step 2: Extract timeline, metadata, and action panels into focused components**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/incidents/IncidentDetailPage.tsx apps/web/src/components/incidents/detail apps/web/src/hooks/incidents/useIncidentDetail.ts
git commit -m "refactor(web): split incident detail page"
```

---

## Chunk 7: Verification and Cleanup

### Task 15: Add regression coverage for refactored navigation and auth

**Files:**
- Modify: `apps/web/e2e/smoke-pages.spec.ts`
- Modify: `apps/web/e2e/smoke-api.spec.ts`
- Create or modify targeted Playwright specs for auth + route navigation

- [ ] **Step 1: Add a smoke path covering login, dashboard, a module route, and logout**
- [ ] **Step 2: Add a smoke path covering secondary sidebar rendering for at least one module**
- [ ] **Step 3: Run the smallest relevant Playwright subset**

Run: `npm run test:e2e -- e2e/smoke-pages.spec.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e
git commit -m "test(web): cover auth and navigation regressions"
```

### Task 16: Final verification

**Files:**
- No code changes required unless verification finds issues

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 2: Run targeted E2E checks**

Run: `npm run test:e2e -- e2e/smoke-pages.spec.ts`
Expected: PASS

- [ ] **Step 3: Manually verify these routes in dev if needed**
- `/dashboard`
- `/risks`
- `/controls`
- `/policies`
- `/organisation`
- `/settings`

- [ ] **Step 4: Create a short migration note in the PR description**
- [ ] **Step 5: Commit any final fixes**

```bash
git add apps/web
git commit -m "chore(web): finalize frontend architecture consolidation"
```

---

## Recommended PR Boundaries

1. `refactor(web): extract and lazy load route modules`
2. `refactor(web): make shell navigation config-driven`
3. `refactor(web): centralize auth state`
4. `refactor(web): define canonical page layout system`
5. `refactor(web): extract shared page data hooks`
6. `refactor(web): split policy and audit detail pages`
7. `refactor(web): split incident detail page`
8. `test(web): add auth and navigation regression coverage`

## Notes for the Implementer

- Do not rewrite the product shell or redesign the UI during this plan.
- Prefer incremental migrations over “big bang” abstractions.
- Preserve existing route paths.
- Avoid changing server API contracts.
- If a page is ugly but structurally functional, defer visual cleanup unless it blocks consolidation.
- The worktree is already dirty with unrelated changes. Do not revert them.

