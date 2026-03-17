# SRL Methodology

## Overview

The Security Requirements List (SRL) is a dynamically generated set of security controls applicable to an application based on its BIA risk level. The SRL maps to organizational capabilities and identifies gaps that generate Nonconformities.

## Core Concepts

### SRL Master Requirements

A centralized catalog of security requirements with:
- Requirement ID and description
- Domain classification
- Applicability level (risk-based)
- ISO control mapping
- Capability mapping
- Evidence requirements
- Test methods

### Applicability Levels

| Level | Code | Description | Example |
|-------|------|-------------|---------|
| All | `ALL` | Applies to all applications | Basic access control |
| Medium+ | `MED_PLUS` | Medium risk and above | Logging requirements |
| High+ | `HIGH_PLUS` | High risk and above | Encryption at rest |
| Critical Only | `CRIT_ONLY` | Critical applications only | HSM for key management |

---

## SRL Generation Process

### Step 1: Determine Risk Level

Risk level comes from the completed BIA:

```python
risk_level = bia.risk_level  # CRITICAL, HIGH, MEDIUM, or LOW
```

### Step 2: Filter Applicable Requirements

```python
def get_applicable_requirements(risk_level):
    applicability_map = {
        "CRITICAL": ["ALL", "MED_PLUS", "HIGH_PLUS", "CRIT_ONLY"],
        "HIGH":     ["ALL", "MED_PLUS", "HIGH_PLUS"],
        "MEDIUM":   ["ALL", "MED_PLUS"],
        "LOW":      ["ALL"]
    }
    
    return requirements.filter(
        applicability__in=applicability_map[risk_level]
    )
```

### Step 3: Create SRL Entries

For each applicable requirement:
1. Create an SRL entry linked to the ISRA
2. Initialize coverage status as `NOT_ASSESSED`
3. Link to the master requirement for reference data

---

## SRL Master Requirements Catalog

### Domains

| Domain | Description | Example Requirements |
|--------|-------------|---------------------|
| Access Control | Identity and access management | MFA, RBAC, Privileged access |
| Cryptography | Encryption and key management | TLS, Encryption at rest, Key rotation |
| Network Security | Network protection | Firewalls, Segmentation, DDoS protection |
| Application Security | Secure development | SAST/DAST, Secure coding, Input validation |
| Data Protection | Data security | DLP, Masking, Retention |
| Logging & Monitoring | Security visibility | Audit logs, SIEM, Alerting |
| Incident Response | Incident handling | IR plan, Forensics, Communication |
| Business Continuity | Resilience | Backup, DR, BCP testing |
| Third Party | Vendor management | Vendor assessment, Contract controls |
| Compliance | Regulatory requirements | DORA, NIS2, GDPR controls |

### Sample Requirements

| ID | Domain | Name | Applicability | ISO Control |
|----|--------|------|---------------|-------------|
| SRL-001 | Access Control | Multi-factor Authentication | MED_PLUS | 5.17 |
| SRL-002 | Access Control | Privileged Access Management | HIGH_PLUS | 5.18 |
| SRL-003 | Cryptography | Data Encryption in Transit | ALL | 8.24 |
| SRL-004 | Cryptography | Data Encryption at Rest | MED_PLUS | 8.24 |
| SRL-005 | Cryptography | HSM Key Management | CRIT_ONLY | 8.24 |
| SRL-006 | Network Security | Network Segmentation | MED_PLUS | 8.22 |
| SRL-007 | Application Security | SAST Integration | HIGH_PLUS | 8.28 |
| SRL-008 | Logging & Monitoring | Security Event Logging | ALL | 8.15 |
| SRL-009 | Logging & Monitoring | SIEM Integration | HIGH_PLUS | 8.16 |
| SRL-010 | Business Continuity | Backup Testing | MED_PLUS | 8.13 |

---

## Coverage Assessment

### Coverage Status Values

| Status | Description | Action Required |
|--------|-------------|-----------------|
| `COVERED` | Control fully implemented | None |
| `PARTIAL` | Control partially implemented | Enhancement needed |
| `GAP` | Control not implemented | Nonconformity generated |
| `NOT_APPLICABLE` | Control doesn't apply | Justification required |
| `NOT_ASSESSED` | Not yet evaluated | Assessment pending |

### Assessment Process

For each SRL entry:

1. **Review requirement** - Understand what's required
2. **Assess current state** - Check organizational capability
3. **Determine coverage** - Select appropriate status
4. **Document evidence** - Record evidence notes
5. **Link to capability** - Connect to capability assessment

### Evidence Requirements

Each requirement specifies evidence types:

| Evidence Type | Examples |
|---------------|----------|
| Policy | Security policy document |
| Procedure | Operational procedure |
| Configuration | System configuration screenshots |
| Report | Audit report, scan results |
| Record | Access logs, change records |
| Test | Penetration test report |

---

## Gap Analysis

### Identifying Gaps

A gap exists when:
- Coverage status is `GAP`
- Coverage status is `PARTIAL` (partial gap)

### Gap Severity Calculation

```python
# Get BIA risk level score
asset_criticality = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1
}[bia.risk_level]

# Get threat impact from related threats
if requirement.tva_threats:
    threat = max(requirement.tva_threats, key=lambda t: t.max_impact)
    threat_impact = max(threat.c, threat.i, threat.a)
else:
    # Default based on requirement CIA flags
    threat_impact = max(
        4 if requirement.affects_confidentiality else 0,
        4 if requirement.affects_integrity else 0,
        4 if requirement.affects_availability else 0
    )

# Calculate risk score
risk_score = asset_criticality × threat_impact

# Determine NC severity
nc_severity = (
    "CRITICAL" if risk_score >= 12 else
    "HIGH" if risk_score >= 8 else
    "MEDIUM" if risk_score >= 4 else
    "LOW"
)
```

### Risk Score Matrix

| Asset Criticality | Threat Impact | Risk Score | NC Severity |
|-------------------|---------------|------------|-------------|
| 4 (Critical) | 4 | 16 | CRITICAL |
| 4 (Critical) | 3 | 12 | CRITICAL |
| 3 (High) | 4 | 12 | CRITICAL |
| 4 (Critical) | 2 | 8 | HIGH |
| 3 (High) | 3 | 9 | HIGH |
| 2 (Medium) | 4 | 8 | HIGH |
| 3 (High) | 2 | 6 | MEDIUM |
| 2 (Medium) | 3 | 6 | MEDIUM |
| 2 (Medium) | 2 | 4 | MEDIUM |
| 1 (Low) | 4 | 4 | MEDIUM |
| 1 (Low) | 3 | 3 | LOW |
| 1 (Low) | 2 | 2 | LOW |
| 1 (Low) | 1 | 1 | LOW |

---

## Nonconformity Generation

### Automatic NC Creation

When processing gaps:

```python
for entry in srl_entries:
    if entry.coverage_status in ['GAP', 'PARTIAL']:
        nc = create_nonconformity(
            source='SRL_GAP',
            source_reference=entry.requirement_id,
            title=f"SRL Gap: {entry.requirement.name}",
            description=f"Security requirement not met: {entry.requirement.description}",
            severity=calculate_severity(entry),
            category='TECHNICAL',
            status='OPEN',
            application_id=isra.application_id,
            isra_id=isra.id,
            asset_criticality=bia.risk_level_score,
            threat_impact=entry.threat_impact,
            risk_score=entry.risk_score
        )
        entry.linked_nc_id = nc.id
```

### NC Fields

| Field | Source |
|-------|--------|
| Title | SRL requirement name |
| Description | Requirement description + gap details |
| Severity | Calculated from risk score |
| Category | TECHNICAL (default) |
| Source | SRL_GAP |
| Source Reference | SRL Requirement ID |
| Risk Score | Asset Criticality × Threat Impact |

---

## Coverage Metrics

### Summary Statistics

| Metric | Calculation |
|--------|-------------|
| Total Requirements | Count of SRL entries |
| Covered | Count where status = COVERED |
| Partial | Count where status = PARTIAL |
| Gaps | Count where status = GAP |
| Not Applicable | Count where status = NOT_APPLICABLE |
| Not Assessed | Count where status = NOT_ASSESSED |
| Coverage % | (Covered / (Total - Not Applicable)) × 100 |

### Coverage by Domain

Group coverage statistics by requirement domain for detailed analysis.

### Coverage Trend

Track coverage percentage across ISRA versions to show improvement over time.

---

## Integration Points

### Capability Assessment

- SRL requirements map to organizational capabilities via `capability_id`
- Capability maturity informs coverage assessment
- Shared evidence between capability and SRL assessments

### Risk Register

- NCs from SRL gaps feed into the risk register
- Risk treatment plans address SRL gaps
- Risk acceptance may apply to certain gaps

### Audit Findings

- SRL provides audit checklist
- Coverage status supports audit evidence
- NC tracking supports audit remediation

---

## DORA/NIS2 Requirements

### DORA-Specific Requirements

Requirements marked with `is_dora_required = true` are mandatory for:
- Critical or Important Business Functions
- ICT services supporting critical functions

### NIS2-Specific Requirements

Requirements marked with `is_nis2_required = true` are mandatory for:
- Essential Services
- Important Services

### Automatic Flagging

When BIA identifies:
- `is_critical_function = true` → DORA requirements apply
- `is_essential_service = true` → NIS2 requirements apply

These requirements are included regardless of general applicability level.
