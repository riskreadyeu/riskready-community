# RiskReady Community-Only Site Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove remaining commercial website routes and rewrite the legal pages so `riskready.dev` is community-only.

**Architecture:** Keep the existing community homepage and navigation intact, but tighten the route surface down to the approved community pages. Community-appropriate legal pages stay as first-class routes, while legacy commercial routes are removed entirely so they resolve to `404`.

**Tech Stack:** Next.js 16 app router, React 19, TypeScript, Tailwind CSS 4, Playwright smoke tests

**Spec:** `docs/superpowers/specs/2026-03-12-riskready-community-only-site-cleanup-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/privacy/page.tsx` | Modify | Rewrite privacy content for the community website and self-hosted community edition |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/terms/page.tsx` | Modify | Rewrite terms content for community-only positioning |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/security/page.tsx` | Delete | Remove standalone commercial security page |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/about/page.tsx` | Delete | Remove legacy commercial route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/blog/page.tsx` | Delete | Remove legacy commercial route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/blog/*/page.tsx` | Delete | Remove legacy commercial routes |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/contact/page.tsx` | Delete | Remove legacy commercial route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/frameworks/page.tsx` | Delete | Remove legacy commercial route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/how-it-works/page.tsx` | Delete | Remove legacy commercial route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/open-source/page.tsx` | Delete | Remove legacy commercial route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/pricing/page.tsx` | Delete | Remove legacy commercial route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/use-cases/page.tsx` | Delete | Remove legacy commercial route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/use-cases/*/page.tsx` | Delete | Remove legacy commercial routes |
| `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts` | Modify | Assert only community pages remain and removed routes 404 |

## Chunk 1: Tighten the Route Surface

### Task 1: Replace redirect expectations with removal expectations

**Files:**
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`

- [ ] **Step 1: Write the failing smoke tests**

Update the suite so it asserts:
- `/privacy` and `/terms` return `200`
- `/security` returns `404`
- removed commercial routes return `404` instead of redirecting

- [ ] **Step 2: Run the targeted smoke test to verify it fails**

Run:

```bash
npm run test:smoke -- --grep "removed commercial routes return 404"
```

Expected: FAIL because the current app still redirects or serves removed routes.

- [ ] **Step 3: Delete the removed route pages**

Delete:

```text
src/app/security/page.tsx
src/app/about/page.tsx
src/app/blog/page.tsx
src/app/blog/ai-closes-the-talent-gap/page.tsx
src/app/blog/four-layer-assurance-framework/page.tsx
src/app/blog/iso27001-soc2-dora-nis2-overlap/page.tsx
src/app/blog/open-source-grc-trust/page.tsx
src/app/blog/why-compliance-automation-isnt-enough/page.tsx
src/app/contact/page.tsx
src/app/frameworks/page.tsx
src/app/how-it-works/page.tsx
src/app/open-source/page.tsx
src/app/pricing/page.tsx
src/app/use-cases/page.tsx
src/app/use-cases/no-ciso/page.tsx
src/app/use-cases/regulated/page.tsx
src/app/use-cases/startup-soc2/page.tsx
```

- [ ] **Step 4: Run the targeted smoke test to verify it passes**

Run:

```bash
npm run test:smoke -- --grep "removed commercial routes return 404"
```

Expected: PASS

## Chunk 2: Rewrite the Legal Pages

### Task 2: Make `/privacy` and `/terms` community-only

**Files:**
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/privacy/page.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/terms/page.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`

- [ ] **Step 1: Write the failing legal-content smoke test**

Add assertions that:
- `/privacy` mentions `riskready.dev` and self-hosted/community wording
- `/terms` mentions `AGPL-3.0`
- `/terms` does not mention paid tiers or subscriptions

- [ ] **Step 2: Run the targeted smoke test to verify it fails**

Run:

```bash
npm run test:smoke -- --grep "legal pages are community-only"
```

Expected: FAIL because the current legal pages still mention waitlists, paid tiers, and SaaS language.

- [ ] **Step 3: Rewrite `/privacy` minimally**

Keep the current page style but replace the body with community-only language covering:
- website usage
- GitHub/docs links
- optional direct contact
- self-hosted responsibility for application data

- [ ] **Step 4: Rewrite `/terms` minimally**

Keep the current page style but replace the body with community-only language covering:
- website use
- community edition source code licensing
- AGPL-3.0 precedence for the software
- no warranties and no commercial service commitment

- [ ] **Step 5: Run the targeted smoke test to verify it passes**

Run:

```bash
npm run test:smoke -- --grep "legal pages are community-only"
```

Expected: PASS

## Chunk 3: Final Verification

### Task 3: Validate the cleaned route set

**Files:**
- Verify: `/home/daniel/projects/riskready-portal/riskready.cloud`

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: PASS

- [ ] **Step 2: Run the full smoke suite**

```bash
npm run test:smoke -- tests/community-site.spec.ts
```

Expected: PASS

- [ ] **Step 3: Check diff hygiene**

```bash
git diff --check
```

Expected: no whitespace or patch format issues
