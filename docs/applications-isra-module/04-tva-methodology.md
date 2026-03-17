# TVA Methodology

## Overview

The Threat Vulnerability Assessment (TVA) identifies and assesses application-specific security threats and known vulnerabilities to calculate an overall risk score.

## Components

### 1. Threat Assessment
Assessment of applicable threats from the threat catalog with likelihood and impact ratings.

### 2. Vulnerability Assessment
Tracking of known vulnerabilities with severity ratings.

### 3. Combined TVA Score
Aggregated score from threat and vulnerability assessments.

---

## Threat Catalog

The system maintains a predefined threat catalog with base likelihood and CIA impact ratings.

### Threat Categories

| Category | Description | Examples |
|----------|-------------|----------|
| MALWARE | Malicious software threats | Ransomware, Trojans, Worms |
| SOCIAL_ENGINEERING | Human manipulation attacks | Phishing, Pretexting, Baiting |
| UNAUTHORIZED_ACCESS | Access control violations | Credential theft, Privilege escalation |
| DATA_BREACH | Data exposure threats | Exfiltration, Leakage |
| DENIAL_OF_SERVICE | Availability attacks | DDoS, Resource exhaustion |
| INSIDER_THREAT | Internal actor threats | Malicious insider, Negligence |
| PHYSICAL | Physical security threats | Theft, Natural disaster |
| SUPPLY_CHAIN | Third-party risks | Vendor compromise, Software supply chain |
| TECHNICAL_FAILURE | System failures | Hardware failure, Software bugs |
| NATURAL_DISASTER | Environmental threats | Fire, Flood, Earthquake |
| COMPLIANCE | Regulatory risks | Audit findings, Policy violations |
| THIRD_PARTY | External party risks | Partner breach, Service provider failure |

### Sample Threat Catalog Entries

| ID | Name | Category | Base Likelihood | C | I | A |
|----|------|----------|-----------------|---|---|---|
| T001 | Ransomware Attack | MALWARE | 3 | 2 | 4 | 4 |
| T002 | Phishing Campaign | SOCIAL_ENGINEERING | 4 | 3 | 2 | 1 |
| T003 | SQL Injection | UNAUTHORIZED_ACCESS | 3 | 4 | 4 | 2 |
| T004 | DDoS Attack | DENIAL_OF_SERVICE | 2 | 1 | 1 | 4 |
| T005 | Insider Data Theft | INSIDER_THREAT | 2 | 4 | 2 | 1 |
| T006 | API Vulnerability | TECHNICAL_FAILURE | 3 | 3 | 3 | 2 |
| T007 | Third-Party Breach | THIRD_PARTY | 2 | 3 | 2 | 2 |
| T008 | Cryptographic Weakness | TECHNICAL_FAILURE | 2 | 4 | 3 | 1 |
| T009 | Privilege Escalation | UNAUTHORIZED_ACCESS | 2 | 3 | 4 | 2 |
| T010 | Data Center Outage | PHYSICAL | 1 | 1 | 1 | 4 |

---

## Threat Assessment Process

### Step 1: Applicability Review

For each threat in the catalog:
- Mark as **Applicable** if the threat is relevant to the application
- Mark as **Not Applicable** if the threat does not apply (with justification)

### Step 2: Override Ratings (Optional)

For applicable threats, optionally override:
- **Likelihood** (1-4): Application-specific likelihood
- **Confidentiality Impact** (1-4)
- **Integrity Impact** (1-4)
- **Availability Impact** (1-4)

If not overridden, base catalog values are used.

### Step 3: Risk Score Calculation

For each applicable threat:

```python
likelihood = override_likelihood or base_likelihood
c_impact = override_c or base_c
i_impact = override_i or base_i
a_impact = override_a or base_a

max_impact = max(c_impact, i_impact, a_impact)

threat_risk_score = likelihood × max_impact
```

### Risk Score Scale

| Score | Risk Level | Description |
|-------|------------|-------------|
| 1-3 | Low | Minor risk, standard controls sufficient |
| 4-8 | Medium | Moderate risk, enhanced controls recommended |
| 9-12 | High | Significant risk, priority remediation |
| 13-16 | Critical | Severe risk, immediate action required |

---

## Vulnerability Assessment

### Vulnerability Entry Fields

| Field | Description |
|-------|-------------|
| Vulnerability ID | External reference (CVE, internal ID) |
| Name | Vulnerability name |
| Description | Detailed description |
| Severity | 1-4 scale (Critical=4, High=3, Medium=2, Low=1) |
| Status | OPEN, IN_REMEDIATION, MITIGATED, CLOSED |
| Discovery Date | When vulnerability was identified |
| Due Date | Remediation deadline |
| CVE Reference | CVE ID if applicable |

### Severity Mapping

| Severity | Score | CVSS Equivalent | SLA |
|----------|-------|-----------------|-----|
| Critical | 4 | 9.0-10.0 | 7 days |
| High | 3 | 7.0-8.9 | 30 days |
| Medium | 2 | 4.0-6.9 | 90 days |
| Low | 1 | 0.1-3.9 | 180 days |

---

## TVA Score Calculation

### Threat Score

```python
applicable_threats = [t for t in threats if t.is_applicable]
threat_risk_scores = [t.risk_score for t in applicable_threats]

if threat_risk_scores:
    threat_score = sum(threat_risk_scores) / len(threat_risk_scores)
else:
    threat_score = 0
```

### Vulnerability Score

```python
open_vulnerabilities = [v for v in vulnerabilities if v.status in ['OPEN', 'IN_REMEDIATION']]
vuln_severities = [v.severity for v in open_vulnerabilities]

if vuln_severities:
    vulnerability_score = sum(vuln_severities) / len(vuln_severities)
else:
    vulnerability_score = 0
```

### Overall TVA Score

```python
overall_tva_score = (threat_score + vulnerability_score) / 2
```

---

## TVA Output

### Summary Metrics

| Metric | Description |
|--------|-------------|
| Threat Score | Average risk score of applicable threats |
| Vulnerability Score | Average severity of open vulnerabilities |
| Overall TVA Score | Combined assessment score |
| Active Threats | Count of applicable threats |
| Open Vulnerabilities | Count of open/in-remediation vulnerabilities |

### Per-Threat Details

| Field | Description |
|-------|-------------|
| Threat ID | Catalog reference |
| Category | Threat category |
| Name | Threat name |
| Applicability | Yes/No with rationale |
| Likelihood | 1-4 (base or override) |
| C/I/A Impacts | 1-4 each (base or override) |
| Risk Score | Likelihood × Max Impact |
| Related Controls | ISO controls for mitigation |

---

## Integration with SRL

The TVA informs the SRL process:

1. **Threat-to-Control Mapping**: Each threat has related ISO controls
2. **SRL Requirements**: Requirements may reference specific threats
3. **Gap Prioritization**: NC severity considers threat impact

### NC Severity Calculation (for SRL Gaps)

When a gap is identified in the SRL:

```python
asset_criticality = bia.risk_level_score  # 1-4
threat_impact = max(related_threat.c, related_threat.i, related_threat.a)

risk_score = asset_criticality × threat_impact

nc_severity = (
    "CRITICAL" if risk_score >= 12 else
    "HIGH" if risk_score >= 8 else
    "MEDIUM" if risk_score >= 4 else
    "LOW"
)
```

---

## Best Practices

### Threat Assessment

1. **Review all threats** - Don't skip the full catalog review
2. **Document rationale** - Explain why threats are/aren't applicable
3. **Consider context** - Application architecture affects threat applicability
4. **Update periodically** - Threat landscape changes

### Vulnerability Assessment

1. **Integrate scanning** - Import from vulnerability scanners
2. **Track remediation** - Monitor status and SLAs
3. **Prioritize by severity** - Critical vulnerabilities first
4. **Verify closure** - Re-test before closing

### Combined Assessment

1. **Link threats to vulnerabilities** - Understand exploit paths
2. **Consider compensating controls** - May reduce effective risk
3. **Document assumptions** - Transparency for auditors
4. **Review regularly** - Part of continuous monitoring
