# FinSecure Ltd — Company Brief

Use this as the opening message in Claude Desktop to kick off the onboarding demo.

---

## Opening Prompt

```
I'm setting up a new organisation in RiskReady. Here's the company profile:

**FinSecure Ltd** is a mid-size fintech company headquartered in Dublin, Ireland. We provide digital payment processing and lending platform services to European banks and financial institutions.

Key facts:
- Legal name: FinSecure Technologies Limited
- Industry: Financial Services — Payment Processing & Digital Lending
- Employees: 210
- Founded: 2019
- Annual revenue: EUR 28 million
- Headquarters: 42 Merrion Square, Dublin 2, Ireland
- Second office: 15 Kurfürstendamm, Berlin, Germany (engineering hub, 45 staff)
- Data centre: AWS eu-west-1 (Dublin) — primary; AWS eu-central-1 (Frankfurt) — DR

We're regulated under DORA as a payment institution and NIS2 as digital infrastructure. We're pursuing ISO 27001 certification this year.

Departments: Engineering (65), Product (15), Operations (25), Compliance & Risk (12), Finance (18), People & Culture (20), Customer Success (30), IT Operations (15), Executive Team (10)

Key products:
- PayBridge — real-time payment processing API
- LendFlow — digital lending origination platform
- SecureVault — PCI DSS compliant card data tokenisation service

Main technology stack: Kubernetes on AWS EKS, PostgreSQL (RDS), Redis, Kafka, React/Node.js applications

Key vendors: AWS (infrastructure), Stripe (payment rails), Experian (credit checks), Cloudflare (WAF/CDN), Datadog (monitoring), Okta (identity)

Executive team:
- CEO: Sarah Chen
- CTO: Marcus Okafor
- CFO: Lena Schmidt
- CISO: James Murray
- COO: Anna Kowalski
- Head of Compliance: David O'Brien
- Head of Engineering: Priya Patel
- DPO: Michael Fitzgerald

Please start the onboarding process — set up our organisation from scratch following ISO 27001.
```

---

## Demo Flow Notes

After pasting the brief, Claude should:

1. **Create the org profile** — `propose_org_profile` with all the details
2. **Ask to confirm** the organisationId (or use the existing one if already seeded)
3. **Create departments** — 9 departments in sequence using `propose_department`
4. **Create locations** — Dublin HQ, Berlin office, 2 AWS regions
5. **Create executive positions** — CEO, CTO, CFO, CISO, COO, etc.
6. **Create key personnel** — ISMS roles (CISO as ISMS Manager, DPO, etc.)
7. **Register products** — PayBridge, LendFlow, SecureVault
8. **Register technology platforms** — AWS EKS, PostgreSQL RDS, Redis, Kafka, etc.
9. **Register applicable frameworks** — ISO 27001, DORA, NIS2, PCI DSS
10. **Document interested parties** — Regulators (CBI, BaFin), customers, employees, shareholders
11. **Document context issues** — Regulatory pressure, fintech competition, talent shortage, etc.
12. **Set up security committee** — ISSC with CISO as chair

Each step creates proposals in the approval queue. After Phase 1 completes, switch to the web UI and show the approval queue with 30-40 pending actions ready for review.

## Approval Demo Beat

In the web UI:
1. Show the approval queue — all proposals listed with summaries and reasons
2. Bulk-approve the organisation setup (or approve one-by-one to show detail)
3. Return to Claude Desktop and say: "Great, the org setup is approved. Let's move to policies."

## Key Talking Points

- "One conversation to set up what normally takes weeks of spreadsheet work"
- "Every action is auditable — the AI explains WHY it proposed each change"
- "Human stays in control — nothing executes without approval"
- "The AI knows ISO 27001, DORA, NIS2 — it follows the right sequence automatically"
- "356 tools across 12 modules — full GRC program management from a chat interface"
