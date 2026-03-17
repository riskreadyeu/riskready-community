# BCM Module Overview

## Purpose

The Business Continuity Management (BCM) module provides comprehensive capabilities for managing business continuity planning, business impact analysis, resilience testing, and plan activation. It integrates with the existing RiskReady platform to provide a unified approach to operational resilience.

## Regulatory Context

The BCM module is designed to support compliance with:

- **ISO 27001:2022**: Annex A.5.29 (ICT Continuity) and A.5.30 (ICT Readiness)
- **NIS2 Directive**: Article 21 (Cybersecurity risk-management measures)
- **DORA**: Articles 11-12 (ICT business continuity policy), Articles 24-27 (Digital operational resilience testing)

## Key Features

### 1. Business Impact Analysis (BIA)
- Status-gated workflow for process assessment
- Automatic population of RTO/RPO/MTPD values
- Criticality classification
- Dependency mapping
- Audit trail for compliance

### 2. BCM Programs
- Program governance and ownership
- Policy document linkage
- Regulatory scope flagging (DORA/NIS2)
- Program status lifecycle

### 3. Continuity Plans
- Multiple plan types (BCP, DRP, Crisis Management, IT Recovery)
- Process coverage with BIA completion validation
- Activation criteria and escalation matrices
- Version control and approval workflow
- Test scheduling and tracking

### 4. Test Exercises
- Multiple test types (Tabletop, Walkthrough, Simulation, Full Interruption)
- Objective tracking and results capture
- Findings management with NC linkage
- RTO/RPO achievement tracking
- Evidence attachment

### 5. Plan Activations
- Real-time activation from incidents
- Recovery timeline tracking
- RTO achievement measurement
- Timeline event logging

## Integration Points

| Module | Integration |
|--------|-------------|
| **Organisation** | Business processes, departments |
| **Incidents** | Plan activation from incidents |
| **Audits** | Nonconformity linkage from test findings |
| **Policies** | Policy document linkage for plans |
| **Evidence** | Evidence attachment for tests |
| **Controls** | Control mapping for BCM requirements |

## Design Principles

1. **Progressive Onboarding**: Works for companies with zero GRC maturity
2. **BIA as Workflow**: BIA assessment populates BusinessProcess fields directly
3. **Status-Gated Eligibility**: Processes must complete BIA before BCP linkage
4. **Regulatory-Aware**: DORA/NIS2 scope propagates across all modules

