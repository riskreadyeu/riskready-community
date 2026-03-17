# BIA Methodology

## Overview

The Business Impact Analysis (BIA) uses a **questionnaire-based methodology** to systematically assess the confidentiality, integrity, and availability impacts of an application. This approach ensures consistent, auditable assessments aligned with ISO 27001, GDPR, DORA, NIS2, and EU AI Act requirements.

## Section Structure

The BIA questionnaire consists of **45 questions** across **5 sections**:

| Section | Questions | ISO Controls | Regulatory Alignment |
|---------|-----------|--------------|---------------------|
| 1. Data Privacy | 17 | 5.37 | GDPR Art. 4, 6, 9, 10 |
| 2. Confidentiality | 7 | 5.12, 5.14 | GDPR |
| 3. Integrity | 7 | 8.25, 8.28 | DORA |
| 4. Availability | 6 | 5.29, 5.30 | DORA, NIS2 |
| 5. AI/ML | 8 | - | EU AI Act |

---

## Section 1: Data Processing & Privacy (ISO 5.37)

**Purpose**: Assess GDPR compliance, personal data processing, and DPIA requirements.

### Questions

| ID | Question | Response Type | Regulatory |
|----|----------|---------------|------------|
| 1.0 | Does the application process personal data (GDPR Art. 4)? | YES/NO/NA | GDPR |
| 2.0 | Does the application process special categories of personal data (Art. 9)? | YES/NO/NA | GDPR |
| 3.0 | Does the application process data relating to criminal convictions (Art. 10)? | YES/NO/NA | GDPR |
| 3.1 | [2025] Does the application process biometric data for AI authentication? | YES/NO/NA | GDPR, EU AI Act |
| 4.0 | What is the purpose of processing? | TEXT | GDPR |
| 5.0 | What is the legal basis for processing (Art. 6)? | SELECT | GDPR |
| 6.0 | Is processing registered in Records of Processing Activities (ROPA)? | YES/NO/NA | GDPR |
| 6.1 | [2025] Are there cross-border data transfers (Schrems II compliance)? | YES/NO/NA | GDPR |
| 7.0 | Is a DPIA required - Large scale processing? | YES/NO/NA | GDPR |
| 8.0 | Is a DPIA required - Systematic monitoring of public area? | YES/NO/NA | GDPR |
| 9.0 | Is a DPIA required - Profiling with significant effects? | YES/NO/NA | GDPR |
| 10.0 | Is a DPIA required - Automated decision-making? | YES/NO/NA | GDPR, EU AI Act |
| 11.0 | Is a DPIA required - Processing of special category data at scale? | YES/NO/NA | GDPR |
| 12.0 | Is a DPIA required - Systematic monitoring of employees? | YES/NO/NA | GDPR |
| 13.0 | Is a DPIA required - Processing of vulnerable data subjects? | YES/NO/NA | GDPR |
| 13.1 | [2025] Is a DPIA required - AI/ML processing (EU AI Act)? | YES/NO/NA | GDPR, EU AI Act |
| 14.0 | Is a DPIA required - Innovative technology use? | YES/NO/NA | GDPR |

### Output
- GDPR applicability flags
- DPIA trigger identification
- Cross-border transfer flags

---

## Section 2: Confidentiality Impact (ISO 5.12, 5.14)

**Purpose**: Evaluate the impact of unauthorized data disclosure.

### Questions

| ID | Question | Response Type | Weight |
|----|----------|---------------|--------|
| 17.0 | Could breach facilitate fraud against organization/clients? | YES/NO/NA | 4 |
| 18.0 | Could breach cause significant damage to organization reputation? | YES/NO/NA | 4 |
| 19.0 | Could breach result in legal liability/lawsuits? | YES/NO/NA | 4 |
| 20.0 | Could breach cause significant financial losses (>€50K)? | YES/NO/NA | 5 |
| 21.0 | Could breach violate professional secrecy/NDAs? | YES/NO/NA | 3 |
| 21.1 | [2025] Could breach result in regulatory fines (GDPR €20M, NIS2 €10M)? | YES/NO/NA | 5 |
| **22.0** | **What is the estimated financial impact of a confidentiality breach?** | SELECT | **10** |

### Question 22.0 Options (Determines C Rating)

| Value | Label | Weight | Financial Impact |
|-------|-------|--------|------------------|
| C1 | Public | 1 | <€50K |
| C2 | Internal | 2 | €50K-€500K |
| C3 | Confidential | 3 | €500K-€5M |
| C4 | Highly Confidential | 4 | >€5M |

### Rating Calculation

```
Confidentiality Rating = Q22.0 selection weight
                       + 1 for each YES answer on high-weight questions (17-21.1)
                       (capped at 4)
```

---

## Section 3: Integrity Impact (ISO 8.25, 8.28)

**Purpose**: Assess the consequences of data corruption or unauthorized modification.

### Questions

| ID | Question | Response Type | Weight |
|----|----------|---------------|--------|
| 23.0 | Could data corruption lead to incorrect management decisions? | YES/NO/NA | 4 |
| 24.0 | Could data corruption facilitate fraud? | YES/NO/NA | 4 |
| 25.0 | Could data corruption cause legal liability? | YES/NO/NA | 4 |
| 26.0 | Could data corruption cause significant operational costs? | YES/NO/NA | 3 |
| 27.0 | Could data corruption impact regulatory reporting accuracy? | YES/NO/NA | 4 |
| 27.1 | [2025] Could AI/ML model integrity issues cause harm (EU AI Act)? | YES/NO/NA | 4 |
| **28.0** | **What is the estimated integrity impact rating?** | SELECT | **10** |

### Question 28.0 Options (Determines I Rating)

| Value | Label | Weight | Description |
|-------|-------|--------|-------------|
| I1 | Low | 1 | Minor operational inconvenience |
| I2 | Medium | 2 | Moderate business impact |
| I3 | High | 3 | Significant business/financial impact |
| I4 | Critical | 4 | Severe impact, regulatory consequences |

---

## Section 4: Availability Impact (ISO 5.29, 5.30)

**Purpose**: Define recovery objectives and assess operational resilience.

### Questions

| ID | Question | Response Type | Regulatory |
|----|----------|---------------|------------|
| **29.0** | **What is the Maximum Outage Time (MOT)?** | SELECT | DORA, NIS2 |
| **30.0** | **What is the Recovery Point Objective (RPO)?** | SELECT | DORA |
| 30.1 | [DORA] Is this a Critical or Important Function? | YES/NO/NA | DORA |
| 30.2 | [NIS2] Is this an Essential or Important service? | YES/NO/NA | NIS2 |
| 31.0 | Are there time-critical business processes dependent on this application? | YES/NO/NA | DORA |
| 32.0 | Are there regulatory reporting deadlines dependent on availability? | YES/NO/NA | DORA, NIS2 |

### Question 29.0 Options (Determines A Rating)

| Value | Label | Weight | MOT | Description |
|-------|-------|--------|-----|-------------|
| A1 | Low | 1 | >72 hours | Non-critical systems |
| A2 | Medium | 2 | 24-72 hours | Important but deferrable |
| A3 | High | 3 | 4-24 hours | Business-critical |
| A4 | Critical | 4 | <4 hours | Mission-critical |

### Question 30.0 Options (RPO)

| Value | Label | Weight | RPO |
|-------|-------|--------|-----|
| RPO1 | Low | 1 | >24 hours |
| RPO2 | Medium | 2 | 4-24 hours |
| RPO3 | High | 3 | 1-4 hours |
| RPO4 | Critical | 4 | <1 hour |

---

## Section 5: AI/ML Assessment (EU AI Act)

**Purpose**: Evaluate AI/ML components against EU AI Act requirements.

### Questions

| ID | Question | Response Type | Regulatory |
|----|----------|---------------|------------|
| AI-1 | Does the application use AI/ML components? | YES/NO | EU AI Act |
| AI-2 | Is this an Unacceptable Risk AI (Art. 5 prohibited)? | YES/NO/NA | EU AI Act |
| AI-3 | Is this a High-Risk AI system (Annex III)? | YES/NO/NA | EU AI Act |
| AI-4 | Does the AI make decisions affecting natural persons? | YES/NO/NA | EU AI Act, GDPR |
| AI-5 | Is human oversight implemented (Art. 14)? | YES/NO/NA | EU AI Act |
| AI-6 | Is AI decision logging implemented (Art. 12)? | YES/NO/NA | EU AI Act |
| AI-7 | Is the AI system registered in EU database (Art. 49)? | YES/NO/NA | EU AI Act |
| **AI-8** | **What is the EU AI Act Risk Classification?** | SELECT | EU AI Act |

### Question AI-8 Options

| Value | Label | Description |
|-------|-------|-------------|
| MINIMAL | Minimal Risk | No specific obligations |
| LIMITED | Limited Risk | Transparency obligations |
| HIGH | High Risk | Strict compliance requirements |
| UNACCEPTABLE | Unacceptable Risk | Prohibited |

---

## Rating Calculations

### CIA Impact Calculation

```python
# From questionnaire responses
confidentiality = Q22_weight + boost_from_YES_answers
integrity = Q28_weight + boost_from_YES_answers
availability = Q29_weight  # Direct mapping from MOT

# Each rating capped at 4
```

### Business Criticality

```python
max_cia = max(confidentiality, integrity, availability)

business_criticality = {
    4: "CRITICAL",
    3: "HIGH",
    2: "MEDIUM",
    1: "LOW"
}[max_cia]
```

### Risk Level Calculation

```python
criticality_score = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1
}[business_criticality]

combined_score = (max_cia + criticality_score) / 2

risk_level = (
    "CRITICAL" if combined_score >= 3.5 else
    "HIGH" if combined_score >= 2.5 else
    "MEDIUM" if combined_score >= 1.5 else
    "LOW"
)
```

### Risk Level Matrix

| Max CIA | Criticality | Combined | Risk Level |
|---------|-------------|----------|------------|
| 4 | CRITICAL | 4.0 | CRITICAL |
| 4 | HIGH | 3.5 | CRITICAL |
| 3 | CRITICAL | 3.5 | CRITICAL |
| 4 | MEDIUM | 3.0 | HIGH |
| 3 | HIGH | 3.0 | HIGH |
| 3 | MEDIUM | 2.5 | HIGH |
| 2 | HIGH | 2.5 | HIGH |
| 2 | MEDIUM | 2.0 | MEDIUM |
| 2 | LOW | 1.5 | MEDIUM |
| 1 | MEDIUM | 1.5 | MEDIUM |
| 1 | LOW | 1.0 | LOW |

---

## Integration with SRL

The BIA Risk Level determines which Security Requirements apply:

| Risk Level | SRL Applicability Levels |
|------------|-------------------------|
| **CRITICAL** | ALL + MED_PLUS + HIGH_PLUS + CRIT_ONLY |
| **HIGH** | ALL + MED_PLUS + HIGH_PLUS |
| **MEDIUM** | ALL + MED_PLUS |
| **LOW** | ALL only |

---

## Audit Trail

All BIA responses are stored with:
- Timestamp
- User ID
- Question ID
- Response value
- Optional notes/justification

This provides full traceability for compliance audits and allows historical comparisons between ISRA versions.
