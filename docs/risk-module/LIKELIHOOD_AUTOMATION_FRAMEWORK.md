# Likelihood Automation Framework

**Created:** 2026-01-03
**Updated:** 2026-01-04
**Status:** Planning
**Module:** Risk Management

---

## Table of Contents

1. [Overview](#overview)
2. [The Scenario Connection Model](#the-scenario-connection-model)
   - [Scenario Builder UX](#scenario-builder-ux)
3. [Risk Categories](#risk-categories)
4. [Likelihood Factors](#likelihood-factors)
5. [Factor Applicability Matrix](#factor-applicability-matrix)
6. [Dynamic Weight Redistribution](#dynamic-weight-redistribution)
7. [Factor Calculation Details](#factor-calculation-details)
8. [Worked Example - Asset Risk](#worked-example---asset-risk)
9. [Worked Example - Non-Asset Risk](#worked-example---non-asset-risk)
10. [Continuous Monitoring](#continuous-monitoring)
11. [Event-Driven Architecture](#event-driven-architecture)
12. [Extensibility](#extensibility)
13. [Framework Visualization](#framework-visualization)
14. [Risk Manager Dashboard](#risk-manager-dashboard)
15. [ISO 27001 Alignment](#iso-27001-alignment)

---

## Overview

The Likelihood Automation Framework provides evidence-based likelihood calculation for risk scenarios by aggregating data from multiple source systems. Instead of relying solely on subjective manual assessments, the framework calculates a suggested likelihood based on real operational data.

### Key Principles

- **Evidence-Based**: Likelihood derived from actual system data
- **Transparent**: Full factor breakdown visible to risk managers
- **Continuous**: Updates when source data changes
- **Advisory**: Suggests likelihood, doesn't override manual assessment
- **Auditable**: Full history of factor changes
- **Scenario-Driven**: The Risk Scenario is the explicit mapping layer that connects data sources

---

## The Scenario Connection Model

### The Core Problem

Six data sources live in different modules:

| Data Source | Module | Contains |
|-------------|--------|----------|
| Threat Catalog | Risks | Threats with base likelihood |
| Vulnerability Registry | ITSM | CVEs on assets |
| Control Maturity | Controls | Capability assessments |
| Incident History | Incidents | Incident records |
| KRI Status | Risks | Indicator measurements |
| Nonconformity Log | Audits | Audit findings |

Risks might relate to:
- **Tangible assets** (servers, applications, data)
- **Intangible things** (reputation, customer trust)
- **Governance gaps** (missing policies)
- **Process failures** (inadequate change management)
- **Capability gaps** (lack of skills)

**The question is: How does a risk "know" which data from those six sources is relevant to it?**

### The Wrong Mental Model ❌

Searching at calculation time doesn't work:

```
RISK ASSESSMENT TIME
        │
        ▼
┌─────────────────────────────┐
│  "Let me search across all  │
│   six data sources for      │
│   relevant information"     │
└─────────────────────────────┘
        │
        ▼
    🤷 How?
```

You can't query "find all vulnerabilities related to the risk of inadequate security policies." There's no natural join.

### The Right Mental Model ✅

**The Risk Scenario IS the connection layer.** It explicitly declares what's relevant.

```
                         RISK SCENARIO
                    (The Connection Layer)
                              │
       ┌──────────┬──────────┼──────────┬──────────┐
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   THREATS    ASSETS    CONTROLS    PROCESSES   OBJECTIVES
       │          │          │          │          │
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    ┌──────┐
   │Threat│  │Vuln  │  │Maturity│ │Incidents│ │ KRIs │
   │Catalog│ │Scanner│ │Assess │  │History │  │Status│
   └──────┘  └──────┘  └──────┘  └──────┘    └──────┘
```

The Risk Scenario explicitly maps: "This risk involves THESE threats, affecting THESE assets, mitigated by THESE controls, related to THESE processes."

### How It Works

#### Step 1: Risk Identification Creates the Scenario

When someone identifies a risk, they build a scenario with explicit links:

```
RISK: Unauthorized Access to Customer Data

SCENARIO DEFINITION:
├── Threat(s):
│   └── [TH-014] Credential Theft
│   └── [TH-022] Privilege Escalation
│
├── Target Asset(s):
│   └── [AST-089] Customer Database
│   └── [AST-091] CRM Application
│
├── Relevant Control(s):
│   └── [CTL-A.9.4.1] Access Control Policy
│   └── [CTL-A.9.4.2] Secure Logon Procedures
│   └── [CTL-A.9.4.3] Password Management
│
├── Business Process:
│   └── [PRC-012] Customer Data Handling
│
└── Related KRI(s):
    └── [KRI-007] Failed Login Attempts
    └── [KRI-011] Privileged Account Count
```

**This scenario IS the join table.** It's not searching for relevant data—it's explicitly declaring what's relevant.

#### Step 2: Data Sources Link to Scenario Elements

Each data source knows what it relates to through the scenario links:

```
VULNERABILITY SCANNER OUTPUT
┌────────────────────────────────────────┐
│ CVE-2024-1234                          │
│ Severity: HIGH                         │
│ Affected Asset: [AST-089] ←────────────┼──── Links to scenario!
│ Status: OPEN                           │
└────────────────────────────────────────┘

INCIDENT RECORD
┌────────────────────────────────────────┐
│ INC-2024-089                           │
│ Type: Security                         │
│ Related Threat: [TH-014] ←─────────────┼──── Links to scenario!
│ Affected Asset: [AST-089] ←────────────┼──── Links to scenario!
└────────────────────────────────────────┘

CONTROL ASSESSMENT
┌────────────────────────────────────────┐
│ Assessment: A.9.4.1                    │
│ Control: [CTL-A.9.4.1] ←───────────────┼──── Links to scenario!
│ Maturity: 3.0                          │
└────────────────────────────────────────┘

NONCONFORMITY
┌────────────────────────────────────────┐
│ NC-2024-012                            │
│ Finding on: [CTL-A.9.4.2] ←────────────┼──── Links to scenario!
│ Severity: MINOR                        │
└────────────────────────────────────────┘
```

#### Step 3: Likelihood Calculation Follows the Links

When calculating likelihood, the system traverses the scenario:

```
LIKELIHOOD CALCULATION FOR: "Unauthorized Access to Customer Data"

1. GET SCENARIO
   └── Threats: [TH-014, TH-022]
   └── Assets: [AST-089, AST-091]
   └── Controls: [CTL-A.9.4.1, CTL-A.9.4.2, CTL-A.9.4.3]
   └── KRIs: [KRI-007, KRI-011]

2. QUERY EACH DATA SOURCE WITH SCENARIO ELEMENTS

   Threat Factor:
   └── SELECT base_likelihood FROM threats
       WHERE id IN [TH-014, TH-022]
   └── Result: avg = 4

   Vulnerability Factor:
   └── SELECT severity FROM vulnerabilities
       WHERE asset_id IN [AST-089, AST-091]
       AND status = 'OPEN'
   └── Result: 2 open, max severity = 4

   Control Maturity Factor:
   └── SELECT maturity FROM assessments
       WHERE control_id IN [CTL-A.9.4.1, CTL-A.9.4.2, CTL-A.9.4.3]
   └── Result: avg maturity = 2.8

   Incident Factor:
   └── SELECT * FROM incidents
       WHERE threat_id IN [TH-014, TH-022]
       OR asset_id IN [AST-089, AST-091]
   └── Result: 1 incident in 24 months

   KRI Factor:
   └── SELECT status FROM kris
       WHERE id IN [KRI-007, KRI-011]
   └── Result: 1 RED, 1 GREEN

   NC Factor:
   └── SELECT * FROM nonconformities
       WHERE control_id IN [CTL-A.9.4.1, CTL-A.9.4.2, CTL-A.9.4.3]
       AND status = 'OPEN'
   └── Result: 1 MINOR open

3. CALCULATE
   └── Weighted average = 3.05
```

### The Scenario Data Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RISK SCENARIO                               │
│                   (The Universal Connector)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  scenario_id: SCN-001                                               │
│  risk_id: RSK-017                                                   │
│  narrative: "External attacker compromises credentials..."         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ LINKED ELEMENTS (Many-to-Many Relationships)                │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                             │   │
│  │  threats[]        →  [TH-014, TH-022]                      │   │
│  │  risk_objects[]   →  [AST-089, AST-091, GOV-001]           │   │
│  │  controls[]       →  [CTL-A.9.4.1, CTL-A.9.4.2]            │   │
│  │  processes[]      →  [PRC-012]                              │   │
│  │  requirements[]   →  [REQ-ISO-9.4, REQ-DORA-9]             │   │
│  │  kris[]           →  [KRI-007, KRI-011]                    │   │
│  │  objectives[]     →  [OBJ-003]                              │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │
          │  These links are the query keys
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FACTOR DATA SOURCES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  THREATS table                                                      │
│  └── WHERE id IN scenario.threats[]                                │
│                                                                     │
│  VULNERABILITIES table                                              │
│  └── WHERE asset_id IN scenario.risk_objects[]                     │
│                                                                     │
│  CONTROL_ASSESSMENTS table                                          │
│  └── WHERE control_id IN scenario.controls[]                       │
│                                                                     │
│  INCIDENTS table                                                    │
│  └── WHERE threat_id IN scenario.threats[]                         │
│      OR asset_id IN scenario.risk_objects[]                        │
│                                                                     │
│  KRI_MEASUREMENTS table                                             │
│  └── WHERE kri_id IN scenario.kris[]                               │
│                                                                     │
│  NONCONFORMITIES table                                              │
│  └── WHERE control_id IN scenario.controls[]                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Non-Tangible Risks

For risks without traditional assets, the scenario model still works:

```
RISK: Missing Information Security Policies

SCENARIO DEFINITION:
├── Threat(s):
│   └── [TH-031] Regulatory Non-Compliance
│   └── [TH-032] Inconsistent Security Practices
│
├── Target Object(s):
│   └── [GOV-001] Information Security Policy ← Governance Object (MISSING)
│   └── [GOV-002] Acceptable Use Policy ← Governance Object (MISSING)
│
├── Relevant Control(s):
│   └── [CTL-A.5.1] Policies for Information Security
│
├── Compliance Requirements:
│   └── [REQ-ISO-5.1]
│   └── [REQ-DORA-9]
│
└── Related KRI(s):
    └── [KRI-022] Policy Coverage Percentage
    └── [KRI-023] Policy Acknowledgment Rate
```

Factor calculation adapts:
- **Vulnerability Factor**: N/A (no traditional assets) → weight redistributes
- **Control Maturity**: A.5.1 maturity = 1.0 → inverted to 4
- **KRI Factor**: Policy Coverage at 20% → RED → 5

For intangible risks:
- **Governance gaps** link to controls that should exist
- **Process failures** link to process records and related controls
- **Capability gaps** link to training records, role definitions, or custom risk objects

**Everything goes through the scenario.** If something can't be linked to the scenario, it can't contribute to the calculation—and that's correct, because it's not relevant to that specific risk.

### The Key Insight

> **You're not searching for relevant data at calculation time. You're declaring relationships at scenario creation time, then querying those relationships during calculation.**

The scenario is the glue. Without it, you have six disconnected data pools. With it, you have a graph that can be traversed.

### Scenario Builder UX

When a risk manager creates or edits a risk, they're guided through scenario building with intelligent suggestions:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RISK SCENARIO BUILDER                                          [Save Draft] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Risk: Unauthorized Access to Customer Data                                  │
│ Category: CYBER_SECURITY                                                    │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 1: WHAT THREATS APPLY?                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search threat catalog...                                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ 💡 SUGGESTED based on risk category:                                        │
│    ○ Credential Theft (TH-014)              Base Likelihood: 4    [Add]    │
│    ○ Privilege Escalation (TH-022)          Base Likelihood: 3    [Add]    │
│    ○ Social Engineering (TH-008)            Base Likelihood: 4    [Add]    │
│                                                                             │
│ ✓ SELECTED:                                                                 │
│    ├── Credential Theft (TH-014)                              [Remove]     │
│    └── Privilege Escalation (TH-022)                          [Remove]     │
│                                                                             │
│ + Add another threat manually                                               │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 2: WHAT'S AT RISK? (Assets, Systems, Data, Governance Objects)         │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search assets, systems, governance objects...                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ 💡 SUGGESTED based on threats selected:                                     │
│    ○ Customer Database (AST-089)            Criticality: HIGH     [Add]    │
│    ○ CRM Application (AST-091)              Criticality: HIGH     [Add]    │
│    ○ API Gateway (AST-045)                  Criticality: MEDIUM   [Add]    │
│                                                                             │
│ ✓ SELECTED:                                                                 │
│    ├── Customer Database (AST-089)                            [Remove]     │
│    └── CRM Application (AST-091)                              [Remove]     │
│                                                                             │
│ + Add another asset/object                                                  │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 3: WHAT CONTROLS MITIGATE THIS?                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search controls by clause or name...                                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ 💡 SUGGESTED based on threats & assets:                                     │
│    ○ A.9.4.1 Access Control Policy          Maturity: 3.0/5      [Add]    │
│    ○ A.9.4.2 Secure Logon Procedures        Maturity: 2.5/5      [Add]    │
│    ○ A.9.4.3 Password Management            Maturity: 3.0/5      [Add]    │
│    ○ A.9.2.3 Privileged Access Mgmt         Maturity: 2.0/5      [Add]    │
│                                                                             │
│ ✓ SELECTED:                                                                 │
│    ├── A.9.4.1 Access Control Policy        Maturity: 3.0/5    [Remove]   │
│    ├── A.9.4.2 Secure Logon Procedures      Maturity: 2.5/5    [Remove]   │
│    └── A.9.4.3 Password Management          Maturity: 3.0/5    [Remove]   │
│                                                                             │
│ + Add another control                                                       │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 4: WHICH KRIs SHOULD WE MONITOR?                                       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search key risk indicators...                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ 💡 SUGGESTED based on threats & assets:                                     │
│    ○ Failed Login Attempts (KRI-007)        Current: 🔴 RED      [Add]    │
│    ○ Privileged Account Count (KRI-011)     Current: 🟢 GREEN    [Add]    │
│    ○ MFA Adoption Rate (KRI-015)            Current: 🟡 AMBER    [Add]    │
│                                                                             │
│ ✓ SELECTED:                                                                 │
│    ├── Failed Login Attempts (KRI-007)      Current: 🔴 RED    [Remove]   │
│    └── Privileged Account Count (KRI-011)   Current: 🟢 GREEN  [Remove]   │
│                                                                             │
│ + Add another KRI                                                           │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 5: RELATED BUSINESS CONTEXT (Optional)                                 │
│                                                                             │
│ Business Process:    [PRC-012] Customer Data Handling              [Change] │
│ Compliance Reqs:     ISO 27001 A.9, GDPR Art.32                    [Change] │
│ Business Objective:  [OBJ-003] Maintain Customer Trust             [Change] │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ DATA AVAILABILITY PREVIEW                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Based on your scenario links, we can calculate likelihood from:         │ │
│ │                                                                         │ │
│ │ ✅ Threat Frequency      2 threats with base likelihood data            │ │
│ │ ✅ Vulnerabilities       3 open CVEs found on linked assets             │ │
│ │ ✅ Control Maturity      3 of 3 controls have assessments               │ │
│ │ ✅ KRI Status            2 KRIs linked with current values              │ │
│ │ ⚠️  Incident History      No incidents linked to these threats/assets   │ │
│ │ ⚠️  Nonconformities       No open NCs on linked controls                │ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Estimated Confidence: HIGH (4/6 factors with data)                  │ │ │
│ │ │ Preliminary Likelihood: 3.2 (POSSIBLE)                              │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                    [Cancel]    [Save as Draft]    [Save & Calculate] →      │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Suggestion Engine Logic

The Scenario Builder provides intelligent suggestions based on context:

```typescript
interface ScenarioSuggestions {
  threats: ThreatSuggestion[];
  assets: AssetSuggestion[];
  controls: ControlSuggestion[];
  kris: KRISuggestion[];
}

// Suggestion sources by step
const SUGGESTION_LOGIC = {
  // Step 1: Suggest threats based on risk category
  threats: (riskCategory: RiskCategory) => {
    return threatCatalog.filter(t => t.categories.includes(riskCategory));
  },

  // Step 2: Suggest assets based on selected threats
  assets: (selectedThreats: string[]) => {
    // Find assets that have been affected by similar threats historically
    // Or assets tagged with threat-relevant classifications
    return assets.filter(a =>
      a.threatVectors.some(tv => selectedThreats.includes(tv)) ||
      incidents.some(i =>
        i.threatId in selectedThreats && i.assetId === a.id
      )
    );
  },

  // Step 3: Suggest controls based on threats AND assets
  controls: (selectedThreats: string[], selectedAssets: string[]) => {
    // ISO 27001 mapping: threats → relevant control domains
    const relevantDomains = threatToControlMapping[selectedThreats];
    // Also: controls already linked to selected assets
    return controls.filter(c =>
      relevantDomains.includes(c.domain) ||
      selectedAssets.some(a => a.linkedControls.includes(c.id))
    );
  },

  // Step 4: Suggest KRIs based on threats, assets, and controls
  kris: (context: { threats: string[], assets: string[], controls: string[] }) => {
    return kris.filter(k =>
      k.linkedThreats.some(t => context.threats.includes(t)) ||
      k.linkedAssets.some(a => context.assets.includes(a)) ||
      k.linkedControls.some(c => context.controls.includes(c))
    );
  },
};
```

#### Non-Tangible Risk Scenario Example

For risks without traditional assets, the builder adapts:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RISK SCENARIO BUILDER                                          [Save Draft] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Risk: Missing Information Security Policies                                 │
│ Category: COMPLIANCE                                                        │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 1: WHAT THREATS APPLY?                                                 │
│                                                                             │
│ ✓ SELECTED:                                                                 │
│    ├── Regulatory Non-Compliance (TH-031)                     [Remove]     │
│    └── Inconsistent Security Practices (TH-032)               [Remove]     │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 2: WHAT'S AT RISK?                                                     │
│                                                                             │
│ ℹ️  For COMPLIANCE risks, you can link governance objects instead of        │
│    traditional assets.                                                      │
│                                                                             │
│ Object Type: [Governance Document ▾]                                        │
│                                                                             │
│ ✓ SELECTED:                                                                 │
│    ├── Information Security Policy (GOV-001)    Status: MISSING  [Remove]  │
│    └── Acceptable Use Policy (GOV-002)          Status: MISSING  [Remove]  │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 3: WHAT CONTROLS SHOULD ADDRESS THIS?                                  │
│                                                                             │
│ 💡 SUGGESTED for policy governance:                                         │
│    ○ A.5.1 Policies for Information Security    Maturity: 1.0/5   [Add]   │
│                                                                             │
│ ✓ SELECTED:                                                                 │
│    └── A.5.1 Policies for Information Security  Maturity: 1.0/5  [Remove] │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 4: WHICH KRIs SHOULD WE MONITOR?                                       │
│                                                                             │
│ ✓ SELECTED:                                                                 │
│    ├── Policy Coverage Percentage (KRI-022)     Current: 🔴 20%  [Remove]  │
│    └── Policy Acknowledgment Rate (KRI-023)     Current: ⚪ N/A  [Remove]  │
│                                                                             │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ STEP 5: COMPLIANCE CONTEXT                                                  │
│                                                                             │
│ Regulatory Requirements:                                                    │
│    ├── ISO 27001 A.5.1                                          [Remove]   │
│    ├── NIS2 Article 21                                          [Remove]   │
│    └── DORA Article 9                                           [Remove]   │
│                                                                             │
│ Upcoming Deadline: NIS2 Compliance - June 2026 (6 months)                   │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│ DATA AVAILABILITY PREVIEW                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Based on your scenario links:                                           │ │
│ │                                                                         │ │
│ │ ✅ Threat Frequency      2 threats with base likelihood data            │ │
│ │ ⬚  Vulnerabilities       N/A - No traditional assets linked            │ │
│ │ ✅ Control Maturity      1 control assessed (maturity: 1.0)             │ │
│ │ ✅ KRI Status            1 KRI with data (KRI-022: RED)                 │ │
│ │ ⚠️  Incident History      No compliance incidents on record             │ │
│ │ ✅ Nonconformities       1 MAJOR NC on A.5.1                            │ │
│ │ ✅ Regulatory Pressure   NIS2 deadline in 6 months                      │ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Factors: 5/6 applicable (Vulnerability excluded)                    │ │ │
│ │ │ + 1 conditional factor (Regulatory Pressure)                        │ │ │
│ │ │ Estimated Confidence: HIGH                                          │ │ │
│ │ │ Preliminary Likelihood: 4.2 (LIKELY)                                │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                    [Cancel]    [Save as Draft]    [Save & Calculate] →      │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Scenario Builder Implementation

```typescript
// Frontend component structure
interface ScenarioBuilderProps {
  riskId: string;
  initialScenario?: RiskScenario;
  onSave: (scenario: RiskScenario) => void;
}

// State management
interface ScenarioBuilderState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  riskCategory: RiskCategory;
  selectedThreats: string[];
  selectedAssets: string[];  // Can include GOV-xxx for governance objects
  selectedControls: string[];
  selectedKRIs: string[];
  businessContext: {
    processId?: string;
    requirementIds: string[];
    objectiveId?: string;
  };
  suggestions: ScenarioSuggestions;
  dataPreview: DataAvailabilityPreview;
}

// API endpoint for suggestions
// GET /api/risks/scenarios/suggestions
// Query params: riskCategory, threats[], assets[], controls[]
// Returns: ScenarioSuggestions

// API endpoint for data preview
// POST /api/risks/scenarios/preview
// Body: { threats[], assets[], controls[], kris[] }
// Returns: DataAvailabilityPreview with preliminary likelihood
```

### Value Proposition

| Metric | Before | After |
|--------|--------|-------|
| Assessment basis | Subjective | Evidence-based |
| Update frequency | Quarterly review | Real-time |
| Audit evidence | Manual notes | Automated trail |
| Consistency | Variable | Weighted formula |
| Risk manager focus | All risks | Divergent risks only |

---

## Risk Categories

**Important:** Not all risks relate to tangible assets. The framework supports both asset-based and non-asset risks with dynamic factor selection.

### Risk Category Types

```typescript
type RiskCategory =
  | 'CYBER_SECURITY'      // Asset-based: servers, databases, networks
  | 'OPERATIONAL'         // Process-based: workflows, procedures
  | 'COMPLIANCE'          // Regulatory: NIS2, GDPR, DORA
  | 'STRATEGIC'           // Business: market, competition, decisions
  | 'FINANCIAL'           // Money: fraud, credit, liquidity
  | 'REPUTATIONAL'        // Brand: trust, public perception
  | 'THIRD_PARTY'         // Vendors: suppliers, outsourcing
  | 'PEOPLE'              // HR: skills, retention, succession
  | 'ENVIRONMENTAL'       // Physical: disasters, climate
  | 'LEGAL';              // Contracts: litigation, IP
```

### Asset vs Non-Asset Risks

| Category | Has Assets | Example Risks |
|----------|------------|---------------|
| **CYBER_SECURITY** | ✅ Yes | Unauthorized Data Access, Ransomware, Network Intrusion |
| **OPERATIONAL** | ❌ No | Process Failure, Service Disruption, Quality Issues |
| **COMPLIANCE** | ❌ No | Regulatory Non-Compliance, License Violations |
| **STRATEGIC** | ❌ No | Market Shift, Competition, Failed Initiative |
| **FINANCIAL** | ❌ No | Fraud, Budget Overrun, Currency Risk |
| **REPUTATIONAL** | ❌ No | Brand Damage, Negative Press, Trust Erosion |
| **THIRD_PARTY** | ⚠️ Sometimes | Vendor Breach, Supply Chain Disruption |
| **PEOPLE** | ❌ No | Key Person Departure, Skills Gap, Misconduct |
| **ENVIRONMENTAL** | ⚠️ Sometimes | Natural Disaster, Climate Impact |
| **LEGAL** | ❌ No | Contract Dispute, IP Infringement, Litigation |

---

## Likelihood Factors

### Universal Factors (Apply to ALL Risk Types)

| # | Factor | Base Weight | Data Source | Description |
|---|--------|-------------|-------------|-------------|
| 1 | Threat Frequency | 20% | `ThreatCatalog` | Historical threat occurrence rate |
| 2 | Control Maturity | 20% | `CapabilityAssessment` | Preventive control effectiveness (inverted) |
| 3 | Incident History | 15% | `Incident` | Past incidents of similar type |
| 4 | KRI Status | 15% | `KeyRiskIndicator` | Current key risk indicator trends |
| 5 | Nonconformities | 10% | `Nonconformity` | Open audit findings affecting controls |

### Conditional Factors (Apply Based on Risk Category)

| # | Factor | Base Weight | Data Source | Applies To |
|---|--------|-------------|-------------|------------|
| 6 | Vulnerability Exposure | 20% | `VulnerabilityEntry` | CYBER_SECURITY, THIRD_PARTY (with assets) |
| 7 | Regulatory Pressure | 15% | `RegulatoryDeadline` | COMPLIANCE |
| 8 | Vendor Dependency | 15% | `Vendor.riskScore` | THIRD_PARTY |
| 9 | People Turnover | 15% | `HR metrics` | PEOPLE |
| 10 | Market Volatility | 15% | External feeds | STRATEGIC |
| 11 | External Factors | 0% | Manual input | All (placeholder) |

### Factor Categories

```typescript
type LikelihoodFactorCategory =
  // Universal factors
  | 'THREAT_FREQUENCY'       // Historical threat occurrence rate
  | 'CONTROL_MATURITY'       // Preventive control effectiveness
  | 'INCIDENT_HISTORY'       // Past incidents of similar type
  | 'KRI_STATUS'             // Key risk indicator trends
  | 'NONCONFORMITY'          // Open audit findings
  // Conditional factors
  | 'VULNERABILITY_EXPOSURE' // Technical vulnerability presence (asset risks)
  | 'REGULATORY_PRESSURE'    // Upcoming deadlines, enforcement (compliance risks)
  | 'VENDOR_DEPENDENCY'      // Vendor risk scores (third-party risks)
  | 'PEOPLE_TURNOVER'        // Key person changes (people risks)
  | 'MARKET_VOLATILITY'      // Industry disruption (strategic risks)
  | 'EXTERNAL_FACTORS';      // Manual input (all risks)
```

### Default Weights by Risk Category

```typescript
// Base weights for universal factors
const UNIVERSAL_FACTOR_WEIGHTS = {
  THREAT_FREQUENCY: 20,
  CONTROL_MATURITY: 20,
  INCIDENT_HISTORY: 15,
  KRI_STATUS: 15,
  NONCONFORMITY: 10,
};

// Conditional factor weights (added when applicable)
const CONDITIONAL_FACTOR_WEIGHTS = {
  VULNERABILITY_EXPOSURE: 20,   // For CYBER_SECURITY
  REGULATORY_PRESSURE: 15,      // For COMPLIANCE
  VENDOR_DEPENDENCY: 15,        // For THIRD_PARTY
  PEOPLE_TURNOVER: 15,          // For PEOPLE
  MARKET_VOLATILITY: 15,        // For STRATEGIC
  EXTERNAL_FACTORS: 0,          // Placeholder for all
};
```

---

## Factor Applicability Matrix

### Which Factors Apply to Each Risk Category

```
                          UNIVERSAL FACTORS                    CONDITIONAL
                    ┌───────────────────────────────────┐   ┌─────────────────┐
Risk Category       │ Threat │Control│Incident│ KRI  │ NC │ Vuln │Reg │Vendor│People│Market
────────────────────┼────────┼───────┼────────┼──────┼────┼──────┼────┼──────┼──────┼──────
CYBER_SECURITY      │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │  ✅  │    │      │      │
OPERATIONAL         │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │      │    │      │      │
COMPLIANCE          │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │      │ ✅ │      │      │
STRATEGIC           │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │      │    │      │      │  ✅
FINANCIAL           │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │      │    │      │      │
REPUTATIONAL        │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │      │    │      │      │
THIRD_PARTY         │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │  ⚠️  │    │  ✅  │      │
PEOPLE              │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │      │    │      │  ✅  │
ENVIRONMENTAL       │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │  ⚠️  │    │      │      │
LEGAL               │   ✅   │  ✅   │   ✅   │  ✅  │ ✅ │      │    │      │      │
────────────────────┼────────┼───────┼────────┼──────┼────┼──────┼────┼──────┼──────┼──────
Base Weight         │  20%   │  20%  │  15%   │ 15%  │10% │ 20%  │15% │ 15%  │ 15%  │ 15%

⚠️ = Applies only if risk has linked assets
```

### Factor Selection Logic

```typescript
function getApplicableFactors(riskCategory: RiskCategory, hasLinkedAssets: boolean): LikelihoodFactorCategory[] {
  // Universal factors always apply
  const factors: LikelihoodFactorCategory[] = [
    'THREAT_FREQUENCY',
    'CONTROL_MATURITY',
    'INCIDENT_HISTORY',
    'KRI_STATUS',
    'NONCONFORMITY',
  ];

  // Add conditional factors based on category
  switch (riskCategory) {
    case 'CYBER_SECURITY':
      factors.push('VULNERABILITY_EXPOSURE');
      break;
    case 'COMPLIANCE':
      factors.push('REGULATORY_PRESSURE');
      break;
    case 'THIRD_PARTY':
      factors.push('VENDOR_DEPENDENCY');
      if (hasLinkedAssets) factors.push('VULNERABILITY_EXPOSURE');
      break;
    case 'PEOPLE':
      factors.push('PEOPLE_TURNOVER');
      break;
    case 'STRATEGIC':
      factors.push('MARKET_VOLATILITY');
      break;
    case 'ENVIRONMENTAL':
      if (hasLinkedAssets) factors.push('VULNERABILITY_EXPOSURE');
      break;
    // OPERATIONAL, FINANCIAL, REPUTATIONAL, LEGAL use universal factors only
  }

  return factors;
}
```

---

## Dynamic Weight Redistribution

When a factor is **not applicable** to a risk category, its weight is redistributed proportionally to the remaining factors.

### Weight Scaling Formula

```
Scaled Weight = (Original Weight / Sum of Applicable Weights) × 100
```

### Example: COMPLIANCE Risk (No Vulnerabilities)

```
CYBER_SECURITY Risk (6 factors):
  Threat: 20% + Vuln: 20% + Control: 20% + Incident: 15% + KRI: 15% + NC: 10% = 100%

COMPLIANCE Risk (6 factors, different set):
  Original applicable weights:
    Threat: 20% + Control: 20% + Incident: 15% + KRI: 15% + NC: 10% + Regulatory: 15% = 95%

  Scale to 100%:
    Factor = 100 / 95 = 1.053

  Final weights:
    Threat:     20% × 1.053 = 21.05%
    Control:    20% × 1.053 = 21.05%
    Incident:   15% × 1.053 = 15.79%
    KRI:        15% × 1.053 = 15.79%
    NC:         10% × 1.053 = 10.53%
    Regulatory: 15% × 1.053 = 15.79%
    ─────────────────────────────────
    TOTAL:                  = 100%
```

### Example: OPERATIONAL Risk (5 Universal Factors Only)

```
Universal factors only:
  Threat: 20% + Control: 20% + Incident: 15% + KRI: 15% + NC: 10% = 80%

Scale to 100%:
  Factor = 100 / 80 = 1.25

Final weights:
  Threat:   20% × 1.25 = 25%
  Control:  20% × 1.25 = 25%
  Incident: 15% × 1.25 = 18.75%
  KRI:      15% × 1.25 = 18.75%
  NC:       10% × 1.25 = 12.5%
  ─────────────────────────────
  TOTAL:              = 100%
```

### Weight Redistribution Function

```typescript
function redistributeWeights(
  applicableFactors: LikelihoodFactorCategory[],
  baseWeights: Record<LikelihoodFactorCategory, number>
): Record<LikelihoodFactorCategory, number> {
  // Sum weights of applicable factors
  const totalApplicable = applicableFactors.reduce(
    (sum, factor) => sum + baseWeights[factor],
    0
  );

  // Scale factor to reach 100%
  const scaleFactor = 100 / totalApplicable;

  // Calculate redistributed weights
  const redistributed: Record<string, number> = {};
  for (const factor of applicableFactors) {
    redistributed[factor] = baseWeights[factor] * scaleFactor;
  }

  return redistributed as Record<LikelihoodFactorCategory, number>;
}
```

### Weight Summary by Risk Category

| Risk Category | Active Factors | Weights After Redistribution |
|---------------|----------------|------------------------------|
| CYBER_SECURITY | 6 (universal + vuln) | Threat 20%, Vuln 20%, Control 20%, Incident 15%, KRI 15%, NC 10% |
| COMPLIANCE | 6 (universal + regulatory) | Threat 21%, Control 21%, Incident 16%, KRI 16%, NC 11%, Reg 16% |
| THIRD_PARTY | 6 (universal + vendor) | Threat 21%, Control 21%, Incident 16%, KRI 16%, NC 11%, Vendor 16% |
| PEOPLE | 6 (universal + turnover) | Threat 21%, Control 21%, Incident 16%, KRI 16%, NC 11%, Turnover 16% |
| STRATEGIC | 6 (universal + market) | Threat 21%, Control 21%, Incident 16%, KRI 16%, NC 11%, Market 16% |
| OPERATIONAL | 5 (universal only) | Threat 25%, Control 25%, Incident 19%, KRI 19%, NC 13% |
| FINANCIAL | 5 (universal only) | Threat 25%, Control 25%, Incident 19%, KRI 19%, NC 13% |
| REPUTATIONAL | 5 (universal only) | Threat 25%, Control 25%, Incident 19%, KRI 19%, NC 13% |
| LEGAL | 5 (universal only) | Threat 25%, Control 25%, Incident 19%, KRI 19%, NC 13% |

---

## Factor Calculation Details

### 1. Threat Frequency Factor

**Source:** `ThreatCatalog.baseLikelihood`

Uses the threat's historical occurrence rate from the threat catalog.

```typescript
function calculateThreatFrequencyFactor(
  baseLikelihood: number,  // 1-5 from ThreatCatalog
  threatName?: string
): LikelihoodFactor {
  return {
    id: 'threat-frequency',
    name: 'Threat Base Likelihood',
    category: 'THREAT_FREQUENCY',
    value: baseLikelihood,  // Direct use
    weight: 20,
    confidence: 'HIGH',
    source: 'ThreatCatalog',
    details: `Based on ${threatName} threat profile`,
  };
}
```

### 2. Vulnerability Exposure Factor

**Source:** `VulnerabilityEntry` linked to assets

Calculates exposure based on open vulnerabilities.

```typescript
function calculateVulnerabilityFactor(
  vulnerabilities: Array<{ severity: number; status: string }>
): LikelihoodFactor {
  const openVulns = vulnerabilities.filter(v => v.status === 'OPEN');

  if (openVulns.length === 0) {
    return { value: 1, details: 'All vulnerabilities mitigated' };
  }

  const maxSeverity = Math.max(...openVulns.map(v => v.severity));
  const avgSeverity = average(openVulns.map(v => v.severity));

  // 70% max, 30% average
  const exposureValue = Math.round(maxSeverity * 0.7 + avgSeverity * 0.3);

  return {
    value: clamp(exposureValue, 1, 5),
    details: `${openVulns.length} open vulns (max severity: ${maxSeverity})`,
  };
}
```

### 3. Control Maturity Factor (INVERTED)

**Source:** `CapabilityAssessment.currentMaturity`

**Important:** This factor is inverted - higher maturity = LOWER likelihood contribution.

```typescript
function calculateControlMaturityFactor(
  assessments: Array<{ currentMaturity: number }>
): LikelihoodFactor {
  const avgMaturity = average(assessments.map(a => a.currentMaturity));

  // INVERT: High maturity (5) = Low likelihood (1)
  const likelihoodContribution = Math.round(5 - avgMaturity);

  // Maturity 0-1 → likelihood 5
  // Maturity 2   → likelihood 3
  // Maturity 3   → likelihood 2
  // Maturity 4-5 → likelihood 1

  return {
    value: clamp(likelihoodContribution, 1, 5),
    details: `Avg maturity: ${avgMaturity.toFixed(1)}/5`,
  };
}
```

### 4. Incident History Factor

**Source:** `Incident` records (last 24 months)

```typescript
function calculateIncidentHistoryFactor(
  incidents: Array<{ occurredAt: Date; severity: string }>,
  lookbackMonths: number = 24
): LikelihoodFactor {
  const recentIncidents = filterByDate(incidents, lookbackMonths);

  // Frequency-based scoring
  let value: number;
  if (recentIncidents.length >= 7) value = 5;
  else if (recentIncidents.length >= 4) value = 4;
  else if (recentIncidents.length >= 2) value = 3;
  else if (recentIncidents.length >= 1) value = 2;
  else value = 1;

  // Boost for HIGH/CRITICAL severity
  const highSeverityCount = recentIncidents.filter(
    i => i.severity === 'HIGH' || i.severity === 'CRITICAL'
  ).length;

  if (highSeverityCount > 0 && value < 5) {
    value += 1;
  }

  return {
    value,
    details: `${recentIncidents.length} incidents in last ${lookbackMonths} months`,
  };
}
```

### 5. KRI Status Factor

**Source:** `KeyRiskIndicator.status` (RAG)

```typescript
function calculateKRIStatusFactor(
  kris: Array<{ status: 'RED' | 'AMBER' | 'GREEN' }>
): LikelihoodFactor {
  // RED = 5, AMBER = 3, GREEN = 1
  const redCount = kris.filter(k => k.status === 'RED').length;
  const amberCount = kris.filter(k => k.status === 'AMBER').length;
  const greenCount = kris.filter(k => k.status === 'GREEN').length;

  const totalScore = redCount * 5 + amberCount * 3 + greenCount * 1;
  const avgScore = totalScore / kris.length;

  return {
    value: Math.round(avgScore),
    details: `${redCount} RED, ${amberCount} AMBER, ${greenCount} GREEN`,
  };
}
```

### 6. Nonconformity Factor

**Source:** `Nonconformity` (open NCs on linked controls)

```typescript
function calculateNonconformityFactor(
  nonconformities: Array<{ status: string; severity: string }>
): LikelihoodFactor {
  const openNCs = nonconformities.filter(
    nc => nc.status !== 'CLOSED' && nc.status !== 'VERIFIED'
  );

  if (openNCs.length === 0) {
    return { value: 1, details: 'No open nonconformities' };
  }

  const majorCount = openNCs.filter(nc => nc.severity === 'MAJOR').length;
  const minorCount = openNCs.filter(nc => nc.severity === 'MINOR').length;

  let value: number;
  if (majorCount > 0) value = 5;
  else if (minorCount >= 3) value = 4;
  else if (minorCount >= 1) value = 3;
  else value = 2;

  return {
    value,
    details: `${openNCs.length} open NCs (${majorCount} major, ${minorCount} minor)`,
  };
}
```

---

## Conditional Factor Calculations

These factors only apply to specific risk categories.

### 7. Regulatory Pressure Factor (COMPLIANCE Risks)

**Source:** `RegulatoryDeadline`, enforcement actions, regulatory news

```typescript
function calculateRegulatoryPressureFactor(
  deadlines: Array<{
    name: string;
    deadline: Date;
    penaltyRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  }>,
  enforcementActions: number // In sector, last 12 months
): LikelihoodFactor | null {
  if (!deadlines || deadlines.length === 0) {
    return null;
  }

  const now = new Date();
  const upcomingDeadlines = deadlines.filter(d => d.deadline > now);

  if (upcomingDeadlines.length === 0) {
    return { value: 1, details: 'No upcoming regulatory deadlines' };
  }

  // Find nearest deadline
  const nearest = upcomingDeadlines.sort(
    (a, b) => a.deadline.getTime() - b.deadline.getTime()
  )[0];

  const monthsUntil = Math.floor(
    (nearest.deadline.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );

  // Scoring based on time to deadline
  let timeValue: number;
  if (monthsUntil <= 3) timeValue = 5;      // Critical: < 3 months
  else if (monthsUntil <= 6) timeValue = 4; // Urgent: 3-6 months
  else if (monthsUntil <= 12) timeValue = 3; // Near: 6-12 months
  else if (monthsUntil <= 24) timeValue = 2; // Distant: 12-24 months
  else timeValue = 1;                        // Far: > 24 months

  // Boost for enforcement actions in sector
  if (enforcementActions >= 3 && timeValue < 5) timeValue += 1;
  else if (enforcementActions >= 1 && timeValue < 5) timeValue += 0.5;

  // Boost for HIGH penalty risk
  if (nearest.penaltyRisk === 'HIGH' && timeValue < 5) timeValue += 0.5;

  return {
    id: 'regulatory-pressure',
    name: 'Regulatory Pressure',
    category: 'REGULATORY_PRESSURE',
    value: Math.min(5, Math.round(timeValue)),
    weight: 15,
    confidence: 'HIGH',
    source: 'RegulatoryDeadline',
    details: `${nearest.name} in ${monthsUntil} months; ${enforcementActions} sector enforcements`,
    dataPoints: deadlines.length,
  };
}
```

### 8. Vendor Dependency Factor (THIRD_PARTY Risks)

**Source:** `Vendor.residualRiskScore`, vendor tier, single points of failure

```typescript
function calculateVendorDependencyFactor(
  vendors: Array<{
    name: string;
    residualRiskScore: number;  // 1-5
    tier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    singlePointOfFailure: boolean;
  }>
): LikelihoodFactor | null {
  if (!vendors || vendors.length === 0) {
    return null;
  }

  // Weight by tier importance
  const tierWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let spofCount = 0;
  let criticalHighRisk = 0;

  for (const vendor of vendors) {
    const weight = tierWeight[vendor.tier];
    totalWeightedScore += vendor.residualRiskScore * weight;
    totalWeight += weight;

    if (vendor.singlePointOfFailure) spofCount++;
    if (vendor.tier === 'CRITICAL' && vendor.residualRiskScore >= 4) criticalHighRisk++;
  }

  let value = Math.round(totalWeightedScore / totalWeight);

  // Boost for single points of failure
  if (spofCount > 0 && value < 5) value += 1;

  // Boost for high-risk critical vendors
  if (criticalHighRisk > 0 && value < 5) value += 0.5;

  return {
    id: 'vendor-dependency',
    name: 'Vendor Dependency',
    category: 'VENDOR_DEPENDENCY',
    value: Math.min(5, Math.round(value)),
    weight: 15,
    confidence: vendors.length >= 3 ? 'HIGH' : 'MEDIUM',
    source: 'Vendor',
    details: `${vendors.length} vendors; ${spofCount} SPOF; ${criticalHighRisk} critical high-risk`,
    dataPoints: vendors.length,
  };
}
```

### 9. People Turnover Factor (PEOPLE Risks)

**Source:** HR metrics, key person roles, succession planning status

```typescript
function calculatePeopleTurnoverFactor(
  keyRoles: Array<{
    role: string;
    vacancyStatus: 'FILLED' | 'VACANT' | 'NOTICE_GIVEN';
    successorIdentified: boolean;
    tenureMonths: number;
  }>,
  annualTurnoverRate: number // Organization-wide percentage
): LikelihoodFactor | null {
  if (!keyRoles || keyRoles.length === 0) {
    return null;
  }

  let value = 1;
  const vacantCount = keyRoles.filter(r => r.vacancyStatus === 'VACANT').length;
  const noticeCount = keyRoles.filter(r => r.vacancyStatus === 'NOTICE_GIVEN').length;
  const noSuccessorCount = keyRoles.filter(r => !r.successorIdentified).length;
  const lowTenureCount = keyRoles.filter(r => r.tenureMonths < 12).length;

  // Scoring based on key role status
  if (vacantCount > 0) value = 5;           // Vacant key role = critical
  else if (noticeCount > 0) value = 4;       // Notice period = urgent
  else if (noSuccessorCount >= 3) value = 4; // Multiple succession gaps
  else if (noSuccessorCount >= 1) value = 3; // Some succession gaps
  else if (lowTenureCount >= 2) value = 2;   // Low tenure concern
  else value = 1;

  // Boost for high org turnover
  if (annualTurnoverRate > 20 && value < 5) value += 1;
  else if (annualTurnoverRate > 15 && value < 5) value += 0.5;

  return {
    id: 'people-turnover',
    name: 'People Turnover',
    category: 'PEOPLE_TURNOVER',
    value: Math.min(5, Math.round(value)),
    weight: 15,
    confidence: 'HIGH',
    source: 'HR Metrics',
    details: `${vacantCount} vacant, ${noticeCount} notice; ${noSuccessorCount} no successor; ${annualTurnoverRate}% turnover`,
    dataPoints: keyRoles.length,
  };
}
```

### 10. Market Volatility Factor (STRATEGIC Risks)

**Source:** External feeds, industry indices, competitor activity

```typescript
function calculateMarketVolatilityFactor(
  indicators: {
    industryDisruptionIndex: number;    // 1-5 from external feed
    competitorActivityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    marketGrowthRate: number;           // Percentage YoY
    regulatoryChangePending: boolean;
  }
): LikelihoodFactor | null {
  let value = indicators.industryDisruptionIndex;

  // Adjust for competitor activity
  if (indicators.competitorActivityLevel === 'HIGH' && value < 5) {
    value += 1;
  } else if (indicators.competitorActivityLevel === 'MEDIUM' && value < 5) {
    value += 0.5;
  }

  // Adjust for market decline (negative growth increases risk)
  if (indicators.marketGrowthRate < -10 && value < 5) {
    value += 1;
  } else if (indicators.marketGrowthRate < 0 && value < 5) {
    value += 0.5;
  }

  // Adjust for pending regulatory changes
  if (indicators.regulatoryChangePending && value < 5) {
    value += 0.5;
  }

  return {
    id: 'market-volatility',
    name: 'Market Volatility',
    category: 'MARKET_VOLATILITY',
    value: Math.min(5, Math.round(value)),
    weight: 15,
    confidence: 'MEDIUM', // External data quality varies
    source: 'External Feeds',
    details: `Disruption: ${indicators.industryDisruptionIndex}/5; Competition: ${indicators.competitorActivityLevel}; Growth: ${indicators.marketGrowthRate}%`,
    dataPoints: 4,
  };
}
```

---

## Worked Example - Asset Risk

### Risk: R-03 "Unauthorized Data Access"

**Risk Category:** CYBER_SECURITY (asset-based, uses Vulnerability factor)

**Scenario:** `R-03-S01` - "External attacker gains access to customer database through compromised credentials"

### Factor Inputs

| Factor | Source Data | Raw Value |
|--------|-------------|-----------|
| Threat Frequency | ThreatCatalog → "Credential Theft" | baseLikelihood = 4 |
| Vulnerability Exposure | 2 OPEN vulns on DB server (severity 4, 3) | Max = 4 |
| Control Maturity | 3 linked capabilities avg maturity 2.8/5 | Inverted → 2 |
| Incident History | 1 related incident in last 24 months | Value = 2 |
| KRI Status | KRI-01: RED, KRI-02: AMBER, KRI-03: GREEN | Avg = 3 |
| Nonconformities | 1 MINOR open NC on A.9.4 (Access Control) | Value = 3 |

### Calculation

```
Factor                    Value   Weight   Contribution
─────────────────────────────────────────────────────────
Threat Frequency            4    × 20%   =    0.80
Vulnerability Exposure      4    × 20%   =    0.80
Control Maturity            2    × 20%   =    0.40
Incident History            2    × 15%   =    0.30
KRI Status                  3    × 15%   =    0.45
Nonconformities             3    × 10%   =    0.30
─────────────────────────────────────────────────────────
                           TOTAL         =    3.05

Suggested Likelihood: 3 (POSSIBLE)
Confidence: HIGH (6/6 factors, 100% coverage)
```

### Comparison with Manual Assessment

| | Value | Level |
|---|---|---|
| Calculated | 3.05 | POSSIBLE |
| Manual (user entered) | 2 | UNLIKELY |
| Difference | +1 | Manual is lower |

**System Recommendation:**
> "Consider reviewing - evidence suggests higher likelihood may be warranted. Threat frequency (4/5) and open vulnerabilities (2) indicate elevated risk."

### What Happens When Data Changes

| Event | Effect on Likelihood |
|-------|---------------------|
| Both vulnerabilities patched | Vuln factor drops 4→1, new suggested = 2.4 (UNLIKELY) |
| Another incident occurs | Incident factor rises 2→3, new suggested = 3.2 (POSSIBLE) |
| Control maturity improves to 4.0 | Maturity factor drops 2→1, new suggested = 2.8 (POSSIBLE) |
| KRI-01 moves RED→GREEN | KRI factor drops 3→1.7, new suggested = 2.8 (POSSIBLE) |
| NC is closed | NC factor drops 3→1, new suggested = 2.8 (POSSIBLE) |

---

## Worked Example - Non-Asset Risk

### Risk: R-08 "Regulatory Non-Compliance (NIS2)"

**Risk Category:** COMPLIANCE (no assets, uses Regulatory Pressure factor)

**Scenario:** `R-08-S01` - "Organization fails to meet NIS2 requirements by enforcement deadline"

### Factor Selection

Since this is a COMPLIANCE risk with no linked assets:
- ❌ Vulnerability Exposure factor is **excluded**
- ✅ Regulatory Pressure factor is **included**

### Factor Inputs

| Factor | Source Data | Raw Value |
|--------|-------------|-----------|
| Threat Frequency | ThreatCatalog → "Regulatory Enforcement" | baseLikelihood = 4 |
| Control Maturity | Compliance controls avg maturity 2.0/5 | Inverted → 3 |
| Incident History | No compliance incidents in 24 months | Value = 1 |
| KRI Status | KRI-01: RED (gap %), KRI-02: RED (training), KRI-03: GREEN (budget) | Avg = 3.7 |
| Nonconformities | 2 MINOR open NCs on A.18 (Compliance) | Value = 3 |
| Regulatory Pressure | NIS2 deadline in 6 months, 2 enforcement actions in sector | Value = 4 |

### Weight Redistribution

```
Applicable factors (COMPLIANCE category):
  Threat: 20% + Control: 20% + Incident: 15% + KRI: 15% + NC: 10% + Regulatory: 15% = 95%

Scale factor: 100 / 95 = 1.053

Redistributed weights:
  Threat:     21.05%
  Control:    21.05%
  Incident:   15.79%
  KRI:        15.79%
  NC:         10.53%
  Regulatory: 15.79%
```

### Calculation

```
Factor                    Value   Scaled Weight   Contribution
───────────────────────────────────────────────────────────────
Threat Frequency            4      × 21.05%     =    0.84
Control Maturity            3      × 21.05%     =    0.63
Incident History            1      × 15.79%     =    0.16
KRI Status                  4      × 15.79%     =    0.63
Nonconformities             3      × 10.53%     =    0.32
Regulatory Pressure         4      × 15.79%     =    0.63
───────────────────────────────────────────────────────────────
                           TOTAL               =    3.21

Suggested Likelihood: 3 (POSSIBLE)
Confidence: HIGH (6/6 applicable factors)
```

### Key Differences from Asset-Based Risk

| Aspect | Asset Risk (R-03) | Non-Asset Risk (R-08) |
|--------|-------------------|----------------------|
| Category | CYBER_SECURITY | COMPLIANCE |
| Has vulnerabilities | ✅ Yes (2 open) | ❌ No |
| Conditional factor | Vulnerability Exposure | Regulatory Pressure |
| Weight redistribution | None (100% with 6 factors) | Scaled 95% → 100% |
| Primary drivers | Vulns, Threat Intel | Regulatory deadlines, KRIs |

### Dashboard Display for Non-Asset Risk

```
┌─── FACTOR BREAKDOWN (Compliance Risk) ────────────────────────────────┐
│                                                                        │
│  THREAT FREQUENCY (21.05%)                              Value: 4/5    │
│  ├─ Source: ThreatCatalog → "Regulatory Enforcement"                  │
│  ├─ Enforcement actions increasing industry-wide                      │
│  └─ Confidence: HIGH                                                  │
│      ████████████████████░░░░░                                         │
│                                                                        │
│  CONTROL MATURITY (21.05%)                              Value: 3/5    │
│  ├─ Source: CapabilityAssessment                                      │
│  ├─ 4 compliance capabilities, avg maturity: 2.0/5                    │
│  │   • A.18.1.1 Compliance requirements (2.5)                         │
│  │   • A.18.1.2 Legal requirements (2.0)                              │
│  │   • A.18.1.3 Privacy protection (1.5)                              │
│  │   • A.18.1.4 Crypto controls (2.0)                                 │
│  └─ Confidence: HIGH (4 data points)                                  │
│      ████████████░░░░░░░░░░░░░  ← Low maturity = Higher likelihood    │
│                                                                        │
│  REGULATORY PRESSURE (15.79%)                           Value: 4/5    │
│  ├─ Source: RegulatoryDeadline                                        │
│  ├─ NIS2 compliance deadline: June 2026 (6 months)                    │
│  ├─ 2 enforcement actions in sector this year                         │
│  └─ Confidence: HIGH                                                  │
│      ████████████████████░░░░░                                         │
│                                                                        │
│  KRI STATUS (15.79%)                                    Value: 4/5    │
│  ├─ Source: KeyRiskIndicator                                          │
│  ├─ 3 KRIs: 2 RED, 0 AMBER, 1 GREEN                                   │
│  │   • 🔴 NIS2 gap closure % (42% - target 80%)                       │
│  │   • 🔴 Staff training completion (35% - target 90%)                │
│  │   • 🟢 Compliance budget utilization (78%)                         │
│  └─ Confidence: HIGH (3 data points)                                  │
│      ████████████████████░░░░░                                         │
│                                                                        │
│  NONCONFORMITIES (10.53%)                               Value: 3/5    │
│  ├─ Source: Nonconformity                                             │
│  ├─ 2 MINOR open NCs on A.18 clauses                                  │
│  │   • NC-2025-003 - Policy review cycle incomplete                   │
│  │   • NC-2025-008 - Legal register not updated                       │
│  └─ Confidence: HIGH                                                  │
│      ████████████░░░░░░░░░░░░░                                         │
│                                                                        │
│  INCIDENT HISTORY (15.79%)                              Value: 1/5    │
│  ├─ Source: Incident                                                  │
│  ├─ No compliance incidents in last 24 months                         │
│  └─ Confidence: MEDIUM (absence of evidence)                          │
│      ████░░░░░░░░░░░░░░░░░░░░░  ← Good track record                   │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ ℹ️  VULNERABILITY EXPOSURE factor excluded                      │   │
│  │     Reason: COMPLIANCE risk has no linked assets                │   │
│  │     Weight redistributed to other factors                       │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Comparison with Manual Assessment

| | Value | Level |
|---|---|---|
| Calculated | 3.21 | POSSIBLE |
| Manual (user entered) | 4 | LIKELY |
| Difference | -1 | Manual is higher |

**System Recommendation:**
> "Manual assessment is slightly more conservative than evidence suggests. This may be appropriate given imminent NIS2 deadline and organizational risk appetite. Consider validating the Regulatory Pressure factor includes all relevant enforcement signals."

---

## Continuous Monitoring

### Traditional vs Continuous Approach

**Traditional (Point-in-Time):**
```
Risk Assessed → Likelihood Set → Stays Static Until Next Review
     ↓
  (3 months pass, vulnerabilities found, incidents occur)
     ↓
  Likelihood still shows old value ❌
```

**Continuous (Event-Driven):**
```
Risk Assessed → Likelihood Set → Factors Continuously Recalculated
     ↓                                    ↓
  Vulnerability patched          →  Factor auto-updates
  Incident occurs                →  Factor auto-updates
  KRI goes RED                   →  Factor auto-updates
  Control maturity improves      →  Factor auto-updates
     ↓
  Suggested likelihood reflects current reality ✓
```

### Calculation Approaches

| Approach | When Calculated | Pro | Con |
|----------|-----------------|-----|-----|
| **On-Demand** | When user views risk | Always fresh, no background jobs | Slight delay on page load |
| **Event-Driven** | When source data changes | Instant display, enables alerts | Needs event bus infrastructure |

### Alert Generation

When recalculation detects significant change:

```typescript
async handleFactorChange(riskId: string) {
  const current = await this.getLikelihoodFactors(riskId);
  const previous = risk.likelihood; // Manual/last assessment

  if (current.suggestedValue - previous >= 2) {
    // Likelihood increased by 2+ levels
    await this.alertService.create({
      riskId,
      alertType: 'LIKELIHOOD_INCREASED',
      severity: 'HIGH',
      message: `Evidence suggests likelihood increased from ${previous} to ${current.suggestedValue}`,
    });
  }
}
```

---

## Event-Driven Architecture

### Event Types

```typescript
type RiskEvent =
  | { type: 'VULNERABILITY_UPDATED'; assetId: string }
  | { type: 'INCIDENT_CREATED'; incidentId: string }
  | { type: 'CONTROL_MATURITY_CHANGED'; capabilityId: string }
  | { type: 'KRI_VALUE_RECORDED'; kriId: string; status: RAGStatus }
  | { type: 'NONCONFORMITY_OPENED'; ncId: string }
  | { type: 'NONCONFORMITY_CLOSED'; ncId: string }
  | { type: 'THREAT_LIKELIHOOD_UPDATED'; threatId: string };
```

### Event Flow

```
SOURCE SYSTEMS                    EVENT BUS                      RISK UPDATES
──────────────                    ─────────                      ────────────

┌──────────────┐
│    ITSM      │ ──Vuln Patched──┐
│  Module      │                  │
│ (Asset,Vuln) │ ──Asset Updated─┤
└──────────────┘                  │
                                  │
┌──────────────┐                  │     ┌──────────────────┐     ┌──────────────────┐
│   INCIDENT   │ ──New Incident──┤     │                  │     │                  │
│   Module     │                  ├────▶│  RiskEventBus    │────▶│ LikelihoodEngine │
└──────────────┘                  │     │                  │     │                  │
                                  │     │  • Receives      │     │  • Recalculates  │
┌──────────────┐                  │     │  • Routes        │     │  • Compares      │
│   CONTROLS   │ ──Maturity Up───┤     │  • Triggers      │     │  • Alerts        │
│   Module     │                  │     │                  │     │                  │
│(Capability)  │ ──Test Failed───┤     └──────────────────┘     └────────┬─────────┘
└──────────────┘                  │                                      │
                                  │                                      ▼
┌──────────────┐                  │                          ┌──────────────────┐
│    AUDITS    │ ──NC Opened─────┤                          │   ALERT ENGINE   │
│   Module     │                  │                          │                  │
│(Nonconformity)│──NC Closed─────┤                          │ • Tolerance Gap  │
└──────────────┘                  │                          │ • Manual vs Calc │
                                  │                          │ • Review Overdue │
┌──────────────┐                  │                          │ • KRI Breach     │
│    RISKS     │ ──KRI Updated───┘                          └──────────────────┘
│   Module     │
│    (KRI)     │
└──────────────┘
```

### Trigger Matrix

| Data Source | Trigger Event | Effect on Likelihood |
|-------------|---------------|---------------------|
| `VulnerabilityEntry` | Created/Patched/Closed | Vuln exposure factor recalc |
| `Incident` | New incident logged | Incident history factor recalc |
| `KeyRiskIndicator` | New KRI value recorded | KRI status factor recalc |
| `CapabilityAssessment` | Maturity updated | Control maturity factor recalc |
| `Nonconformity` | Opened/Closed | NC factor recalc |
| `ThreatCatalog` | Threat likelihood updated | Threat frequency factor recalc |

---

## Extensibility

### Architecture for Adding Factors

The framework is designed to be extensible. Additional factors can be added without changing existing code.

### Potential Additional Factors

| Factor | Data Source | Rationale |
|--------|-------------|-----------|
| Asset Criticality | `Asset.businessCriticality` | Critical assets = higher likelihood target |
| Vendor Risk | `Vendor.residualRiskScore` | High-risk vendors increase likelihood |
| Change Activity | `Change` (recent changes) | More changes = more exposure |
| Patch Compliance | `Asset.patchLevel` | Unpatched systems = higher likelihood |
| User Training | Security awareness metrics | Untrained users = phishing likelihood ↑ |
| Audit Findings | External audit results | Recent audit findings |
| Threat Intelligence | External feeds | Active campaigns targeting your sector |
| Geographic Risk | `Vendor.geopoliticalRiskLevel` | Operations in high-risk regions |
| Regulatory Pressure | Upcoming compliance deadlines | NIS2/DORA deadlines approaching |
| Seasonal Patterns | Historical incident timing | Holiday periods, fiscal year-end |

### Adding a New Factor

```typescript
// 1. Define the calculation function
export function calculateAssetCriticalityFactor(
  assets: Array<{ businessCriticality: string }>
): LikelihoodFactor | null {
  if (!assets || assets.length === 0) return null;

  const criticalCount = assets.filter(a =>
    a.businessCriticality === 'CRITICAL' ||
    a.businessCriticality === 'HIGH'
  ).length;

  const value = criticalCount >= 3 ? 5 : criticalCount >= 1 ? 3 : 1;

  return {
    id: 'asset-criticality',
    name: 'Asset Criticality',
    category: 'ASSET_CRITICALITY',
    value,
    weight: 10,
    confidence: 'HIGH',
    source: 'Asset',
    details: `${criticalCount} critical/high assets linked`,
    dataPoints: assets.length,
  };
}

// 2. Add to category enum
type LikelihoodFactorCategory =
  | ... existing ...
  | 'ASSET_CRITICALITY';

// 3. Add default weight (rebalance to sum to 100)
const DEFAULT_FACTOR_WEIGHTS = {
  THREAT_FREQUENCY: 18,       // Was 20
  VULNERABILITY_EXPOSURE: 18, // Was 20
  CONTROL_MATURITY: 18,       // Was 20
  INCIDENT_HISTORY: 13,       // Was 15
  KRI_STATUS: 13,             // Was 15
  NONCONFORMITY: 10,
  EXTERNAL_FACTORS: 0,
  ASSET_CRITICALITY: 10,      // NEW
};

// 4. Include in calculation
factors.push(calculateAssetCriticalityFactor(input.assets));
```

### Configurable Weights

Weights are configurable per organization:

```typescript
// Custom weights for a financial institution
const financialSectorWeights = {
  THREAT_FREQUENCY: 15,
  VULNERABILITY_EXPOSURE: 25,  // Higher - they're targeted more
  CONTROL_MATURITY: 15,
  INCIDENT_HISTORY: 20,        // Higher - regulatory scrutiny
  KRI_STATUS: 15,
  NONCONFORMITY: 10,
  EXTERNAL_FACTORS: 0,
};
```

---

## Framework Visualization

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           RISK LIKELIHOOD AUTOMATION FRAMEWORK                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │   RISK MODULE   │
                                    │                 │
                                    │  Risk → Scenario│
                                    │       ↓         │
                                    │  LIKELIHOOD     │
                                    │  (calculated)   │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
    ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
    │   THREAT INTELLIGENCE │  │    VULNERABILITY      │  │   CONTROL ASSURANCE   │
    │                       │  │                       │  │                       │
    │  ┌─────────────────┐  │  │  ┌─────────────────┐  │  │  ┌─────────────────┐  │
    │  │ ThreatCatalog   │  │  │  │VulnerabilityEntry│ │  │  │CapabilityAssess │  │
    │  │ baseLikelihood  │  │  │  │ severity, status │  │  │  │ currentMaturity │  │
    │  └────────┬────────┘  │  │  └────────┬────────┘  │  │  └────────┬────────┘  │
    │           │           │  │           │           │  │           │           │
    │     Weight: 20%       │  │     Weight: 20%       │  │     Weight: 20%       │
    └───────────┼───────────┘  └───────────┼───────────┘  └───────────┼───────────┘
                │                          │                          │
                └──────────────────────────┼──────────────────────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │   LIKELIHOOD ENGINE    │
                              │                        │
                              │  Weighted Aggregation  │
                              │  ───────────────────── │
                              │  Σ(factor × weight)    │
                              │  ─────────────────     │
                              │     Σ(weights)         │
                              │                        │
                              │  Output: 1-5 + Level   │
                              └────────────┬───────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                │                          │                          │
                ▼                          ▼                          ▼
    ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
    │   INCIDENT HISTORY    │  │      KRI MONITORING   │  │   AUDIT & COMPLIANCE  │
    │                       │  │                       │  │                       │
    │  ┌─────────────────┐  │  │  ┌─────────────────┐  │  │  ┌─────────────────┐  │
    │  │    Incident     │  │  │  │KeyRiskIndicator │  │  │  │  Nonconformity  │  │
    │  │ occurredAt,     │  │  │  │ status (RAG),   │  │  │  │ status,severity │  │
    │  │ severity        │  │  │  │ trend           │  │  │  │ isoClause       │  │
    │  └────────┬────────┘  │  │  └────────┬────────┘  │  │  └────────┬────────┘  │
    │           │           │  │           │           │  │           │           │
    │     Weight: 15%       │  │     Weight: 15%       │  │     Weight: 10%       │
    └───────────┼───────────┘  └───────────┼───────────┘  └───────────┼───────────┘
                │                          │                          │
                └──────────────────────────┴──────────────────────────┘
```

### Technical Layer Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  DATA LAYER     │     │  SERVICE LAYER  │     │   API LAYER     │     │   UI LAYER      │
│                 │     │                 │     │                 │     │                 │
│ ┌─────────────┐ │     │ ┌─────────────┐ │     │ ┌─────────────┐ │     │ ┌─────────────┐ │
│ │ThreatCatalog│─┼────▶│ │ Likelihood  │ │     │ │             │ │     │ │ Factor      │ │
│ └─────────────┘ │     │ │ Factor      │ │     │ │   /risks/   │ │     │ │ Breakdown   │ │
│ ┌─────────────┐ │     │ │ Service     │─┼────▶│ │   {id}/     │─┼────▶│ │ Panel       │ │
│ │Vulnerability│─┼────▶│ │             │ │     │ │   factors   │ │     │ └─────────────┘ │
│ └─────────────┘ │     │ └─────────────┘ │     │ │             │ │     │                 │
│ ┌─────────────┐ │     │       │         │     │ └─────────────┘ │     │ ┌─────────────┐ │
│ │Capability   │─┼────▶│       ▼         │     │                 │     │ │ Dashboard   │ │
│ │Assessment   │ │     │ ┌─────────────┐ │     │ ┌─────────────┐ │     │ │ Overview    │ │
│ └─────────────┘ │     │ │ Likelihood  │─┼────▶│ │  /risks/    │─┼────▶│ └─────────────┘ │
│ ┌─────────────┐ │     │ │ Engine      │ │     │ │  dashboard  │ │     │                 │
│ │Incident     │─┼────▶│ │             │ │     │ └─────────────┘ │     │ ┌─────────────┐ │
│ └─────────────┘ │     │ └─────────────┘ │     │                 │     │ │ Alert       │ │
│ ┌─────────────┐ │     │       │         │     │ ┌─────────────┐ │     │ │ Banner      │ │
│ │KRI          │─┼────▶│       ▼         │     │ │  /risks/    │ │     │ └─────────────┘ │
│ └─────────────┘ │     │ ┌─────────────┐ │     │ │  alerts     │─┼────▶│                 │
│ ┌─────────────┐ │     │ │ Alert       │─┼────▶│ └─────────────┘ │     │ ┌─────────────┐ │
│ │Nonconformity│─┼────▶│ │ Service     │ │     │                 │     │ │ Trend       │ │
│ └─────────────┘ │     │ └─────────────┘ │     │                 │     │ │ Chart       │ │
│                 │     │       ▲         │     │                 │     │ └─────────────┘ │
│                 │     │       │         │     │                 │     │                 │
│                 │     │ ┌─────────────┐ │     │                 │     │                 │
│                 │     │ │ Event Bus   │ │     │                 │     │                 │
│                 │     │ │ (triggers)  │ │     │                 │     │                 │
│                 │     │ └─────────────┘ │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Risk Manager Dashboard

### Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  RISK LIKELIHOOD DASHBOARD                                          [Risk Manager ▾]   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─── ATTENTION REQUIRED ───────────────────────────────────────────────────────────┐  │
│  │ ⚠️ 3 risks have likelihood divergence > 1 level                                   │  │
│  │ ⚠️ 2 risks have RED KRIs                                                          │  │
│  │ ⚠️ 1 risk has new critical vulnerability                                         │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌─── FACTOR HEALTH OVERVIEW ───────────────────────────────────────────────────────┐  │
│  │                                                                                   │  │
│  │   Threat Intel     Vulnerabilities    Control Maturity                           │  │
│  │   ████████░░       ██████████         ██████░░░░                                  │  │
│  │   4.2 avg          12 open            2.8 avg                                     │  │
│  │   ↑ from 3.8       ↓ from 18          ↑ from 2.4                                  │  │
│  │                                                                                   │  │
│  │   Incidents        KRI Status         Nonconformities                            │  │
│  │   ████░░░░░░       ██████░░░░         ████░░░░░░                                  │  │
│  │   3 in 24mo        2R 4A 8G           4 open                                      │  │
│  │   ↑ +1 this mo     ↓ improved         → stable                                    │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌─── LIKELIHOOD DISTRIBUTION ──────────────┐  ┌─── DIVERGENCE ANALYSIS ────────────┐  │
│  │                                          │  │                                    │  │
│  │  RARE      ██░░░░░░░░░░░░░░  3 risks    │  │  Manual Higher    ████████  8      │  │
│  │  UNLIKELY  ████████░░░░░░░░  12 risks   │  │  Aligned          ██████████████ 18│  │
│  │  POSSIBLE  ██████████████░░  21 risks   │  │  Manual Lower     ██████  6        │  │
│  │  LIKELY    ████████░░░░░░░░  11 risks   │  │                                    │  │
│  │  CERTAIN   ██░░░░░░░░░░░░░░  4 risks    │  │  Avg divergence: 0.4 levels       │  │
│  │                                          │  │                                    │  │
│  └──────────────────────────────────────────┘  └────────────────────────────────────┘  │
│                                                                                         │
│  ┌─── RISKS WITH HIGHEST CALCULATED LIKELIHOOD ─────────────────────────────────────┐  │
│  │                                                                                   │  │
│  │  Risk ID   Title                        Manual  Calc   Gap   Top Factor          │  │
│  │  ───────────────────────────────────────────────────────────────────────────────│  │
│  │  R-03      Unauthorized Data Access     2       4      +2    Vulnerabilities     │  │
│  │  R-07      Ransomware Attack            3       5      +2    Threat Frequency    │  │
│  │  R-12      Third-Party Breach           3       4      +1    Vendor Risk         │  │
│  │  R-15      Insider Threat               4       4       0    Incident History    │  │
│  │  R-02      Data Loss                    3       4      +1    KRI Status          │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Factor View

```
┌─── FACTOR BREAKDOWN ─────────────────────────────────────────────────────────────┐
│                                                                                   │
│  THREAT FREQUENCY (20%)                                         Value: 4/5       │
│  ├─ Source: ThreatCatalog → "Credential Theft"                                   │
│  ├─ Base likelihood: 4 (common attack vector)                                    │
│  └─ Confidence: HIGH                                                             │
│      ████████████████████░░░░░                                                    │
│                                                                                   │
│  VULNERABILITY EXPOSURE (20%)                                   Value: 4/5       │
│  ├─ Source: VulnerabilityEntry                                                   │
│  ├─ 2 OPEN vulnerabilities on linked assets                                      │
│  │   • CVE-2024-1234 (Severity 4) - DB Server                                    │
│  │   • CVE-2024-5678 (Severity 3) - API Gateway                                  │
│  └─ Confidence: MEDIUM (2 data points)                                           │
│      ████████████████████░░░░░                                                    │
│                                                                                   │
│  CONTROL MATURITY (20%)                                         Value: 2/5       │
│  ├─ Source: CapabilityAssessment                                                 │
│  ├─ 3 linked capabilities, avg maturity: 2.8/5                                   │
│  │   • A.9.4.1 Access Restriction (3.0)                                          │
│  │   • A.9.4.2 Secure Logon (2.5)                                                │
│  │   • A.9.4.3 Password Mgmt (3.0)                                               │
│  └─ Confidence: HIGH (3 data points)                                             │
│      ████████░░░░░░░░░░░░░░░░░  ← Lower maturity = Higher likelihood             │
│                                                                                   │
│  INCIDENT HISTORY (15%)                                         Value: 2/5       │
│  ├─ Source: Incident                                                             │
│  ├─ 1 related incident in last 24 months                                         │
│  │   • INC-2024-089 (2024-03-15) - Phishing attempt                              │
│  └─ Confidence: MEDIUM                                                           │
│      ████████░░░░░░░░░░░░░░░░░                                                    │
│                                                                                   │
│  KRI STATUS (15%)                                               Value: 3/5       │
│  ├─ Source: KeyRiskIndicator                                                     │
│  ├─ 3 KRIs linked: 1 RED, 1 AMBER, 1 GREEN                                       │
│  │   • 🔴 Failed login attempts (threshold exceeded)                             │
│  │   • 🟡 Password age compliance (85%)                                          │
│  │   • 🟢 MFA adoption rate (92%)                                                │
│  └─ Confidence: HIGH (3 data points)                                             │
│      ████████████░░░░░░░░░░░░░                                                    │
│                                                                                   │
│  NONCONFORMITIES (10%)                                          Value: 3/5       │
│  ├─ Source: Nonconformity                                                        │
│  ├─ 1 MINOR open NC on A.9.4 (Access Control)                                    │
│  │   • NC-2024-012 - Privileged access review overdue                            │
│  └─ Confidence: HIGH                                                             │
│      ████████████░░░░░░░░░░░░░                                                    │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## ISO 27001 Alignment

| ISO Clause | Requirement | How This Implements It |
|------------|-------------|------------------------|
| **8.2** | Risk assessment at planned intervals or when significant changes occur | Event-driven recalculation on data changes |
| **9.1** | Monitor and measure ISMS performance | KRI tracking, factor trending |
| **10.1** | Nonconformity and corrective action | NC factor automatically increases likelihood |
| **A.5.7** | Threat intelligence | Threat frequency factor from ThreatCatalog |

---

## Implementation Files

### Backend

```
# Core likelihood calculation
apps/server/src/risks/utils/likelihood-factors.ts           # Factor calculation logic (existing)

# New files needed
apps/server/src/risks/utils/conditional-factors.ts          # Conditional factor calculations
apps/server/src/risks/utils/weight-redistribution.ts        # Dynamic weight scaling
apps/server/src/risks/services/likelihood-factor.service.ts # Service layer
apps/server/src/risks/controllers/risk-scenario.controller.ts # API endpoints
```

### Frontend

```
apps/web/src/lib/likelihood-factors.ts                      # Client-side types
apps/web/src/components/risks/LikelihoodFactorsPanel.tsx    # UI component
apps/web/src/pages/risks/RiskScenarioDetailPage.tsx         # Integration
```

### Schema Changes

```prisma
// Add to Risk model
model Risk {
  // ... existing fields
  category    RiskCategory  @default(CYBER_SECURITY)
}

enum RiskCategory {
  CYBER_SECURITY
  OPERATIONAL
  COMPLIANCE
  STRATEGIC
  FINANCIAL
  REPUTATIONAL
  THIRD_PARTY
  PEOPLE
  ENVIRONMENTAL
  LEGAL
}
```

---

## API Endpoints

### Get Likelihood Factors for a Scenario

```
GET /api/risks/:riskId/scenarios/:scenarioId/factors

Response:
{
  "suggestedValue": 3.05,
  "suggestedLevel": "POSSIBLE",
  "confidence": "HIGH",
  "riskCategory": "CYBER_SECURITY",
  "applicableFactors": 6,
  "factors": [
    {
      "id": "threat-frequency",
      "name": "Threat Base Likelihood",
      "category": "THREAT_FREQUENCY",
      "value": 4,
      "weight": 20,
      "scaledWeight": 20,
      "contribution": 0.80,
      "confidence": "HIGH",
      "source": "ThreatCatalog",
      "details": "Based on Credential Theft threat profile"
    },
    // ... other factors
  ],
  "excludedFactors": [],
  "comparison": {
    "manualLikelihood": 2,
    "difference": 1,
    "recommendation": "Consider reviewing - evidence suggests higher likelihood"
  }
}
```

### Get Likelihood Factors for Non-Asset Risk

```
GET /api/risks/:riskId/scenarios/:scenarioId/factors

Response (COMPLIANCE risk):
{
  "suggestedValue": 3.21,
  "suggestedLevel": "POSSIBLE",
  "confidence": "HIGH",
  "riskCategory": "COMPLIANCE",
  "applicableFactors": 6,
  "factors": [
    // 5 universal factors + 1 conditional (REGULATORY_PRESSURE)
  ],
  "excludedFactors": [
    {
      "category": "VULNERABILITY_EXPOSURE",
      "reason": "Not applicable to COMPLIANCE risks without linked assets"
    }
  ],
  "weightRedistribution": {
    "originalTotal": 95,
    "scaleFactor": 1.053,
    "redistributed": true
  }
}
```

---

## Related Documentation

- [Risk UX Redesign Plan](./RISK_UX_REDESIGN_PLAN.md)
- [Data Dictionary - Risk Module](../data-dictionary.md#risk-module)
- [Risk Scoring Utilities](../../apps/server/src/risks/utils/risk-scoring.ts)

---

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-03 | Initial framework documentation | Claude |
| 2026-01-03 | Added risk categories, conditional factors, dynamic weight redistribution, non-asset risk example | Claude |
