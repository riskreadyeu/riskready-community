# 2026-03-12 RiskReady Community-Only Site Cleanup Design

## Goal
Make `riskready.dev` strictly community-only by removing leftover commercial pages, rewriting legal content for the community edition, and ensuring only the community route set remains as real website content.

## Approved Scope
- Keep real community pages:
  - `/`
  - `/install`
  - `/features`
  - `/ai-mcp`
  - `/faq`
  - `/docs`
- Keep legal pages but adapt them to community:
  - `/privacy`
  - `/terms`
- Remove standalone `/security`
- Remove legacy commercial and marketing routes instead of redirecting them
- Preserve the existing visual style and community navigation

## Route Policy
### Real pages
These routes should render content:
- `/`
- `/install`
- `/features`
- `/ai-mcp`
- `/faq`
- `/docs`
- `/privacy`
- `/terms`

### Removed routes
These routes should no longer exist as pages and should resolve to `404`:
- `/security`
- `/pricing`
- `/how-it-works`
- `/about`
- `/open-source`
- `/frameworks`
- `/contact`
- `/blog`
- `/blog/*`
- `/use-cases`
- `/use-cases/*`

## Legal Content Direction
### Privacy
Rewrite to describe:
- the public `riskready.dev` website
- optional contact or repo-link interactions
- self-hosted community usage where users control their own data
- no waitlist, no sales funnel, no paid customer instance language

### Terms
Rewrite to describe:
- the website and community edition only
- AGPL-licensed open-source software
- no commercial subscription tiers
- no managed SaaS promises or paid support commitments

## Non-Goals
- No redesign of the community pages
- No new page additions
- No docs-system expansion
- No changes to unrelated local edits in the website repo

## Verification
- Build passes
- Smoke tests cover:
  - community routes render
  - legacy routes return `404`
  - `/privacy` and `/terms` use community wording
  - `/security` returns `404`
