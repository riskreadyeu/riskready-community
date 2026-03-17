# RiskReady Community Website Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing `riskready.cloud` marketing site into a community-only website for `riskready.dev`, while preserving the current commercial state for future reuse.

**Architecture:** Reuse the current Next.js app shell, visual system, and reusable section primitives, but replace the live route structure and narrative with community-focused pages. Keep canonical technical docs in `riskready-community` and make the website's `Docs` page a curated gateway rather than a second documentation system.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Playwright smoke tests, existing screenshot assets from `public/screenshots`

**Spec:** `docs/superpowers/specs/2026-03-11-riskready-community-site-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/layout.tsx` | Modify | Replace metadata and site-wide SEO defaults for `riskready.dev` community positioning |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/layout/header.tsx` | Modify | Replace nav/CTA structure with community routes and equal-weight CTA language |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/layout/footer.tsx` | Modify | Remove newsletter/waitlist behavior and replace footer links with community destinations |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/page.tsx` | Modify | Replace commercial homepage assembly with community homepage composition |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/install/page.tsx` | Create | Install page route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/features/page.tsx` | Create | Features page route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/ai-mcp/page.tsx` | Create | AI/MCP page route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/faq/page.tsx` | Create | FAQ page route |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/docs/page.tsx` | Modify | Convert existing docs page into community docs gateway |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/open-source/page.tsx` | Modify | Redirect legacy route to `/features` or `/install` |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/how-it-works/page.tsx` | Modify | Redirect legacy route to `/ai-mcp` |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/pricing/page.tsx` | Modify | Redirect deprecated commercial page to `/install` |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/contact/page.tsx` | Modify | Redirect deprecated commercial page to `/docs` or `/faq` |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/sitemap.ts` | Modify | Emit only live community routes |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/robots.ts` | Modify | Keep crawl config aligned with live community route set |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/content-data.ts` | Create | Shared page copy/data for CTAs, FAQs, docs links, feature modules |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/home-content.tsx` | Create | Community homepage content |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/install-content.tsx` | Create | Install page content |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/features-content.tsx` | Create | Features page content |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/ai-mcp-content.tsx` | Create | AI/MCP page content |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/faq-content.tsx` | Create | FAQ page content |
| `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/docs-content.tsx` | Create | Docs gateway content |
| `/home/daniel/projects/riskready-portal/riskready.cloud/package.json` | Modify | Add smoke-test script if missing |
| `/home/daniel/projects/riskready-portal/riskready.cloud/playwright.config.ts` | Create | Basic route smoke-test configuration |
| `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts` | Create | Smoke tests for key community routes and CTAs |

---

## Chunk 1: Preserve the Commercial Snapshot Before Rewriting

### Task 1: Verify repo state and create the archival backup

**Files:**
- Modify: none
- Verify only: `/home/daniel/projects/riskready-portal/riskready.cloud`

- [ ] **Step 1: Inspect current repo state**

Run:

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud status --short
git -C /home/daniel/projects/riskready-portal/riskready.cloud log --oneline -n 5
```

Expected: confirm whether `offerv4.md` and `src/components/sections/open-source/open-source-content.tsx` should be part of the backup snapshot.

- [ ] **Step 2: Create archival tag and backup branch**

Run:

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud tag commercial-pre-community-2026-03-11
git -C /home/daniel/projects/riskready-portal/riskready.cloud branch commercial-backup-2026-03-11
git -C /home/daniel/projects/riskready-portal/riskready.cloud checkout -b community-site
```

Expected: repo is on branch `community-site` and the old commercial state is recoverable by tag or branch.

- [ ] **Step 3: Record the backup in the repo docs**

Modify `/home/daniel/projects/riskready-portal/riskready.cloud/README.md` with a short maintainer note:

```md
## Repository Note

This repo currently serves the community website for `riskready.dev`.
The last commercial landing-page state is preserved at tag `commercial-pre-community-2026-03-11`
and branch `commercial-backup-2026-03-11`.
```

- [ ] **Step 4: Verify the backup references exist**

Run:

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud tag --list | rg commercial-pre-community
git -C /home/daniel/projects/riskready-portal/riskready.cloud branch --list | rg commercial-backup
```

Expected: both names are listed exactly once.

- [ ] **Step 5: Commit**

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud add README.md
git -C /home/daniel/projects/riskready-portal/riskready.cloud commit -m "chore: preserve commercial site snapshot before community rewrite"
```

---

## Chunk 2: Replace the Global Site Shell

### Task 2: Rewrite metadata, header, footer, and live route map

**Files:**
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/layout.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/layout/header.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/layout/footer.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/sitemap.ts`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/robots.ts`
- Test: `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`

- [ ] **Step 1: Write the failing smoke test for the new navigation**

Create `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("header exposes only community navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Install" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Features" })).toBeVisible();
  await expect(page.getByRole("link", { name: "AI/MCP" })).toBeVisible();
  await expect(page.getByRole("link", { name: "FAQ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Docs" })).toBeVisible();
  await expect(page.getByText("Pricing")).toHaveCount(0);
  await expect(page.getByText("Founding Members")).toHaveCount(0);
});
```

- [ ] **Step 2: Add Playwright config and script**

Create `/home/daniel/projects/riskready-portal/riskready.cloud/playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

Modify `/home/daniel/projects/riskready-portal/riskready.cloud/package.json`:

```json
{
  "scripts": {
    "test:smoke": "playwright test"
  }
}
```

- [ ] **Step 3: Rewrite the global shell**

Update `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/layout.tsx` to community defaults:

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://riskready.dev"),
  title: {
    default: "RiskReady Community Edition | Open-Source AI-Native GRC",
    template: "%s | RiskReady Community Edition",
  },
  description:
    "Open-source GRC platform with 9 MCP servers, self-hosted Docker demo, and human-approved AI workflows.",
};
```

Update `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/layout/header.tsx` navigation:

```ts
const navigation = [
  { name: "Install", href: "/install" },
  { name: "Features", href: "/features" },
  { name: "AI/MCP", href: "/ai-mcp" },
  { name: "FAQ", href: "/faq" },
  { name: "Docs", href: "/docs" },
];
```

Replace the single sales CTA with two equal-weight CTAs:

```tsx
<Link href="https://github.com/riskreadyeu/riskready-community">GitHub</Link>
<Link href="/install">Run the Demo</Link>
```

Update `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/layout/footer.tsx` to remove newsletter and demo-booking links, replacing them with community links and repo/docs destinations.

- [ ] **Step 4: Update sitemap and robots**

Ensure `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/sitemap.ts` emits only:

```ts
["/", "/install", "/features", "/ai-mcp", "/faq", "/docs"]
```

Keep `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/robots.ts` aligned to the community domain.

- [ ] **Step 5: Run the smoke test and lint**

Run:

```bash
cd /home/daniel/projects/riskready-portal/riskready.cloud
npm run test:smoke -- --grep "header exposes only community navigation"
npm run lint
```

Expected: the nav smoke test passes and lint stays clean.

- [ ] **Step 6: Commit**

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud add \
  src/app/layout.tsx \
  src/components/layout/header.tsx \
  src/components/layout/footer.tsx \
  src/app/sitemap.ts \
  src/app/robots.ts \
  package.json \
  playwright.config.ts \
  tests/community-site.spec.ts
git -C /home/daniel/projects/riskready-portal/riskready.cloud commit -m "feat: replace marketing shell with community site navigation"
```

---

## Chunk 3: Build the Community Homepage

### Task 3: Replace the commercial homepage composition

**Files:**
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/page.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/content-data.ts`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/home-content.tsx`
- Verify assets: `/home/daniel/projects/riskready-portal/riskready.cloud/public/screenshots/*`
- Test: `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`

- [ ] **Step 1: Write a failing homepage smoke test**

Append to `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`:

```ts
test("homepage exposes equal GitHub and demo CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /GitHub/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Run the Demo/i })).toBeVisible();
  await expect(page.getByText(/open-source grc/i)).toBeVisible();
});
```

- [ ] **Step 2: Create shared community data**

Create `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/content-data.ts` with shared arrays:

```ts
export const communityStats = [
  { value: "9", label: "MCP Servers" },
  { value: "250+", label: "AI Tools" },
  { value: "Docker", label: "Self-Hosted Demo" },
  { value: "AGPL-3.0", label: "License" },
];

export const communityModules = [
  "Risks",
  "Controls",
  "Policies",
  "Incidents",
  "Audits",
  "Evidence",
  "ITSM",
  "Organisation",
];
```

- [ ] **Step 3: Implement the community homepage component**

Create `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/home-content.tsx` with these sections in order:

```tsx
export function HomeContent() {
  return (
    <>
      <HeroSection />
      <TrustFactsSection />
      <ProblemSection />
      <SolutionSection />
      <ScreenshotProofSection />
      <AiHowItWorksSection />
      <DualCtaSection />
    </>
  );
}
```

Modify `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/page.tsx`:

```tsx
import { HomeContent } from "@/components/community/home-content";

export default function Home() {
  return <HomeContent />;
}
```

The hero should use equal CTA weight:

```tsx
<Link href="https://github.com/riskreadyeu/riskready-community">View on GitHub</Link>
<Link href="/install">Run the Demo</Link>
```

- [ ] **Step 4: Run smoke test, lint, and build**

Run:

```bash
cd /home/daniel/projects/riskready-portal/riskready.cloud
npm run test:smoke -- --grep "homepage exposes equal GitHub and demo CTAs"
npm run lint
npm run build
```

Expected: homepage smoke passes, lint passes, build passes.

- [ ] **Step 5: Commit**

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud add \
  src/app/page.tsx \
  src/components/community/content-data.ts \
  src/components/community/home-content.tsx \
  tests/community-site.spec.ts
git -C /home/daniel/projects/riskready-portal/riskready.cloud commit -m "feat: replace commercial homepage with community narrative"
```

---

## Chunk 4: Add the Community Pages

### Task 4: Create Install, Features, AI/MCP, FAQ, and Docs gateway pages

**Files:**
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/install/page.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/features/page.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/ai-mcp/page.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/faq/page.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/docs/page.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/install-content.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/features-content.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/ai-mcp-content.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/faq-content.tsx`
- Create: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/docs-content.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/components/community/content-data.ts`
- Test: `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`

- [ ] **Step 1: Write failing route smoke tests**

Append to `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`:

```ts
test("community routes load successfully", async ({ page }) => {
  for (const path of ["/install", "/features", "/ai-mcp", "/faq", "/docs"]) {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
  }
});
```

- [ ] **Step 2: Create the page content components**

Create the five page content files with these exports:

```tsx
export function InstallContent() {}
export function FeaturesContent() {}
export function AiMcpContent() {}
export function FaqContent() {}
export function DocsContent() {}
```

Content requirements:

- `InstallContent`: quick start, prerequisites, env summary, docker commands, demo credentials, docs links
- `FeaturesContent`: module grid, screenshots, AI approval workflow
- `AiMcpContent`: MCP servers, gateway architecture, approval model, diagram plus screenshots
- `FaqContent`: community-focused FAQs only
- `DocsContent`: grouped external links into `riskready-community` docs

- [ ] **Step 3: Wire the routes**

Each route file should stay thin, for example:

```tsx
import { InstallContent } from "@/components/community/install-content";

export const metadata = {
  title: "Install",
  description: "Run RiskReady Community Edition locally with Docker.",
};

export default function InstallPage() {
  return <InstallContent />;
}
```

Repeat the pattern for `/features`, `/ai-mcp`, `/faq`, and `/docs`.

- [ ] **Step 4: Run smoke, lint, and build**

Run:

```bash
cd /home/daniel/projects/riskready-portal/riskready.cloud
npm run test:smoke -- --grep "community routes load successfully"
npm run lint
npm run build
```

Expected: all five routes return successful responses, lint passes, build passes.

- [ ] **Step 5: Commit**

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud add \
  src/app/install/page.tsx \
  src/app/features/page.tsx \
  src/app/ai-mcp/page.tsx \
  src/app/faq/page.tsx \
  src/app/docs/page.tsx \
  src/components/community/install-content.tsx \
  src/components/community/features-content.tsx \
  src/components/community/ai-mcp-content.tsx \
  src/components/community/faq-content.tsx \
  src/components/community/docs-content.tsx \
  src/components/community/content-data.ts \
  tests/community-site.spec.ts
git -C /home/daniel/projects/riskready-portal/riskready.cloud commit -m "feat: add community install, features, ai-mcp, faq, and docs pages"
```

---

## Chunk 5: Clean Up Legacy Commercial Routes Without Breaking Links

### Task 5: Redirect legacy routes and remove sales-era dead ends

**Files:**
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/open-source/page.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/how-it-works/page.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/pricing/page.tsx`
- Modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/contact/page.tsx`
- Optionally modify: `/home/daniel/projects/riskready-portal/riskready.cloud/src/app/frameworks/page.tsx`
- Test: `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`

- [ ] **Step 1: Write failing redirect tests**

Append to `/home/daniel/projects/riskready-portal/riskready.cloud/tests/community-site.spec.ts`:

```ts
test("legacy commercial routes do not expose sales content", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page).toHaveURL(/\/install$/);

  await page.goto("/how-it-works");
  await expect(page).toHaveURL(/\/ai-mcp$/);
});
```

- [ ] **Step 2: Replace legacy pages with redirects**

Use App Router redirects:

```tsx
import { redirect } from "next/navigation";

export default function LegacyPage() {
  redirect("/install");
}
```

Route mapping:

- `/open-source` -> `/features`
- `/how-it-works` -> `/ai-mcp`
- `/pricing` -> `/install`
- `/contact` -> `/docs`

For `/frameworks`, either keep a community-relevant version or redirect to `/features`. Do not leave it sales-led.

- [ ] **Step 3: Run redirect smoke, lint, and build**

Run:

```bash
cd /home/daniel/projects/riskready-portal/riskready.cloud
npm run test:smoke -- --grep "legacy commercial routes do not expose sales content"
npm run lint
npm run build
```

Expected: legacy routes land on community destinations and no pricing/waitlist UI remains accessible through those routes.

- [ ] **Step 4: Commit**

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud add \
  src/app/open-source/page.tsx \
  src/app/how-it-works/page.tsx \
  src/app/pricing/page.tsx \
  src/app/contact/page.tsx \
  src/app/frameworks/page.tsx \
  tests/community-site.spec.ts
git -C /home/daniel/projects/riskready-portal/riskready.cloud commit -m "chore: redirect legacy commercial routes to community pages"
```

---

## Chunk 6: Final Validation and Launch Checklist

### Task 6: Verify content, routing, and launch-readiness

**Files:**
- Verify only: `/home/daniel/projects/riskready-portal/riskready.cloud`

- [ ] **Step 1: Run the full validation suite**

Run:

```bash
cd /home/daniel/projects/riskready-portal/riskready.cloud
npm run lint
npm run build
npm run test:smoke
```

Expected: all commands exit `0`.

- [ ] **Step 2: Manually verify the critical path**

Check in a browser:

1. Home hero shows equal GitHub and Run the Demo CTAs
2. Install page shows real Docker quick-start commands
3. Docs page links into `riskready-community`
4. AI/MCP page explains approval flow and MCP architecture clearly
5. No pricing, waitlist, or sales-copy remnants remain in nav/footer

- [ ] **Step 3: Verify community SEO surface**

Run:

```bash
cd /home/daniel/projects/riskready-portal/riskready.cloud
rg -n "riskready.cloud|Pricing|Founding Members|waitlist|Book a Demo" src
```

Expected: only intentional archival references remain. No live community copy should point to old commercial funnel language.

- [ ] **Step 4: Prepare deployment handoff**

Document:

- branch name
- backup tag
- backup branch
- final route map
- any remaining screenshot/diagram polish items

- [ ] **Step 5: Commit**

```bash
git -C /home/daniel/projects/riskready-portal/riskready.cloud commit --allow-empty -m "chore: validate community website launch readiness"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-03-11-riskready-community-site.md`. Ready to execute?
