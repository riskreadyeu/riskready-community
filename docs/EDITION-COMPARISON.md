# RiskReady: Business Edition vs Community Edition — Full Comparison

> Generated: 2026-02-13  
> **Business** = Production/Enterprise (`riskreadylocal`). **Community** = Open-source edition (`riskready-community`).

---

## 1. Backend modules (NestJS)

| Module | Business | Community | Notes |
|--------|----------|-----------|--------|
| Auth | ✅ | ✅ | JWT, login, sessions |
| Health | ✅ | ✅ | Health check |
| Organisation | ✅ | ✅ | Full org structure |
| Controls | ✅ | ✅ | Simplified in Community (no layers, no cross-ref) |
| Risks | ✅ | ✅ | Simplified in Community (no KRI/BIRT/governance/FAIR/scheduler) |
| Audits | ✅ | ✅ | Nonconformity register |
| Policies | ✅ | ✅ | Full policy lifecycle |
| ITSM | ✅ | ✅ | Assets, changes, CAB (no Cloud/DORA report in Community) |
| Incidents | ✅ | ✅ | Core only in Community (no NIS2/DORA notifications) |
| Evidence | ✅ | ✅ | Repository, requests, links |
| Dashboard | ✅ | ✅ | Overview |
| Prisma | ✅ | ✅ | ORM |
| **Applications** | ✅ | ❌ | Application register, ISRA assessments |
| **Supply Chain** | ✅ | ❌ | Vendors, assessments, contracts, DORA report |
| **BCM** | ✅ | ❌ | Business continuity, BIA, plans, tests, activations |
| **Vulnerabilities** | ✅ | ❌ | Vuln queue, scans, SLA, connectors |
| **External Requirements** | ✅ | ❌ | Regulatory sources, compliance matrix |
| **McpActions** | ✅ | ❌ | AI/MCP approval queue |
| **Files** | ✅ | ❌ | File storage (Business) |
| **Chat** | ✅ | ❌ | Chat module (Business) |

---

## 2. Prisma schema files

| Schema file | Business | Community |
|-------------|----------|-----------|
| base.prisma | ✅ | ✅ |
| auth.prisma | ✅ | ✅ |
| audit-log.prisma | ✅ | ✅ |
| audits.prisma | ✅ | ✅ |
| controls.prisma | ✅ (full: layers, BIRT, appetite, etc.) | ✅ (stripped: no ControlLayer, LayerTest, BIRT, Appetite, etc.) |
| risks.prisma | ✅ (full: notifications, alerts, snapshots, governance) | ✅ (stripped: no RiskNotification, RiskAlert, AssessmentSnapshot, etc.) |
| organisation.prisma | ✅ | ✅ |
| policies.prisma | ✅ | ✅ |
| evidence.prisma | ✅ | ✅ |
| incidents.prisma | ✅ (full: NIS2/DORA assessments, notifications) | ✅ (stripped: no NIS2/DORA models) |
| itsm.prisma | ✅ | ✅ |
| **applications.prisma** | ✅ | ❌ |
| **asset-risk-history.prisma** | ✅ | ❌ |
| **bcm.prisma** | ✅ | ❌ |
| **external-requirements.prisma** | ✅ | ❌ |
| **loss-magnitude.prisma** | ✅ | ❌ |
| **mcp-pending-action.prisma** | ✅ | ❌ |
| **risk-governance.prisma** | ✅ | ❌ |
| **stored-file.prisma** | ✅ | ❌ |
| **supply-chain.prisma** | ✅ | ❌ |
| **vulnerabilities.prisma** | ✅ | ❌ |
| **chat.prisma** | ✅ | ❌ |

---

## 3. Main navigation (sidebar)

| Item | Business | Community |
|------|----------|-----------|
| Dashboard | ✅ | ✅ |
| Risk Management | ✅ | ✅ |
| Control Management | ✅ | ✅ |
| Policies & Compliance | ✅ | ✅ |
| Audit Management | ✅ | ✅ |
| External Requirements | ✅ | ❌ |
| ITSM / CMDB | ✅ | ✅ |
| Vulnerabilities | ✅ | ❌ |
| Incidents | ✅ | ✅ |
| Supply Chain | ✅ | ❌ |
| Organisation | ✅ | ✅ |
| Business Continuity | ✅ | ❌ |
| Evidence Center | ✅ | ✅ |
| AI Approvals | ✅ | ❌ |

---

## 4. Routes by area

### 4.1 Risks

| Route | Business | Community |
|-------|----------|-----------|
| /risks | ✅ Dashboard | ✅ Dashboard |
| /risks/register | ✅ | ✅ |
| /risks/hub | ✅ | ❌ |
| /risks/assessment | ✅ Risk Matrix | ❌ |
| /risks/analytics | ✅ | ❌ |
| /risks/kris | ✅ | ❌ (no KRI backend) |
| /risks/kris/:id | ✅ | ❌ |
| /risks/tolerance | ✅ | ✅ |
| /risks/tolerance/:id | ✅ | ✅ |
| /risks/treatments | ✅ | ✅ |
| /risks/treatments/:id | ✅ | ✅ |
| /risks/birt | ✅ BIRT config | ❌ |
| /risks/appetite | ✅ | ❌ |
| /risks/appetite/config | ✅ | ❌ |
| /risks/loss-magnitude | ✅ | ❌ |
| /risks/governance | ✅ | ❌ |
| /risks/threats | ✅ Threat catalog | ❌ |
| /risks/threats/:threatId | ✅ | ❌ |
| /risks/scenarios/:id | ✅ | ✅ |
| /risks/:id | ✅ | ✅ |

### 4.2 Controls

| Route | Business | Community |
|-------|----------|-----------|
| /controls | ✅ Command center | ✅ |
| /controls/dashboard | ✅ | ✅ |
| /controls/library | ✅ | ✅ |
| /controls/tests | ✅ Effectiveness tests | ❌ |
| /controls/my-tests | ✅ | ❌ |
| /controls/assessments | ✅ | ❌ |
| /controls/assessments/:id | ✅ | ❌ |
| /controls/assessments/:id/tests/:testId | ✅ | ❌ |
| /controls/:controlId | ✅ | ✅ |
| /controls/soa | ✅ | ✅ |
| /controls/soa/new | ✅ | ✅ |
| /controls/soa/:id | ✅ | ✅ |
| /controls/testing/owner | ✅ Layer testing | ❌ |
| /controls/testing/:testId | ✅ | ❌ |
| /controls/cross-reference | ✅ | ❌ |
| /controls/effectiveness | ✅ | ❌ |
| /controls/maturity | ✅ | ❌ |
| /controls/gaps | ✅ | ❌ |
| /controls/trends | ✅ | ❌ |
| /controls/compliance/iso27001 | ✅ | ❌ |
| /controls/scope | ✅ | ✅ |

### 4.3 Policies

| Route | Business | Community |
|-------|----------|-----------|
| /policies | ✅ | ✅ |
| /policies/documents | ✅ | ✅ |
| /policies/documents/new | ✅ | ✅ |
| /policies/documents/:id | ✅ | ✅ |
| /policies/documents/:id/edit | ✅ | ✅ |
| /policies/hierarchy | ✅ | ✅ |
| /policies/versions | ✅ | ✅ |
| /policies/approvals | ✅ | ✅ |
| /policies/changes | ✅ | ✅ |
| /policies/exceptions | ✅ | ✅ |
| /policies/acknowledgments | ✅ | ✅ |
| /policies/reviews | ✅ | ✅ |
| /policies/mappings | ✅ | ✅ |
| /policies/gap-analysis | ✅ | ❌ |

### 4.4 External requirements

| Route | Business | Community |
|-------|----------|-----------|
| /external-requirements | ✅ | ❌ |
| /external-requirements/:id | ✅ | ❌ |
| /external-requirements/requirement/:id | ✅ | ❌ |
| /external-requirements/matrix/:sourceId | ✅ | ❌ |

### 4.5 Audits

| Route | Business | Community |
|-------|----------|-----------|
| /audits | ✅ | ✅ |
| /audits/nonconformities | ✅ | ✅ |
| /audits/nonconformities/:id | ✅ | ✅ |
| /audits/schedule | ✅ (sidebar) | ❌ |
| /audits/findings | ✅ (sidebar) | ❌ |
| /audits/evidence | ✅ (sidebar) | ❌ |
| /audits/reports | ✅ (sidebar) | ❌ |

### 4.6 Vulnerabilities

| Route | Business | Community |
|-------|----------|-----------|
| /vulnerabilities | ✅ | ❌ |
| /vulnerabilities/queue | ✅ | ❌ |
| /vulnerabilities/scans | ✅ | ❌ |
| /vulnerabilities/import | ✅ | ❌ |
| /vulnerabilities/breaches | ✅ | ❌ |
| /vulnerabilities/remediated | ✅ | ❌ |
| /vulnerabilities/sla-report | ✅ | ❌ |
| /vulnerabilities/metrics | ✅ | ❌ |
| /vulnerabilities/connectors | ✅ | ❌ |
| /vulnerabilities/settings | ✅ | ❌ |
| /vulnerabilities/:id | ✅ | ❌ |

### 4.7 Supply chain

| Route | Business | Community |
|-------|----------|-----------|
| /supply-chain | ✅ | ❌ |
| /supply-chain/concentration | ✅ | ❌ |
| /supply-chain/vendors | ✅ | ❌ |
| /supply-chain/assessments | ✅ | ❌ |
| /supply-chain/findings | ✅ | ❌ |
| /supply-chain/contracts | ✅ | ❌ |
| /supply-chain/reviews | ✅ | ❌ |
| /supply-chain/sla | ✅ | ❌ |
| /supply-chain/incidents | ✅ | ❌ |
| /supply-chain/exit-plans | ✅ | ❌ |
| /supply-chain/dora-report | ✅ | ❌ |
| /supply-chain/questions | ✅ | ❌ |

### 4.8 Incidents

| Route | Business | Community |
|-------|----------|-----------|
| /incidents | ✅ | ✅ |
| /incidents/register | ✅ | ✅ |
| /incidents/new | ✅ | ✅ |
| /incidents/nis2 | ✅ | ❌ |
| /incidents/dora | ✅ | ❌ |
| /incidents/notifications | ✅ | ❌ |
| /incidents/clocks | ✅ | ❌ |
| /incidents/metrics | ✅ | ❌ |
| /incidents/lessons | ✅ | ✅ |
| /incidents/reports | ✅ | ❌ |
| /incidents/settings | ✅ | ❌ |
| /incidents/:id | ✅ | ✅ |
| /incidents/:id/edit | ✅ | ✅ |

### 4.9 BCM / Continuity

| Route | Business | Community |
|-------|----------|-----------|
| /continuity | ✅ | ❌ |
| /physical-security | ✅ | ❌ |
| /bcm | ✅ | ❌ |
| /bcm/bia/* | ✅ | ❌ |
| /bcm/programs/* | ✅ | ❌ |
| /bcm/plans/* | ✅ | ❌ |
| /bcm/tests/* | ✅ | ❌ |
| /bcm/activations/* | ✅ | ❌ |
| /data-governance | ✅ | ❌ |

### 4.10 Evidence

| Route | Business | Community |
|-------|----------|-----------|
| /evidence | ✅ | ✅ |
| /evidence/repository | ✅ | ✅ |
| /evidence/requests | ✅ | ✅ |
| /evidence/requests/:id | ✅ | ✅ |
| /evidence/pending | ✅ | ✅ |
| /evidence/approved | ✅ | ✅ |
| /evidence/expiring | ✅ | ✅ |
| /evidence/search | ✅ | ✅ |
| /evidence/links | ✅ | ✅ |
| /evidence/coverage | ✅ | ✅ |
| /evidence/archive | ✅ | ✅ |
| /evidence/:id | ✅ | ✅ |
| /evidence/settings | ✅ (sidebar) | ❌ |

### 4.11 ITSM

| Route | Business | Community |
|-------|----------|-----------|
| /itsm | ✅ | ✅ |
| /itsm/assets | ✅ | ✅ |
| /itsm/assets/new | ✅ | ✅ |
| /itsm/assets/:id | ✅ | ✅ |
| /itsm/data-quality | ✅ | ✅ |
| /itsm/cloud | ✅ | ❌ |
| /itsm/dora-report | ✅ | ❌ |
| /itsm/changes | ✅ | ✅ |
| /itsm/changes/calendar | ✅ | ✅ |
| /itsm/changes/cab | ✅ | ✅ |
| /itsm/changes/new | ✅ | ✅ |
| /itsm/changes/:id | ✅ | ✅ |
| /itsm/settings | ✅ (sidebar) | ❌ |

### 4.12 Applications

| Route | Business | Community |
|-------|----------|-----------|
| /applications | ✅ | ❌ |
| /applications/:applicationId | ✅ | ❌ |
| /applications/:applicationId/isra/:israId | ✅ | ❌ |

### 4.13 MCP / AI

| Route | Business | Community |
|-------|----------|-----------|
| /mcp/approvals | ✅ | ❌ |
| /mcp/approvals/:id | ✅ | ❌ |

### 4.14 Organisation

| Route | Business | Community |
|-------|----------|-----------|
| All organisation routes | ✅ (full) | ✅ (same set) |
| /organisation/regulatory-eligibility | ✅ | ✅ |
| /organisation/wizard | ✅ | ✅ |

### 4.15 Other

| Route | Business | Community |
|-------|----------|-----------|
| /dashboard | ✅ | ✅ |
| /login | ✅ | ✅ |
| /settings | ✅ | ✅ |
| /assets → /itsm/assets | ✅ | ✅ |

---

## 5. Feature summary by capability

| Capability | Business | Community |
|------------|----------|-----------|
| **Risk register & scenarios** | Full (create, edit, scenarios, detail) | Full (same) |
| **Risk tolerance statements** | Full | Full |
| **Treatment plans** | Full | Full |
| **Risk matrix / assessment view** | ✅ | ❌ |
| **Risk analytics** | ✅ | ❌ |
| **Key Risk Indicators (KRI)** | ✅ Backend + UI | ❌ Backend (KRI UI components present but API 404) |
| **BIRT impact thresholds** | ✅ | ❌ |
| **Risk appetite** | ✅ | ❌ |
| **Loss magnitude** | ✅ | ❌ |
| **Risk governance / RACI** | ✅ | ❌ |
| **Threat catalog** | ✅ | ❌ |
| **FAIR / Monte Carlo simulation** | ✅ | ❌ |
| **Control library & SOA** | Full | Full (no layers, no cross-ref) |
| **Control assessments & tests** | Full (layer testing, my tests) | Simplified (assessment model kept, layer-based generation removed) |
| **Control effectiveness / maturity / gaps / trends** | ✅ | ❌ |
| **Framework cross-reference** | ✅ | ❌ |
| **ISO 27001 coverage view** | ✅ | ❌ |
| **Policies (documents, approvals, reviews)** | Full | Full |
| **Policy gap analysis** | ✅ | ❌ |
| **External requirements** | ✅ | ❌ |
| **Audits / nonconformities** | Full | Full (no schedule/findings/reports routes) |
| **Vulnerability management** | Full | ❌ |
| **Supply chain / vendor risk** | Full | ❌ |
| **Incidents (core)** | Full | Full |
| **NIS2 / DORA incident reporting** | ✅ | ❌ |
| **BCM / business continuity** | Full | ❌ |
| **ITSM assets & changes** | Full | Full (no Cloud dashboard, no DORA report) |
| **Applications / ISRA** | ✅ | ❌ |
| **Evidence center** | Full | Full |
| **Organisation structure** | Full | Full |
| **Regulatory eligibility** | ✅ | ✅ |
| **MCP / AI approvals** | ✅ | ❌ |
| **Chat** | ✅ | ❌ |
| **Files module** | ✅ | ❌ |

---

## 6. Quick counts

| Metric | Business | Community |
|--------|----------|-----------|
| Backend modules (app.module) | 19 | 12 |
| Prisma schema files | 22 | 11 |
| Main nav items | 14 | 9 |
| Risk routes | 20 | 8 |
| Control routes | 22 | 8 |
| Organisation routes | ~44 | ~44 (same) |

---

*This document lives in the Community repo. Update it when either edition gains or loses features.*
