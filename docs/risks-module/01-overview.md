# Risk Management Module - Overview

**Version:** 1.0  
**Created:** December 2024  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Process Flow](#process-flow)
5. [Framework Support](#framework-support)
6. [Integration Points](#integration-points)

---

## Introduction

The Risk Management Module provides a comprehensive enterprise risk management solution for information security risks. It supports:

- **Tiered Risk Taxonomy**: Core, Extended, and Advanced risks based on organization size
- **Scenario-Based Assessment**: Detailed cause-event-consequence analysis
- **Key Risk Indicators**: RAG-status monitoring with trend analysis
- **Treatment Planning**: Full lifecycle management from proposal to completion
- **Risk Tolerance**: Organizational risk appetite statements
- **Multi-Framework**: ISO 27001, SOC 2, NIS2, and DORA alignment

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Risk Management Module                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐               │
│  │     RISK      │    │   SCENARIO    │    │     KRI       │               │
│  │   REGISTER    │───▶│   ANALYSIS    │───▶│  MONITORING   │               │
│  │               │    │               │    │               │               │
│  └───────┬───────┘    └───────┬───────┘    └───────────────┘               │
│          │                    │                                              │
│          │                    │                                              │
│          ▼                    ▼                                              │
│  ┌───────────────────────────────────────────┐                              │
│  │           RISK SCORING ENGINE             │                              │
│  │  ┌─────────────────────────────────────┐  │                              │
│  │  │ 5x5 Matrix: L × I = Score (1-25)   │  │                              │
│  │  └─────────────────────────────────────┘  │                              │
│  └───────────────────────────────────────────┘                              │
│                          │                                                   │
│          ┌───────────────┴───────────────┐                                  │
│          │                               │                                  │
│          ▼                               ▼                                  │
│  ┌───────────────┐             ┌───────────────┐                           │
│  │   TREATMENT   │             │     RTS       │                           │
│  │     PLANS     │             │  TOLERANCE    │                           │
│  │               │             │  STATEMENTS   │                           │
│  └───────────────┘             └───────────────┘                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Risk Register

The central repository for all identified information security risks.

| Attribute | Description |
|-----------|-------------|
| **Risk ID** | Unique identifier (e.g., "R-01") |
| **Title** | Risk name |
| **Description** | Detailed risk description |
| **Tier** | Core, Extended, or Advanced |
| **Status** | Identified → Assessed → Treating → Accepted/Closed |
| **Framework** | ISO, SOC2, NIS2, or DORA |
| **Inherent Score** | Risk score before controls (1-25) |
| **Residual Score** | Risk score after controls (1-25) |

#### Risk Tiers

| Tier | Target Audience | Examples |
|------|-----------------|----------|
| **CORE** | All organizations | Basic security controls, access management |
| **EXTENDED** | Medium/Large orgs | Advanced monitoring, threat detection |
| **ADVANCED** | Large enterprises | SOC, threat hunting, zero trust |

#### Risk Statuses

| Status | Description |
|--------|-------------|
| `IDENTIFIED` | Risk has been identified but not assessed |
| `ASSESSED` | Risk has been evaluated with likelihood/impact |
| `TREATING` | Treatment plan is in progress |
| `ACCEPTED` | Risk accepted within tolerance |
| `CLOSED` | Risk no longer applicable |

---

### 2. Risk Scenarios

Detailed analysis of specific risk manifestations using cause-event-consequence modeling.

| Field | Description |
|-------|-------------|
| **Scenario ID** | Unique ID (e.g., "R-01-S01") |
| **Cause** | What triggers the risk |
| **Event** | What happens when the risk materializes |
| **Consequence** | Business impact of the event |
| **Likelihood** | Rare → Unlikely → Possible → Likely → Almost Certain |
| **Impact** | Negligible → Minor → Moderate → Major → Severe |

---

### 3. Key Risk Indicators (KRIs)

Metrics that provide early warning signals about risk levels.

| Field | Description |
|-------|-------------|
| **KRI ID** | Unique identifier (e.g., "KRI-001") |
| **Name** | KRI name |
| **Formula** | How the metric is calculated |
| **Unit** | %, Count, Days, etc. |
| **Thresholds** | Green/Amber/Red thresholds |
| **Frequency** | Daily, Weekly, Monthly, Quarterly |
| **Automated** | Whether data collection is automated |

#### RAG Status

| Status | Meaning | Action |
|--------|---------|--------|
| 🟢 **GREEN** | Within tolerance | Continue monitoring |
| 🟡 **AMBER** | Warning threshold | Investigate and prepare |
| 🔴 **RED** | Critical threshold | Immediate action required |
| ⚪ **NOT_MEASURED** | No data | Collect measurements |

#### Trend Direction

| Trend | Icon | Description |
|-------|------|-------------|
| `IMPROVING` | ↑ | Metric moving toward green |
| `STABLE` | → | No significant change |
| `DECLINING` | ↓ | Metric moving toward red |
| `NEW` | ○ | New KRI, no trend data |

---

### 4. Treatment Plans

Strategies for addressing identified risks.

#### Treatment Types

| Type | Description | Use Case |
|------|-------------|----------|
| `MITIGATE` | Reduce risk through controls | Most common approach |
| `TRANSFER` | Shift risk to third party | Insurance, outsourcing |
| `ACCEPT` | Accept risk with justification | Within tolerance, cost-prohibitive |
| `AVOID` | Eliminate risk source | Discontinue risky activity |
| `SHARE` | Share risk with partners | Joint ventures, shared services |

#### Treatment Workflow

```
DRAFT → PROPOSED → APPROVED → IN_PROGRESS → COMPLETED
                       │
                       ├── ON_HOLD
                       └── CANCELLED
```

#### Treatment Actions

Each treatment plan can have multiple actions:

| Field | Description |
|-------|-------------|
| **Action ID** | Unique identifier |
| **Title** | Action description |
| **Status** | Not Started → In Progress → Completed → Blocked |
| **Priority** | Critical, High, Medium, Low |
| **Due Date** | Target completion date |
| **Assigned To** | Person responsible |

---

### 5. Risk Tolerance Statements (RTS)

Formal statements defining acceptable risk levels per domain.

| Field | Description |
|-------|-------------|
| **RTS ID** | Unique identifier (e.g., "RTS-001") |
| **Title** | Statement title |
| **Objective** | What the RTS aims to achieve |
| **Domain** | Risk domain (e.g., "Vulnerability Management") |
| **Tolerance Level** | HIGH, MEDIUM, or LOW |
| **Proposed RTS** | Full text of the tolerance statement |
| **Conditions** | Specific threshold conditions |

#### Tolerance Levels

| Level | Risk Appetite | Description |
|-------|---------------|-------------|
| `HIGH` | Risk-seeking | Willing to accept significant risk for opportunity |
| `MEDIUM` | Risk-neutral | Balanced approach to risk-taking |
| `LOW` | Risk-averse | Minimal risk acceptance |

---

## Process Flow

```
1. RISK IDENTIFICATION
   ├── Register new risk in Risk Register
   ├── Assign tier (Core/Extended/Advanced)
   ├── Link to framework (ISO/SOC2/NIS2/DORA)
   └── Assign risk owner

2. SCENARIO ANALYSIS
   ├── Define cause-event-consequence
   ├── Assess inherent likelihood (1-5)
   ├── Assess inherent impact (1-5)
   └── Calculate inherent score (L × I = 1-25)

3. CONTROL MAPPING
   ├── Link existing controls
   └── Calculate residual risk

4. KRI SETUP
   ├── Define monitoring metrics
   ├── Set RAG thresholds
   └── Configure collection frequency

5. TREATMENT PLANNING
   ├── Select treatment type
   ├── Define target residual score
   ├── Create treatment actions
   └── Assign responsibilities

6. TOLERANCE ALIGNMENT
   ├── Create/link RTS
   ├── Compare residual vs tolerance
   └── Accept or escalate

7. ONGOING MONITORING
   ├── Collect KRI measurements
   ├── Review RAG status
   ├── Update treatment progress
   └── Periodic risk reviews
```

---

## Framework Support

### ISO 27001:2022

| Clause | Topic | Module Feature |
|--------|-------|----------------|
| 6.1.2 | Risk assessment | Risk Register, Scenarios |
| 6.1.3 | Risk treatment | Treatment Plans |
| 8.2 | Risk assessment execution | KRIs, Scoring |
| 8.3 | Risk treatment implementation | Treatment Actions |
| A.5.1 | Policies | Risk Tolerance Statements |

### SOC 2

| Criteria | Topic | Module Feature |
|----------|-------|----------------|
| CC3.1 | Risk identification | Risk Register |
| CC3.2 | Risk assessment | Scenarios, Scoring |
| CC3.3 | Risk management | Treatment Plans |
| CC3.4 | Risk tolerance | RTS |

### NIS2

| Article | Topic | Module Feature |
|---------|-------|----------------|
| 21(1) | Risk management measures | All components |
| 21(2)(a) | Risk analysis | Scenarios, Scoring |
| 21(2)(g) | Testing | KRI monitoring |

### DORA

| Article | Topic | Module Feature |
|---------|-------|----------------|
| 6 | ICT risk management | Risk Register |
| 7 | ICT systems | Scenario analysis |
| 15 | ICT risk monitoring | KRIs |

---

## Integration Points

### Controls Module

- Risks can be linked to mitigating controls
- Control effectiveness affects residual risk
- Control gaps generate risk findings

### Organisation Module

- Risks are scoped to organisations
- Organisation size affects applicable risk tier
- Risk ownership maps to organisation roles

### Applications Module (ISRA)

- Application-specific risk assessments
- BIA feeds risk impact ratings
- TVA identifies application threats

### Nonconformities

- Treatment gaps can generate nonconformities
- Risk acceptance requires documented justification
