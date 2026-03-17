# Risk Register Import Templates

This directory contains CSV templates for bulk importing data into the Risk Register module.

## Import Order (Critical)

Import files in this exact order to maintain referential integrity:

| Order | File | Dependencies | Description |
|-------|------|--------------|-------------|
| 1 | `01-risks.csv` | Organisation | Parent risk entities |
| 2 | `02-risk-scenarios.csv` | Risks | Scenarios under each risk |
| 3 | `03-birt-impact-assessments.csv` | Scenarios | BIRT impact assessments |
| 4 | `04-likelihood-factors.csv` | Scenarios | F1-F6 likelihood factors |
| 5 | `05-kris.csv` | Risks | Key Risk Indicators |
| 6 | `06-treatment-plans.csv` | Risks, Scenarios | Treatment plans |
| 7 | `07-treatment-actions.csv` | Treatment Plans | Individual actions |
| 8 | `08-risk-tolerance-statements.csv` | Organisation | RTS statements |
| 9 | `09-control-risk-links.csv` | Risks, Controls | Risk-Control mappings |
| 10 | `10-scenario-control-links.csv` | Scenarios, Controls | Scenario-Control mappings |

## Template Reference

### 01-risks.csv - Risk Register

| Column | Required | Type | Values | Description |
|--------|----------|------|--------|-------------|
| riskId | Yes | String | `R-001` | Unique risk identifier |
| title | Yes | String | | Brief risk name |
| description | No | Text | | Detailed description |
| tier | Yes | Enum | `CORE`, `EXTENDED`, `ADVANCED` | Applicability tier |
| status | Yes | Enum | `IDENTIFIED`, `ASSESSED`, `TREATING`, `ACCEPTED`, `CLOSED` | Current status |
| framework | Yes | Enum | `ISO`, `SOC2`, `NIS2`, `DORA` | Compliance framework |
| riskOwner | No | String | | Accountable person |
| likelihood | No | Enum | `RARE`, `UNLIKELY`, `POSSIBLE`, `LIKELY`, `ALMOST_CERTAIN` | Initial likelihood |
| impact | No | Enum | `NEGLIGIBLE`, `MINOR`, `MODERATE`, `MAJOR`, `SEVERE` | Initial impact |
| treatmentPlan | No | Text | | High-level treatment description |
| acceptanceCriteria | No | Text | | Conditions for risk acceptance |
| soc2Criteria | No | String | `CC1.1, CC6.1` | SOC2 criteria mapping |
| tscCategory | No | String | `Security`, `Availability` | Trust Services Category |

---

### 02-risk-scenarios.csv - Risk Scenarios

| Column | Required | Type | Values | Description |
|--------|----------|------|--------|-------------|
| scenarioId | Yes | String | `R-001-S01` | Unique scenario ID |
| riskId | Yes | String | `R-001` | Parent risk ID |
| title | Yes | String | | Scenario name |
| cause | No | Text | | What triggers the risk |
| event | No | Text | | The risk event itself |
| consequence | No | Text | | Impact of the event |
| framework | Yes | Enum | `ISO`, `SOC2`, `NIS2`, `DORA` | Framework |
| sleLow | No | Number | | Single Loss Expectancy (low) |
| sleLikely | No | Number | | SLE (most likely) |
| sleHigh | No | Number | | SLE (worst case) |
| aro | No | Decimal | | Annual Rate of Occurrence |

---

### 03-birt-impact-assessments.csv - Impact Assessments

| Column | Required | Type | Values | Description |
|--------|----------|------|--------|-------------|
| scenarioId | Yes | String | `R-001-S01` | Scenario ID |
| category | Yes | Enum | `FINANCIAL`, `OPERATIONAL`, `LEGAL_REGULATORY`, `REPUTATION` | Impact category |
| level | Yes | Enum | `NEGLIGIBLE`, `MINOR`, `MODERATE`, `MAJOR`, `SEVERE` | Impact level |
| value | Yes | Integer | 1-5 | Numeric value |
| rationale | No | Text | | Justification |
| isResidual | Yes | Boolean | `true`, `false` | Inherent or Residual |

**Weights by Category:**
- FINANCIAL: 40%
- OPERATIONAL: 25%
- LEGAL_REGULATORY: 20%
- REPUTATION: 15%

---

### 04-likelihood-factors.csv - F1-F6 Factors

| Column | Required | Type | Description |
|--------|----------|------|-------------|
| scenarioId | Yes | String | Scenario ID |
| f1ThreatFrequency | No | Integer (1-5) | Threat frequency score |
| f1Source | No | String | Source: `THREAT_CATALOG`, `MANUAL`, etc. |
| f1Justification | No | Text | Rationale for score |
| f2ControlEffectiveness | No | Integer (1-5) | Control effectiveness score |
| f2Source | No | String | Source: `CONTROL_ASSESSMENT`, etc. |
| f2Justification | No | Text | Rationale |
| f3GapVulnerability | No | Integer (1-5) | Vulnerability/gap score |
| f3Source | No | String | Source: `VULNERABILITY_SCAN`, etc. |
| f3Justification | No | Text | Rationale |
| f4IncidentHistory | No | Integer (1-5) | Historical incidents score |
| f4Source | No | String | Source: `INCIDENT_HISTORY`, etc. |
| f4Justification | No | Text | Rationale |
| f5AttackSurface | No | Integer (1-5) | Attack surface score |
| f5Source | No | String | Source: `ASSET_REGISTRY`, etc. |
| f5Justification | No | Text | Rationale |
| f6Environmental | No | Integer (1-5) | Environmental factors score |
| f6Source | No | String | Source: `REGULATORY`, etc. |
| f6Justification | No | Text | Rationale |

**Factor Weights:**
- F1 Threat Frequency: 25%
- F2 Control Effectiveness: 25%
- F3 Gap/Vulnerability: 20%
- F4 Incident History: 15%
- F5 Attack Surface: 10%
- F6 Environmental: 5%

---

### 05-kris.csv - Key Risk Indicators

| Column | Required | Type | Values | Description |
|--------|----------|------|--------|-------------|
| kriId | Yes | String | `KRI-001` | Unique KRI ID |
| riskId | Yes | String | `R-001` | Associated risk |
| name | Yes | String | | KRI name |
| description | No | Text | | Detailed description |
| formula | No | String | | Calculation formula |
| unit | Yes | String | `%`, `count`, `days`, `hours` | Measurement unit |
| frequency | Yes | Enum | `DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `ANNUAL`, `PER_EVENT` | Collection frequency |
| dataSource | No | String | | Where data comes from |
| automated | Yes | Boolean | `true`, `false` | Automated collection |
| thresholdGreen | No | String | `<5%`, `>99%` | Safe threshold |
| thresholdAmber | No | String | `5-15%` | Warning threshold |
| thresholdRed | No | String | `>15%` | Critical threshold |
| tier | Yes | Enum | `CORE`, `EXTENDED`, `ADVANCED` | Applicability |
| framework | Yes | Enum | `ISO`, `SOC2`, `NIS2`, `DORA` | Framework |

---

### 06-treatment-plans.csv - Treatment Plans

| Column | Required | Type | Values | Description |
|--------|----------|------|--------|-------------|
| treatmentId | Yes | String | `TP-001` | Unique treatment ID |
| riskId | Yes | String | `R-001` | Associated risk |
| scenarioId | No | String | `R-001-S01` | Specific scenario (optional) |
| title | Yes | String | | Treatment title |
| description | Yes | Text | | What will be done |
| treatmentType | Yes | Enum | `MITIGATE`, `TRANSFER`, `ACCEPT`, `AVOID`, `SHARE` | Treatment approach |
| priority | Yes | Enum | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | Priority level |
| status | Yes | Enum | `DRAFT`, `PROPOSED`, `APPROVED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`, `CANCELLED` | Current status |
| targetResidualScore | No | Integer | 1-25 | Target score after treatment |
| estimatedCost | No | Number | | Budget estimate |
| costBenefit | No | Text | | ROI justification |
| targetStartDate | No | Date | `YYYY-MM-DD` | Planned start |
| targetEndDate | No | Date | `YYYY-MM-DD` | Planned completion |
| acceptanceRationale | No | Text | | For ACCEPT type |
| acceptanceCriteria | No | Text | | Success criteria |

---

### 07-treatment-actions.csv - Treatment Actions

| Column | Required | Type | Values | Description |
|--------|----------|------|--------|-------------|
| actionId | Yes | String | `ACT-001` | Unique action ID |
| treatmentPlanId | Yes | String | `TP-001` | Parent treatment plan |
| title | Yes | String | | Action title |
| description | No | Text | | Detailed description |
| status | Yes | Enum | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`, `CANCELLED` | Status |
| priority | Yes | Enum | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | Priority |
| dueDate | No | Date | `YYYY-MM-DD` | Due date |
| assignedTo | No | String | | Person responsible |
| estimatedHours | No | Number | | Effort estimate |

---

### 08-risk-tolerance-statements.csv - RTS

| Column | Required | Type | Values | Description |
|--------|----------|------|--------|-------------|
| rtsId | Yes | String | `RTS-001` | Unique RTS ID |
| title | Yes | String | | Statement title |
| objective | Yes | Text | | Business objective |
| domain | No | String | | Risk domain |
| proposedToleranceLevel | Yes | Enum | `HIGH`, `MEDIUM`, `LOW` | Tolerance level |
| proposedRTS | Yes | Text | | The tolerance statement |
| rationale | No | Text | | Justification |
| framework | Yes | Enum | `ISO`, `SOC2`, `NIS2`, `DORA` | Framework |
| effectiveDate | No | Date | `YYYY-MM-DD` | Effective from |
| reviewDate | No | Date | `YYYY-MM-DD` | Next review |

---

### 09-control-risk-links.csv - Risk-Control Mappings

| Column | Required | Type | Description |
|--------|----------|------|-------------|
| riskId | Yes | String | Risk ID |
| controlId | Yes | String | Control ID from Controls module |
| notes | No | Text | Mapping rationale |

---

### 10-scenario-control-links.csv - Scenario-Control Mappings

| Column | Required | Type | Description |
|--------|----------|------|-------------|
| scenarioId | Yes | String | Scenario ID |
| controlId | Yes | String | Control ID from Controls module |
| effectivenessWeight | No | Integer | Weight 0-100 (default 100) |
| isPrimaryControl | No | Boolean | Primary mitigating control |
| notes | No | Text | Mapping rationale |

---

## Validation Rules

### Risk IDs
- Format: `R-###` (e.g., `R-001`, `R-015`)
- Must be unique within organisation

### Scenario IDs
- Format: `{RiskID}-S##` (e.g., `R-001-S01`)
- Must reference existing risk

### Scores
- All scores: 1-5 (inclusive)
- Inherent Score = Likelihood × Impact (1-25)

### Dates
- Format: `YYYY-MM-DD`
- Target end date must be after start date

### Thresholds
- Green < Amber < Red (ascending severity)
- Use consistent format: `<5%`, `5-15%`, `>15%`

---

## Import Process

### 1. Prepare Data
```bash
# Validate CSV format
head -n 5 01-risks.csv

# Check for encoding issues
file 01-risks.csv
# Should show: UTF-8 Unicode text
```

### 2. Import via API (Recommended)
```bash
# Example using curl
curl -X POST http://localhost:3000/api/risks/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@01-risks.csv"
```

### 3. Import via Seed Script
```bash
# Run from apps/server directory
npx ts-node prisma/seed/import-risks.ts --file=docs/import-templates/01-risks.csv
```

### 4. Verify Import
```bash
# Check record counts
curl http://localhost:3000/api/risks/stats
```

---

## Sample Data Included

These templates include comprehensive ISO 27001-aligned risk data:

| Entity | Count | Coverage |
|--------|-------|----------|
| Risks | 25 | All ISO 27001 risk domains (R-01 to R-25) |
| Scenarios | 80 | 2-4 scenarios per risk with cause/event/consequence |
| Impact Assessments | 32 | Sample BIRT categories (expand as needed) |
| Likelihood Factors | 8 | Sample F1-F6 coverage (expand as needed) |
| KRIs | 68 | Full KRI library with thresholds |
| Treatment Plans | 12 | Sample treatment types |
| Treatment Actions | 24 | Mix of statuses |
| RTS | 10 | Key domains |
| Control Links | 99 | ISO 27001 Annex A control mappings |
| Scenario Control Links | 105 | Scenario-specific ISO control mappings |

**Data Source:** Converted from ISO27001_Risk_Methodology_Template.xlsx

---

## Customization

### Adapting for Your Organization

1. **Update Risk IDs** - Use your naming convention
2. **Adjust Tiers** - Map to your organization size
3. **Modify Thresholds** - Align KRI thresholds to your tolerances
4. **Update Frameworks** - Select applicable frameworks
5. **Customize Treatment Costs** - Use your currency and estimates

### Adding New Risks

1. Copy a row from `01-risks.csv`
2. Update all fields
3. Create corresponding scenarios in `02-risk-scenarios.csv`
4. Add impact assessments in `03-birt-impact-assessments.csv`
5. Link controls in `09-control-risk-links.csv`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Import fails with "duplicate key" | Check for duplicate IDs in CSV |
| Risk not found | Ensure risks imported before scenarios |
| Control not found | Import Controls module first |
| Invalid enum value | Check allowed values in this README |
| Date format error | Use `YYYY-MM-DD` format |

---

## Questions?

Contact the GRC team or refer to:
- `docs/RISK_SCENARIO_SCORE_CALCULATION.md` - Scoring methodology
- `docs/risk-module/` - Full module documentation
