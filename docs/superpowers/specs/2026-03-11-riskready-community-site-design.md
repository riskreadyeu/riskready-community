# RiskReady Community Website Design

**Date:** 2026-03-11
**Status:** Approved
**Source Repo:** `/home/daniel/projects/riskready-portal/riskready.cloud`
**Domain:** `riskready.dev`

## Goal

Repurpose the existing `riskready.cloud` marketing repo into a community-edition website for `riskready.dev`, while preserving the current commercial site state for later reuse.

## Product Direction

- Community-only website
- Optimize for GitHub adoption and self-hosted demo installs
- No commercial teaser, pricing funnel, or waitlist path
- Equal-weight primary CTAs: GitHub and Docker demo
- Mix real product screenshots with simple architecture diagrams
- Small multi-page site rather than a single landing page
- Docs page is a gateway into canonical docs in `riskready-community`

## Site Architecture

The live site becomes a community-focused multi-page site with these primary destinations:

- Home
- Install
- Features
- AI/MCP
- FAQ
- Docs

The existing Next.js app, brand system, motion language, layout shell, and reusable visual components stay where useful. The current commercial information architecture does not.

## Page Model

### Home

Purpose: explain the product quickly and drive users toward GitHub or Docker demo usage.

Content flow:

- Hero with equal GitHub and Run the Demo CTAs
- Open-source trust strip and product facts
- Problem with traditional GRC tooling
- Community-edition solution
- Product screenshots
- Simplified AI/MCP "how it works" section
- Final CTA section routing to install/docs or GitHub

### Install

Purpose: operational conversion page.

Content:

- Prerequisites
- Quick-start commands
- `.env` setup summary
- `docker compose up -d`
- Demo login details
- Links to full deployment docs in the community repo
- Clear distinction between local demo setup and deeper production docs

### Features

Purpose: show real product breadth using screenshots and concise capability descriptions.

Content domains:

- Risks
- Controls
- Policies
- Incidents
- Audits
- Evidence
- ITSM
- Organisation
- AI approval workflow

### AI/MCP

Purpose: explain the AI architecture clearly to developers and technical evaluators.

Content:

- 9 MCP servers overview
- AI gateway / agents / approvals architecture
- Human-in-the-loop mutation model
- Mix of diagrams and real screenshots
- Why this differs from a simple chatbot integration

### FAQ

Purpose: answer community-adoption concerns.

Content examples:

- What is included in community edition?
- Is it production-usable?
- What AI model dependencies exist?
- Does it require Docker?
- How do MCP servers work?
- How do I contribute?

### Docs

Purpose: curated gateway, not hosted canonical docs.

Link groups:

- Getting Started
- Deployment
- AI Assistant
- Administration
- API
- MCP Servers

All links point to canonical docs in `riskready-community`.

## Reuse Strategy

### Keep

- Existing Next.js app shell
- Layout primitives
- Header/footer structural patterns
- UI primitives
- Motion/effects system
- Brand identity and overall visual style

### Reuse with Rewrite

- Hero
- Problem
- Solution
- Product showcase sections
- FAQ shell
- Navigation/footer content

### Remove or Replace

- Pricing teaser
- Waitlist / founding members CTA
- Commercial pricing/contact/sales framing
- Commercial navigation destinations that do not serve OSS users
- Funnel language around savings, memberships, or demo booking

### Add

- Quick-start CTA band for GitHub plus Docker
- Community-edition scope section
- AI/MCP explainer sections
- Docs gateway cards
- Screenshot plus diagram hybrid sections
- Community-focused FAQ set

## Rollout Strategy

1. Preserve the current commercial state in the existing repo with a backup branch and archival tag.
2. Do the community rewrite on a dedicated branch.
3. Keep the current visual system, but replace the live page set and information architecture.
4. Remove or archive commercial-only routes from the live app so they do not appear in navigation, sitemap, or internal linking.
5. Launch in two phases:
   - Phase 1: core community site pages and route structure
   - Phase 2: screenshot refresh, diagrams, metadata, QA, and copy polish

## Important Constraint

The current marketing repo already has local uncommitted changes:

- `offerv4.md`
- `src/components/sections/open-source/open-source-content.tsx`

Those changes must be reviewed before creating the archival backup so the snapshot is intentional.

## Boundaries

- Reuse the existing repo and deployment path for now
- Do not build a second docs system into the website
- Canonical technical docs remain in `riskready-community`
- Treat the commercial site as archived state for future reactivation, not as part of the live community website
