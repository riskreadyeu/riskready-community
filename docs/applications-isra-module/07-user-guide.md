# User Guide

## Getting Started

### Accessing the Module

1. Log in to RiskReady
2. Navigate to **Applications & ISRA** in the sidebar
3. You'll see the Application Register listing all applications

---

## Application Management

### Creating a New Application

1. Click **+ New Application** button
2. Fill in the required fields:
   - **Application ID**: Unique identifier (e.g., APP-001)
   - **Name**: Application name
3. Fill in recommended fields:
   - **Description**: Brief description
   - **Business Owner**: Name and email
   - **Technical Owner**: Name and email
   - **Criticality**: Initial criticality assessment
4. Click **Create**

### Application Fields Guide

#### Identification
| Field | Description | Required |
|-------|-------------|----------|
| Application ID | Unique identifier | ✅ |
| Name | Application name | ✅ |
| Description | Brief description | Recommended |

#### Ownership
| Field | Description |
|-------|-------------|
| Business Owner | Department, name, email |
| Technical Owner | Department, name, email |
| Executive Sponsor | Senior accountable person |

#### Classification
| Field | Description |
|-------|-------------|
| Criticality | LOW, MEDIUM, HIGH, CRITICAL |
| Data Classification | PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED |
| C/I/A Ratings | Initial 1-4 ratings |

#### Technical
| Field | Description |
|-------|-------------|
| Hosting Model | ON_PREMISE, CLOUD_PUBLIC, SAAS, etc. |
| Cloud Provider | AWS, Azure, GCP, etc. |
| Technology Stack | Languages, frameworks |

#### Compliance
| Field | Description |
|-------|-------------|
| DORA Critical Function | Is this critical under DORA? |
| PCI Scope | Payment card processing? |
| SOX Relevant | Financial reporting impact? |

### Viewing Application Details

Click on any application row to view:
- Complete application information
- ISRA history
- Current risk assessment status

---

## ISRA Process

### Starting a New ISRA

1. Navigate to the application detail page
2. Click **Start New ISRA**
3. Optionally assign a Lead Assessor
4. The ISRA is created in DRAFT status

### ISRA Workflow

```
DRAFT → IN_PROGRESS → COMPLETED → ARCHIVED
```

1. **DRAFT**: Initial state, preparing assessment
2. **IN_PROGRESS**: Actively performing BIA, TVA, SRL
3. **COMPLETED**: All assessments done, findings documented
4. **ARCHIVED**: Historical reference

---

## Business Impact Analysis (BIA)

### Starting the BIA

From the ISRA detail page, navigate to the **BIA** tab:
- Click **Start BIA Questionnaire** for the full questionnaire
- Or click **Quick Entry (Legacy)** for direct rating input

### Completing the Questionnaire

The BIA has 5 sections with 45 total questions:

#### Section 1: Data Processing & Privacy (17 questions)

This section assesses GDPR compliance:

1. **Personal Data Questions** (Q1-Q3)
   - Does the app process personal data?
   - Special categories (health, biometric)?
   - Criminal conviction data?

2. **Processing Details** (Q4-Q6)
   - Purpose of processing
   - Legal basis (consent, contract, etc.)
   - ROPA registration

3. **DPIA Triggers** (Q7-Q14)
   - Large scale processing?
   - Public area monitoring?
   - Profiling with significant effects?
   - Automated decision-making?
   - Vulnerable data subjects?
   - Innovative technology?

**Tips:**
- Answer "N/A" if the question doesn't apply
- Add notes for complex situations
- "YES" answers on DPIA triggers require DPIA completion

#### Section 2: Confidentiality Impact (7 questions)

Assesses data breach consequences:

1. **Impact Questions** (Q17-Q21)
   - Fraud facilitation?
   - Reputation damage?
   - Legal liability?
   - Financial losses?
   - NDA violations?

2. **Financial Impact Selection** (Q22)
   - C1: <€50K (Public)
   - C2: €50K-€500K (Internal)
   - C3: €500K-€5M (Confidential)
   - C4: >€5M (Restricted)

**This determines the Confidentiality rating (1-4)**

#### Section 3: Integrity Impact (7 questions)

Assesses data corruption consequences:

1. **Impact Questions** (Q23-Q27)
   - Wrong management decisions?
   - Fraud facilitation?
   - Legal liability?
   - Operational costs?
   - Regulatory reporting accuracy?

2. **Integrity Rating Selection** (Q28)
   - I1: Low - Minor inconvenience
   - I2: Medium - Moderate impact
   - I3: High - Significant impact
   - I4: Critical - Severe impact

**This determines the Integrity rating (1-4)**

#### Section 4: Availability Impact (6 questions)

Defines recovery requirements:

1. **Maximum Outage Time** (Q29)
   - A1: >72 hours (Low)
   - A2: 24-72 hours (Medium)
   - A3: 4-24 hours (High)
   - A4: <4 hours (Critical)

2. **Recovery Point Objective** (Q30)
   - RPO1: >24 hours
   - RPO2: 4-24 hours
   - RPO3: 1-4 hours
   - RPO4: <1 hour

3. **Regulatory Classification** (Q30.1-Q30.2)
   - DORA Critical Function?
   - NIS2 Essential Service?

**This determines the Availability rating (1-4)**

#### Section 5: AI/ML Assessment (8 questions)

For applications with AI/ML components:

1. **AI Presence** (AI-1)
   - Does the app use AI/ML?

2. **Risk Classification** (AI-2 to AI-7)
   - Unacceptable risk (prohibited)?
   - High-risk system?
   - Affects natural persons?
   - Human oversight?
   - Decision logging?
   - EU database registration?

3. **Final Classification** (AI-8)
   - MINIMAL
   - LIMITED
   - HIGH
   - UNACCEPTABLE

### Understanding Results

After completing all sections:

1. **CIA Ratings** are calculated (1-4 each)
2. **Business Criticality** = Max(C, I, A) mapped to level
3. **Risk Level** = (Max CIA + Criticality Score) / 2

Example:
- C=3, I=2, A=4 → Max=4
- Business Criticality = CRITICAL
- Risk Level = (4 + 4) / 2 = 4 → CRITICAL

---

## Threat Vulnerability Assessment (TVA)

### Starting the TVA

From the ISRA detail page, navigate to the **TVA** tab:
1. Click **Initialize TVA**
2. Review the threat catalog

### Assessing Threats

For each threat in the catalog:

1. **Review Applicability**
   - Is this threat relevant to the application?
   - Consider the architecture, exposure, data handled

2. **Assess Likelihood** (if applicable)
   - 1: Rare (unlikely to occur)
   - 2: Possible (could occur)
   - 3: Likely (probable to occur)
   - 4: Almost Certain (expected to occur)

3. **Override Impacts** (optional)
   - Adjust C/I/A impacts if application-specific

4. **Add Rationale**
   - Document why applicable/not applicable
   - Note any mitigating factors

### Adding Vulnerabilities

1. Click **Add Vulnerability**
2. Enter details:
   - Vulnerability ID (e.g., CVE-2024-1234)
   - Name and description
   - Severity (1-4)
   - Status (OPEN, IN_REMEDIATION, etc.)

### Understanding TVA Scores

- **Threat Score**: Average risk score of applicable threats
- **Vulnerability Score**: Average severity of open vulnerabilities
- **Overall TVA Score**: (Threat + Vulnerability) / 2

---

## Security Requirements List (SRL)

### Generating the SRL

From the ISRA detail page, navigate to the **SRL** tab:
1. Click **Generate SRL**
2. Requirements are filtered based on BIA risk level

### Applicability Rules

| Risk Level | Requirements Included |
|------------|----------------------|
| CRITICAL | ALL + MED_PLUS + HIGH_PLUS + CRIT_ONLY |
| HIGH | ALL + MED_PLUS + HIGH_PLUS |
| MEDIUM | ALL + MED_PLUS |
| LOW | ALL only |

### Assessing Coverage

For each requirement:

1. **Review the requirement**
   - What is required?
   - What evidence is needed?

2. **Check organizational capability**
   - Is this control implemented?
   - Is there evidence?

3. **Set coverage status**
   - ✅ **COVERED**: Fully implemented
   - ⚠️ **PARTIAL**: Partially implemented
   - ❌ **GAP**: Not implemented
   - ➖ **NOT_APPLICABLE**: Doesn't apply (with justification)

4. **Document evidence**
   - Reference policy, procedure, or technical evidence
   - Link to capability assessment

### Processing Gaps

1. Click **Process Gaps**
2. System creates Nonconformities for GAP/PARTIAL entries
3. NC severity is calculated based on:
   - Asset Criticality (from BIA)
   - Threat Impact (from related threats)

---

## Reviewing Results

### ISRA Dashboard

The ISRA detail page shows:

1. **Assessment Status**: Current workflow state
2. **BIA Summary**: Risk level, CIA ratings
3. **TVA Summary**: Threat and vulnerability scores
4. **SRL Summary**: Coverage percentage, gap count
5. **Nonconformities**: Generated findings

### Coverage Metrics

The SRL tab displays:
- Total requirements applicable
- Coverage breakdown (Covered/Partial/Gap/NA)
- Coverage percentage
- Coverage by domain

### Next Steps

After completing an ISRA:

1. **Review Nonconformities**
   - Prioritize by severity
   - Assign owners
   - Set remediation timelines

2. **Update Risk Register**
   - Link NCs to risks
   - Plan risk treatments

3. **Schedule Follow-up**
   - Plan next ISRA
   - Track remediation progress

---

## Best Practices

### BIA Best Practices

1. **Involve stakeholders** - Include business and technical owners
2. **Be consistent** - Use the same criteria across applications
3. **Document thoroughly** - Add notes for complex answers
4. **Review annually** - Update as business context changes

### TVA Best Practices

1. **Complete assessment** - Don't skip threats
2. **Use current intelligence** - Consider recent threats
3. **Track vulnerabilities** - Keep list updated
4. **Link to controls** - Ensure threats map to controls

### SRL Best Practices

1. **Evidence everything** - Document control implementation
2. **Link to capabilities** - Connect to capability assessments
3. **Prioritize gaps** - Focus on high-severity items
4. **Track progress** - Monitor remediation status

---

## Troubleshooting

### Common Issues

**Q: BIA ratings seem wrong**
A: Use "Recalculate" to force recalculation from responses

**Q: SRL not generating**
A: Ensure BIA is completed first (risk level needed)

**Q: Coverage percentage not updating**
A: Check that all entries have been assessed

**Q: NCs not created**
A: Click "Process Gaps" to generate NCs from gaps

### Getting Help

- Check documentation in `/docs/applications-isra-module/`
- Contact system administrator
- Review API reference for technical issues
