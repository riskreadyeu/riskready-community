# Supply Chain Module - DORA Compliance

This document details how the Supply Chain module supports compliance with the Digital Operational Resilience Act (DORA) requirements for third-party ICT risk management.

## DORA Overview

The Digital Operational Resilience Act (EU) 2022/2554 establishes a comprehensive framework for digital operational resilience in the EU financial sector. Chapter V specifically addresses ICT third-party risk.

### Applicability

DORA applies to:
- Credit institutions
- Investment firms
- Insurance undertakings
- Payment institutions
- Electronic money institutions
- Central securities depositories
- Crypto-asset service providers
- Other financial entities

### Key Dates

| Milestone | Date |
|-----------|------|
| Entry into force | January 16, 2023 |
| Application date | January 17, 2025 |
| RTS/ITS deadlines | Various 2024-2025 |

---

## DORA Articles Covered

### Article 28: General Principles on ICT Third-Party Risk

**Requirements:**
- Financial entities must manage ICT third-party risk as part of ICT risk management
- Maintain proportionate risk assessment
- Due diligence for third-party relationships

**Module Support:**

| Requirement | Feature |
|-------------|---------|
| Risk management | Vendor tiering (CRITICAL, HIGH, MEDIUM, LOW) |
| Due diligence | Layered assessment questionnaire |
| Ongoing monitoring | Periodic reviews, SLA tracking |
| Proportionality | Tier-based question applicability |

### Article 28(8): Exit Strategies

**Requirement:**
> Financial entities shall put in place exit strategies for ICT services supporting critical or important functions.

**Module Support:**

The Exit Plans feature tracks:

| Field | DORA Requirement |
|-------|------------------|
| `coversInterruptions` | Service interruptions |
| `coversFailures` | Provider failures |
| `coversTermination` | Contract termination |
| `coversInsolvency` | Provider insolvency |
| `coversRegulatory` | Regulatory-mandated exit |
| `transitionPeriodDays` | Transition timeline |
| `alternativeVendors` | Pre-identified alternatives |
| `dataExtractionPlan` | Data portability |
| `serviceTransitionPlan` | Service migration |
| `lastTestedDate` | Testing requirement |

**Workflow:**

```
1. Create Exit Plan → Status: DRAFT
2. Define scenarios → Add triggers covered
3. Document alternatives → List backup vendors
4. Get approval → Status: APPROVED
5. Test plan → Status: TESTING
6. Document results → Status: TESTED
7. If exit triggered → Status: ACTIVATED
8. Exit complete → Status: COMPLETED
```

---

### Article 29: Concentration Risk

**Requirement:**
> Financial entities shall identify and assess concentration risk.

**Module Support:**

The Concentration Risk Analysis provides:

```
┌─────────────────────────────────────────────────────────┐
│                 CONCENTRATION RISK DASHBOARD            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  BY SERVICE TYPE                                        │
│  ├── Cloud Infrastructure: 3 vendors                   │
│  ├── Payment Processing: 1 vendor ⚠️ (Single Point)    │
│  ├── Core Banking: 2 vendors                           │
│  └── Data Analytics: 4 vendors                         │
│                                                         │
│  BY GEOGRAPHY                                           │
│  ├── EU: 65%                                           │
│  ├── US: 25%                                           │
│  └── Other: 10%                                        │
│                                                         │
│  THIRD-COUNTRY EXPOSURE                                 │
│  └── 5 vendors (11%) with data outside EU              │
│                                                         │
│  SINGLE POINTS OF FAILURE: 2                           │
│  CRITICAL CONCENTRATION: Payment Processing            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Indicators:**

| Indicator | Description | Threshold |
|-----------|-------------|-----------|
| Single Point of Failure | Only one vendor for a service type | Count = 1 |
| High Concentration | >50% of critical services from one vendor | Critical count > 50% |
| Geographic Risk | High concentration in one country | >70% in one location |
| Third-Country Exposure | Data processed outside EU/EEA | Any vendors flagged |

---

### Article 30: Key Contractual Provisions

**Requirement:**
> Contracts shall contain at minimum the following elements...

**Module Support:**

The Contract Detail page includes a DORA Article 30 compliance checklist:

| Article 30 Clause | Database Field | Requirement |
|-------------------|----------------|-------------|
| Art. 30(2)(a) | `hasServiceDescription` | Full description of functions/ICT services |
| Art. 30(2)(b) | `hasDataLocations` | Locations where data is processed/stored |
| Art. 30(2)(c) | `hasLocationChangeNotice` | Obligation to notify of location changes |
| Art. 30(2)(d) | `hasAvailabilityTargets` | Service availability and quality targets |
| Art. 30(2)(e) | `hasAssistanceInIncidents` | Assistance in ICT-related incidents |
| Art. 30(3)(e) | `hasAuditRights` | Full access and audit rights |
| Art. 30(3)(e) | `hasRegulatoryAccess` | Rights for competent authorities |
| Art. 30(2)(f) | `hasTerminationRights` | Termination rights and notice periods |
| Art. 30(2)(i) | `hasExitClause` | Exit strategy and transition provisions |
| Art. 30(2)(g) | `hasSubcontractingRules` | Subcontracting conditions |
| Art. 30(2)(h) | `hasDataProtection` | Data protection provisions |

**Compliance Tracking UI:**

```
┌─────────────────────────────────────────────────────────┐
│                 DORA ARTICLE 30 COMPLIANCE              │
│                                                         │
│  Progress: ████████████░░░░░░ 73%                       │
│  8 of 11 clauses verified                               │
│                                                         │
│  ☑ Full service description           Art. 30(2)(a)    │
│  ☑ Data processing locations          Art. 30(2)(b)    │
│  ☑ Location change notification       Art. 30(2)(c)    │
│  ☑ Availability & quality objectives  Art. 30(2)(d)    │
│  ☑ Incident assistance                Art. 30(2)(e)    │
│  ☐ Full audit rights                  Art. 30(3)(e)    │
│  ☐ Regulator access rights            Art. 30(3)(e)    │
│  ☑ Termination rights                 Art. 30(2)(f)    │
│  ☑ Exit/transition provisions         Art. 30(2)(i)    │
│  ☐ Subcontracting conditions          Art. 30(2)(g)    │
│  ☑ Data protection clauses            Art. 30(2)(h)    │
│                                                         │
│  ⚠️ 3 missing clauses require attention                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Article 31: Register of Information

**Requirement:**
> Financial entities shall maintain and keep up to date a register of information in relation to all contractual arrangements on the use of ICT services provided by ICT third-party service providers.

**Module Support:**

The DORA Report page generates the required register:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DORA ICT THIRD-PARTY REGISTER                    │
│                    Report Date: 2024-01-15                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SUMMARY                                                            │
│  ├── Total ICT Providers: 15                                       │
│  ├── Critical ICT Providers: 5                                     │
│  ├── With LEI Code: 12 (80%)                                       │
│  ├── Art. 30 Compliant: 10 (67%)                                   │
│  └── With Exit Plan: 5 (100% of critical)                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Code     │ Name              │ LEI        │ Critical │ Art.30 │Exit │
├─────────────────────────────────────────────────────────────────────┤
│ VND-001  │ Cloud Provider    │ 529900...  │ ✓        │ 100%   │ ✓   │
│ VND-002  │ Core Banking      │ 549300...  │ ✓        │ 91%    │ ✓   │
│ VND-003  │ Payment Processor │ 635400...  │ ✓        │ 82%    │ ✓   │
│ VND-004  │ Data Analytics    │ -          │ -        │ 64%    │ -   │
│ VND-005  │ CRM System        │ 213800...  │ -        │ 73%    │ -   │
│ ...      │ ...               │ ...        │ ...      │ ...    │ ... │
└─────────────────────────────────────────────────────────────────────┘
```

**Export Format:**

The register can be exported as CSV with columns:
- Vendor Code
- Legal Name
- LEI Code
- Country
- Critical ICT Provider (Y/N)
- Supports Essential Functions (Y/N)
- Data Processing Locations
- Third-Country Exposure (Y/N)
- Contract Reference
- Contract Effective Date
- Contract Expiry Date
- Article 30 Compliance (%)
- Exit Plan Status

---

## DORA-Specific Fields

### Vendor Model

| Field | Purpose | DORA Article |
|-------|---------|--------------|
| `leiCode` | Legal Entity Identifier | Art. 28 identification |
| `isIctServiceProvider` | ICT provider flag | Art. 28 scope |
| `isCriticalIctProvider` | Critical designation | Art. 28, Art. 31 |
| `supportsEssentialFunction` | Essential function support | Art. 28(8) |
| `dataProcessingLocations` | Where data is processed | Art. 30(2)(b) |
| `dataStorageLocations` | Where data is stored | Art. 30(2)(b) |
| `thirdCountryExposure` | Data outside EU/EEA | Art. 29 concentration |
| `concentrationRiskLevel` | Assessed risk level | Art. 29 |

### Contract Model (Article 30 Checklist)

| Field | Clause | Description |
|-------|--------|-------------|
| `hasServiceDescription` | 30(2)(a) | Clear service description |
| `hasDataLocations` | 30(2)(b) | Data processing locations |
| `hasLocationChangeNotice` | 30(2)(c) | Location change notification |
| `hasAvailabilityTargets` | 30(2)(d) | Availability objectives |
| `hasAssistanceInIncidents` | 30(2)(e) | Incident assistance |
| `hasAuditRights` | 30(3)(e) | Full audit rights |
| `hasRegulatoryAccess` | 30(3)(e) | Regulator access |
| `hasTerminationRights` | 30(2)(f) | Termination rights |
| `hasExitClause` | 30(2)(i) | Exit provisions |
| `hasSubcontractingRules` | 30(2)(g) | Subcontracting rules |
| `hasDataProtection` | 30(2)(h) | Data protection |

### Exit Plan Model (Article 28(8))

| Field | Purpose |
|-------|---------|
| `coversInterruptions` | Service interruption scenarios |
| `coversFailures` | Provider failure scenarios |
| `coversTermination` | Contract termination scenarios |
| `coversInsolvency` | Provider insolvency scenarios |
| `coversRegulatory` | Regulatory-mandated exit |
| `transitionPeriodDays` | Required transition time |
| `alternativeVendors` | Pre-identified alternatives |
| `dataExtractionPlan` | Data portability procedure |
| `serviceTransitionPlan` | Service migration plan |
| `lastTestedDate` | Last test date |
| `nextTestDue` | Next test due date |
| `testResults` | Test outcome documentation |

---

## DORA Assessment Questions

The questionnaire includes 66 DORA-specific questions:

### Distribution by Domain

| Domain | DORA Questions |
|--------|---------------|
| 1. Governance & Organization | 3 |
| 2. Information Security Management | 3 |
| 3. Risk Management | 4 |
| 4. HR Security | 1 |
| 5. Asset Management | 2 |
| 6. Access Control | 2 |
| 7. Cryptography | 1 |
| 8. Physical Security | 1 |
| 9. Operations Security | 3 |
| 10. Communications Security | 2 |
| 11. System Development | 2 |
| 12. Supplier Management | 5 |
| 13. Incident Management | 4 |
| 14. Business Continuity | 6 |
| 15. Compliance | 3 |
| 16. Data Protection | 4 |

### Key DORA Question Topics

**ICT Risk Management (Art. 6-16):**
- ICT risk management framework
- ICT asset inventory and classification
- ICT security policies and procedures
- ICT vulnerability management

**Digital Resilience (Art. 24-27):**
- Digital operational resilience testing program
- Threat-led penetration testing (TLPT)
- Testing of ICT tools and systems
- Remediation of identified weaknesses

**Third-Party Risk (Art. 28-30):**
- Third-party ICT risk management policy
- Due diligence process
- Contractual arrangements
- Exit strategies

**Incident Management (Art. 17-23):**
- ICT-related incident classification
- Major incident reporting
- Incident response and recovery
- Root cause analysis

---

## DORA Compliance Workflow

### For Vendors in DORA Scope

```
1. IDENTIFICATION
   ├── Mark vendor as inDoraScope = true
   ├── Set isIctServiceProvider = true
   ├── If critical: isCriticalIctProvider = true
   └── If essential: supportsEssentialFunction = true

2. ASSESSMENT
   ├── Create assessment with DORA framework
   ├── Answer all 223 questions (for CRITICAL)
   ├── Collect evidence for DORA-specific items
   └── Calculate tier

3. CONTRACTING
   ├── Create/update contract
   ├── Complete Article 30 checklist
   ├── Verify all 11 clauses present
   └── Document any gaps

4. EXIT PLANNING (for critical)
   ├── Create exit plan
   ├── Define trigger scenarios
   ├── Identify alternatives
   ├── Document transition plan
   └── Schedule testing

5. ONGOING MONITORING
   ├── Quarterly reviews (CRITICAL tier)
   ├── SLA tracking
   ├── Incident management
   ├── Exit plan testing
   └── Register updates

6. REPORTING
   ├── Update DORA register
   ├── Export for regulatory submission
   └── Board reporting (quarterly)
```

---

## Regulatory Reporting

### DORA Register Export

The module generates exports for regulatory submission:

**Export Fields (RTS/ITS aligned):**

```csv
vendor_code,legal_name,lei_code,country,ict_provider,critical_ict,
essential_function,data_locations,third_country,contract_ref,
effective_date,expiry_date,art30_compliance,exit_plan_status
```

### Board Reporting

DORA requires regular board reporting on ICT third-party risk:

| Report Element | Module Source |
|----------------|---------------|
| Critical provider count | Dashboard stats |
| Concentration risks | Concentration Risk page |
| Assessment status | Assessment Register |
| Open findings | Findings page |
| Contract compliance | DORA Report |
| Exit plan readiness | Exit Plans page |
| Incident summary | Incidents page |

---

## Best Practices for DORA Compliance

### Critical ICT Provider Management

1. ✓ Identify all critical ICT providers
2. ✓ Ensure LEI codes are captured
3. ✓ Complete full 223-question assessments
4. ✓ Verify 100% Article 30 contract compliance
5. ✓ Maintain tested exit plans
6. ✓ Conduct quarterly reviews

### Contract Compliance

1. ✓ Use Article 30 checklist for all DORA vendors
2. ✓ Track compliance percentage
3. ✓ Escalate gaps to legal
4. ✓ Include in contract renewal scope

### Exit Planning

1. ✓ Create exit plans before onboarding critical vendors
2. ✓ Test exit plans annually at minimum
3. ✓ Document alternative vendors
4. ✓ Include data portability provisions

### Concentration Risk

1. ✓ Review concentration analysis quarterly
2. ✓ Address single points of failure
3. ✓ Document mitigation strategies
4. ✓ Include in board reporting

---

## API Endpoints for DORA

### Get DORA Report

```http
GET /api/supply-chain/vendors/dora-report
```

### Get Concentration Risk

```http
GET /api/supply-chain/vendors/concentration-risk
```

### Get Contract DORA Compliance

```http
GET /api/supply-chain/contracts/:id/dora-compliance
```

### Update Contract DORA Compliance

```http
PUT /api/supply-chain/contracts/:id/dora-compliance
```

### Filter DORA-Scope Vendors

```http
GET /api/supply-chain/vendors?inDoraScope=true
GET /api/supply-chain/vendors?isCriticalIctProvider=true
```

---

## References

### DORA Text

- [Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554)

### DORA RTS/ITS

- [RTS on ICT Risk Management Framework](https://www.esma.europa.eu/)
- [RTS on ICT Third-Party Risk](https://www.esma.europa.eu/)
- [ITS on Register of Information](https://www.esma.europa.eu/)

### ESAs Guidelines

- [Joint ESAs Guidelines on ICT Third-Party Risk](https://www.eba.europa.eu/)
