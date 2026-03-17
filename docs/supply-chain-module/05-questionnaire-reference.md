# Supply Chain Module - Questionnaire Reference

This document provides detailed documentation of the assessment questionnaire structure, domains, and scoring methodology.

## Overview

The Supply Chain module uses a layered questionnaire approach covering three compliance frameworks:

| Framework | Questions | Purpose |
|-----------|-----------|---------|
| **ISO 27001** | 102 | Baseline security controls |
| **NIS2** | 55 | EU directive additional requirements |
| **DORA** | 66 | Financial sector resilience requirements |
| **Total** | **223** | Complete questionnaire |

## Framework Layers

### Layered Compliance Approach

```
┌─────────────────────────────────────────────────┐
│                    DORA                         │  ← 66 additional questions
│         (Financial sector resilience)          │     ICT risk, resilience testing,
│                                                 │     third-party oversight
├─────────────────────────────────────────────────┤
│                    NIS2                         │  ← 55 additional questions
│            (EU cybersecurity)                   │     Management accountability,
│                                                 │     supply chain, reporting
├─────────────────────────────────────────────────┤
│                  ISO 27001                      │  ← 102 baseline questions
│              (Baseline security)                │     Core information security
│                                                 │     Annex A controls
└─────────────────────────────────────────────────┘
```

### Framework Selection by Vendor Scope

| Vendor Scope | Frameworks Applied | Question Count |
|--------------|-------------------|----------------|
| All vendors | ISO 27001 | 102 |
| NIS2 scope | ISO 27001 + NIS2 | 157 |
| DORA scope | ISO 27001 + NIS2 + DORA | 223 |

## Domain Structure

The questionnaire is organized into 16 domains:

### 1. Governance & Organization (17 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 10 | Policies, roles, responsibilities |
| NIS2 | 4 | Management accountability |
| DORA | 3 | ICT governance |

**Key Topics:**
- Information security policy
- Organizational structure
- Management responsibilities
- Role separation
- ICT risk management framework (DORA)

---

### 2. Information Security Management (17 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 10 | ISMS requirements |
| NIS2 | 4 | Cybersecurity measures |
| DORA | 3 | ICT security framework |

**Key Topics:**
- ISMS documentation
- Security objectives
- Internal audit program
- Management review
- Security metrics

---

### 3. Risk Management (16 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 8 | Risk assessment process |
| NIS2 | 4 | Cyber risk management |
| DORA | 4 | ICT risk framework |

**Key Topics:**
- Risk identification methodology
- Risk assessment process
- Risk treatment plans
- Risk monitoring
- ICT concentration risk (DORA)

---

### 4. HR Security (9 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 6 | Personnel security |
| NIS2 | 2 | Training requirements |
| DORA | 1 | Specialist training |

**Key Topics:**
- Pre-employment screening
- Terms of employment
- Security awareness training
- Disciplinary process
- Termination procedures

---

### 5. Asset Management (11 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 7 | Asset classification |
| NIS2 | 2 | Critical asset identification |
| DORA | 2 | ICT asset inventory |

**Key Topics:**
- Asset inventory
- Asset ownership
- Classification scheme
- Media handling
- ICT asset classification (DORA)

---

### 6. Access Control (14 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 9 | Access management |
| NIS2 | 3 | Privileged access |
| DORA | 2 | ICT access controls |

**Key Topics:**
- Access control policy
- User registration/deregistration
- Privilege management
- Authentication mechanisms
- Access reviews

---

### 7. Cryptography (8 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 5 | Cryptographic controls |
| NIS2 | 2 | Encryption requirements |
| DORA | 1 | Data protection |

**Key Topics:**
- Cryptographic policy
- Key management
- Data encryption
- Communication encryption
- Certificate management

---

### 8. Physical Security (10 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 7 | Physical protection |
| NIS2 | 2 | Infrastructure security |
| DORA | 1 | Data center requirements |

**Key Topics:**
- Secure perimeters
- Entry controls
- Equipment security
- Secure disposal
- Environmental controls

---

### 9. Operations Security (16 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 9 | Operational procedures |
| NIS2 | 4 | Operational resilience |
| DORA | 3 | ICT operations |

**Key Topics:**
- Documented procedures
- Change management
- Capacity management
- Malware protection
- Backup procedures
- Logging and monitoring

---

### 10. Communications Security (13 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 8 | Network security |
| NIS2 | 3 | Secure communications |
| DORA | 2 | ICT network resilience |

**Key Topics:**
- Network controls
- Network segregation
- Information transfer
- Secure messaging
- Network monitoring

---

### 11. System Development (14 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 9 | Secure development |
| NIS2 | 3 | Security by design |
| DORA | 2 | ICT change management |

**Key Topics:**
- Secure development policy
- Security requirements
- Secure coding practices
- Testing procedures
- Change control

---

### 12. Supplier Management (16 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 6 | Supplier relationships |
| NIS2 | 5 | Supply chain security |
| DORA | 5 | Third-party ICT risk |

**Key Topics:**
- Supplier security policy
- Supply chain agreements
- Supplier monitoring
- Subcontracting controls
- Exit strategies (DORA)

---

### 13. Incident Management (17 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 7 | Incident response |
| NIS2 | 6 | Incident reporting (24h/72h) |
| DORA | 4 | ICT incident management |

**Key Topics:**
- Incident response procedures
- Incident classification
- Evidence collection
- Regulatory reporting
- Lessons learned

---

### 14. Business Continuity (17 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 7 | BCM requirements |
| NIS2 | 4 | Service continuity |
| DORA | 6 | ICT resilience testing |

**Key Topics:**
- BCM policy
- Business impact analysis
- Continuity plans
- Testing and exercises
- Digital resilience testing (DORA)

---

### 15. Compliance (14 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 8 | Legal compliance |
| NIS2 | 3 | Regulatory compliance |
| DORA | 3 | Financial sector compliance |

**Key Topics:**
- Legal requirements identification
- Intellectual property
- Records protection
- Privacy and PII
- Independent audit

---

### 16. Data Protection (14 questions)

| Framework | Count | Focus Areas |
|-----------|-------|-------------|
| ISO | 6 | Data security |
| NIS2 | 4 | Data handling |
| DORA | 4 | Data location requirements |

**Key Topics:**
- Data classification
- Data handling procedures
- Data retention
- Data transfer controls
- Data location (DORA Art. 28)

---

## Tier-Based Question Applicability

Questions are tagged for tier applicability:

| Tier Applicability | Description | Question Count |
|-------------------|-------------|----------------|
| **All** | Applicable to all vendors | 176 |
| **Critical/High** | Only for CRITICAL and HIGH tier | 35 |
| **Critical** | Only for CRITICAL tier vendors | 12 |

### Question Distribution by Tier

| Vendor Tier | Questions Included | Percentage |
|-------------|-------------------|------------|
| CRITICAL | 223 | 100% |
| HIGH | 211 | 94.6% |
| MEDIUM | 176 | 78.9% |
| LOW | 176 | 78.9% |

---

## Risk Weighting

Questions are weighted based on security importance:

| Weight | Multiplier | Description | Count |
|--------|------------|-------------|-------|
| **CRITICAL** | 4.0x | Essential security controls | 25 |
| **HIGH** | 3.0x | Important security measures | 68 |
| **MEDIUM** | 2.0x | Standard security practices | 98 |
| **LOW** | 1.0x | Best practices, nice-to-have | 32 |

### Weight Distribution

```
LOW (14.3%)        ███████░░░░░░░░░░░░░░░░░░
MEDIUM (44.0%)     ██████████████████████░░░
HIGH (30.5%)       ███████████████░░░░░░░░░░
CRITICAL (11.2%)   █████░░░░░░░░░░░░░░░░░░░░
```

---

## Scoring Methodology

### Response Scale

| Score | Label | Description |
|-------|-------|-------------|
| 0 | N/A | Not applicable to this vendor |
| 1 | None | No control in place |
| 2 | Informal | Ad-hoc, undocumented approach |
| 3 | Developing | Partially implemented, documented |
| 4 | Defined | Documented, consistently applied |
| 5 | Optimized | Mature, monitored, continuously improved |

### Score Calculation

**Weighted Score Formula:**

```
Question Score = (Response Score / 5) × Risk Weight

Domain Score = Σ(Question Scores) / Σ(Max Possible Scores) × 100

Overall Score = Σ(All Question Scores) / Σ(All Max Possible Scores) × 100
```

**Example Calculation:**

| Question | Response | Weight | Weighted Score | Max Possible |
|----------|----------|--------|----------------|--------------|
| Q1 | 4 | HIGH (3.0) | (4/5) × 3.0 = 2.4 | 3.0 |
| Q2 | 3 | MEDIUM (2.0) | (3/5) × 2.0 = 1.2 | 2.0 |
| Q3 | 5 | CRITICAL (4.0) | (5/5) × 4.0 = 4.0 | 4.0 |
| **Total** | | | **7.6** | **9.0** |

**Domain Score = 7.6 / 9.0 × 100 = 84.4%**

### Tier Calculation from Score

| Overall Score | Calculated Tier |
|---------------|-----------------|
| ≥ 80 | LOW |
| 70 - 79 | MEDIUM |
| 60 - 69 | HIGH |
| < 60 | CRITICAL |

**Override Conditions:**
- If `isCriticalIctProvider = true` → CRITICAL
- If `supportsEssentialFunction = true` → CRITICAL
- If has CRITICAL-criticality service AND score < 60 → CRITICAL
- If has HIGH-criticality service OR score < 70 → HIGH

---

## Evidence Requirements

### Evidence Expectations

Each question includes guidance on expected evidence:

| Evidence Type | Description | Examples |
|---------------|-------------|----------|
| **Policy Document** | Formal documented policy | Information Security Policy |
| **Procedure Document** | Step-by-step procedures | Incident Response Procedure |
| **Certificate** | Third-party certification | ISO 27001 certificate |
| **Report** | Audit or assessment report | SOC 2 Type II report |
| **Screenshot** | System configuration evidence | Access control settings |
| **Log/Record** | Activity records | Access review logs |

### Common Evidence by Domain

| Domain | Typical Evidence |
|--------|-----------------|
| Governance | Policies, org charts, meeting minutes |
| Risk Management | Risk register, assessment reports |
| Access Control | User lists, access review logs, MFA configs |
| Incident Management | Incident logs, response procedures, drill records |
| Business Continuity | BCP documents, test results, recovery objectives |

---

## Question Bank Management

### Seeding Questions

Questions are seeded from the Excel questionnaire file:

```bash
cd apps/server
npx prisma db seed
```

This populates the `AssessmentQuestion` table with all 223 questions.

### Question Structure

Each question includes:

| Field | Description |
|-------|-------------|
| `questionNumber` | Unique sequential number (1-223) |
| `domain` | Category (e.g., "1. Governance & Organization") |
| `subArea` | Sub-category (e.g., "Structure", "Policies") |
| `questionText` | Full question text |
| `frameworkLayer` | ISO, NIS2, or DORA |
| `regulatoryRef` | Reference (e.g., "A.5.1", "Art. 20") |
| `tierApplicability` | "All", "Critical/High", or "Critical" |
| `riskWeight` | CRITICAL, HIGH, MEDIUM, or LOW |
| `evidenceExpected` | Guidance on required evidence |
| `guidanceNotes` | Assessor guidance |

### Viewing the Question Bank

Access via: **Regulatory > Question Bank**

Features:
- Browse all questions
- Filter by framework, domain, weight
- Search question text
- View evidence requirements

---

## Regulatory References

### ISO 27001:2022 Annex A Mapping

| Domain | ISO 27001 Controls |
|--------|-------------------|
| Governance | A.5.1-A.5.8 |
| Information Security | A.5.9-A.5.15 |
| Risk Management | A.5.16-A.5.23 |
| HR Security | A.6.1-A.6.8 |
| Asset Management | A.5.9-A.5.13 |
| Access Control | A.5.15-A.5.18, A.8.1-A.8.5 |
| Cryptography | A.8.24 |
| Physical Security | A.7.1-A.7.14 |
| Operations | A.8.1-A.8.34 |
| Communications | A.8.20-A.8.22 |
| Development | A.8.25-A.8.31 |
| Supplier | A.5.19-A.5.23 |
| Incidents | A.5.24-A.5.28 |
| BCM | A.5.29-A.5.30 |
| Compliance | A.5.31-A.5.37 |
| Data Protection | A.8.10-A.8.12 |

### NIS2 Directive Article References

| Domain | NIS2 Articles |
|--------|--------------|
| Governance | Art. 20 (Governance) |
| Risk Management | Art. 21 (Cybersecurity measures) |
| Incident Management | Art. 23 (Reporting obligations) |
| Supply Chain | Art. 21(2)(d) (Supply chain security) |
| BCM | Art. 21(2)(c) (Business continuity) |

### DORA Regulation Article References

| Domain | DORA Articles |
|--------|--------------|
| Governance | Art. 5 (ICT governance) |
| Risk Management | Art. 6-16 (ICT risk management) |
| Incident Management | Art. 17-23 (ICT incidents) |
| Resilience Testing | Art. 24-27 (Testing) |
| Third-Party | Art. 28-30 (Third-party risk) |
| Concentration | Art. 29 (Concentration risk) |
| Contracts | Art. 30 (Key provisions) |
