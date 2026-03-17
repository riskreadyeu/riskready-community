# ISRA Module Verification Checklist

## Verification Against: ISRA_ISO27001_Capability_Aligned_v4 (3).xlsx

This document lists everything implemented in the app. Please verify each item exists in your Excel file.

---

## ✅ BIA Questions (45 Total)

### Section 1: Data Processing & Privacy (ISO 5.37) - 17 Questions

| ID | Question | ISO Control | Capability | Regulatory | Status |
|----|----------|-------------|------------|------------|--------|
| 1.0 | Does the application process personal data (GDPR Art. 4)? | 5.37 | 5.37-C01, 5.37-C02 | GDPR | ☐ |
| 2.0 | Does the application process special categories of personal data (Art. 9)? | 5.37 | 5.37-C01 | GDPR | ☐ |
| 3.0 | Does the application process data relating to criminal convictions (Art. 10)? | 5.37 | 5.37-C01 | GDPR | ☐ |
| 3.1 | [2025] Does the application process biometric data for AI authentication? | 5.37 | 5.37-C02 | GDPR, EU AI Act | ☐ |
| 4.0 | What is the purpose of processing? | 5.37 | 5.37-C01 | GDPR | ☐ |
| 5.0 | What is the legal basis for processing (Art. 6)? | 5.37 | 5.37-C01 | GDPR | ☐ |
| 6.0 | Is processing registered in Records of Processing Activities (ROPA)? | 5.37 | 5.37-C03 | GDPR | ☐ |
| 6.1 | [2025] Are there cross-border data transfers (Schrems II compliance)? | 5.37 | 5.37-C02 | GDPR | ☐ |
| 7.0 | Is a DPIA required - Large scale processing? | 5.37 | 5.37-C03 | GDPR | ☐ |
| 8.0 | Is a DPIA required - Systematic monitoring of public area? | 5.37 | 5.37-C03 | GDPR | ☐ |
| 9.0 | Is a DPIA required - Profiling with significant effects? | 5.37 | 5.37-C03 | GDPR | ☐ |
| 10.0 | Is a DPIA required - Automated decision-making? | 5.37 | 5.37-C03 | GDPR, EU AI Act | ☐ |
| 11.0 | Is a DPIA required - Processing of special category data at scale? | 5.37 | 5.37-C03 | GDPR | ☐ |
| 12.0 | Is a DPIA required - Systematic monitoring of employees? | 5.37 | 5.37-C03 | GDPR | ☐ |
| 13.0 | Is a DPIA required - Processing of vulnerable data subjects? | 5.37 | 5.37-C03 | GDPR | ☐ |
| 13.1 | [2025] Is a DPIA required - AI/ML processing (EU AI Act)? | 5.37 | 5.37-C03 | GDPR, EU AI Act | ☐ |
| 14.0 | Is a DPIA required - Innovative technology use? | 5.37 | 5.37-C03 | GDPR | ☐ |

**Section 1 Total: 17 questions ☐**

---

### Section 2: Confidentiality Impact (ISO 5.12, 5.14) - 7 Questions

| ID | Question | ISO Control | Capability | Weight | Status |
|----|----------|-------------|------------|--------|--------|
| 17.0 | Could breach facilitate fraud against organization/clients? | 5.12 | 5.12-C01 | 4 | ☐ |
| 18.0 | Could breach cause significant damage to organization reputation? | 5.12 | 5.12-C01 | 4 | ☐ |
| 19.0 | Could breach result in legal liability/lawsuits? | 5.12 | 5.12-C01 | 4 | ☐ |
| 20.0 | Could breach cause significant financial losses (>€50K)? | 5.12 | 5.12-C01 | 5 | ☐ |
| 21.0 | Could breach violate professional secrecy/NDAs? | 5.12 | 5.12-C01 | 3 | ☐ |
| 21.1 | [2025] Could breach result in regulatory fines (GDPR €20M, NIS2 €10M)? | 5.12 | 5.12-C01 | 5 | ☐ |
| **22.0** | **What is the estimated financial impact of a confidentiality breach?** (C1-C4) | 5.12 | 5.12-C01 | 10 | ☐ |

**C-Rating Options:**
- C1: Public (<€50K)
- C2: Internal (€50K-€500K)
- C3: Confidential (€500K-€5M)
- C4: Highly Confidential (>€5M)

**Section 2 Total: 7 questions ☐**

---

### Section 3: Integrity Impact (ISO 8.25, 8.28) - 7 Questions

| ID | Question | ISO Control | Capability | Weight | Status |
|----|----------|-------------|------------|--------|--------|
| 23.0 | Could data corruption lead to incorrect management decisions? | 8.25 | 8.25-C01 | 4 | ☐ |
| 24.0 | Could data corruption facilitate fraud? | 8.25 | 8.25-C01 | 4 | ☐ |
| 25.0 | Could data corruption cause legal liability? | 8.25 | 8.25-C01 | 4 | ☐ |
| 26.0 | Could data corruption cause significant operational costs? | 8.25 | 8.25-C01 | 3 | ☐ |
| 27.0 | Could data corruption impact regulatory reporting accuracy? | 8.25 | 8.25-C01 | 4 | ☐ |
| 27.1 | [2025] Could AI/ML model integrity issues cause harm (EU AI Act)? | 8.25 | 8.25-C02 | 4 | ☐ |
| **28.0** | **What is the estimated integrity impact rating?** (I1-I4) | 8.25 | 8.25-C01 | 10 | ☐ |

**I-Rating Options:**
- I1: Low - Minor operational inconvenience
- I2: Medium - Moderate business impact
- I3: High - Significant business/financial impact
- I4: Critical - Severe impact, regulatory consequences

**Section 3 Total: 7 questions ☐**

---

### Section 4: Availability Impact (ISO 5.29, 5.30) - 6 Questions

| ID | Question | ISO Control | Capability | Regulatory | Status |
|----|----------|-------------|------------|------------|--------|
| **29.0** | **What is the Maximum Outage Time (MOT)?** (A1-A4) | 5.30 | 5.30-C01 | DORA, NIS2 | ☐ |
| **30.0** | **What is the Recovery Point Objective (RPO)?** (RPO1-RPO4) | 5.30 | 5.30-C02 | DORA | ☐ |
| 30.1 | [DORA] Is this a Critical or Important Function? | 5.30 | 5.30-C03 | DORA | ☐ |
| 30.2 | [NIS2] Is this an Essential or Important service? | 5.30 | 5.30-C03 | NIS2 | ☐ |
| 31.0 | Are there time-critical business processes dependent on this application? | 5.29 | 5.29-C01 | DORA | ☐ |
| 32.0 | Are there regulatory reporting deadlines dependent on availability? | 5.29 | 5.29-C02 | DORA, NIS2 | ☐ |

**A-Rating Options (MOT):**
- A1: Low (>72 hours)
- A2: Medium (24-72 hours)
- A3: High (4-24 hours)
- A4: Critical (<4 hours)

**RPO Options:**
- RPO1: >24 hours
- RPO2: 4-24 hours
- RPO3: 1-4 hours
- RPO4: <1 hour

**Section 4 Total: 6 questions ☐**

---

### Section 5: AI/ML Assessment (EU AI Act) - 8 Questions

| ID | Question | Regulatory | Status |
|----|----------|------------|--------|
| AI-1 | Does the application use AI/ML components? | EU AI Act | ☐ |
| AI-2 | Is this an Unacceptable Risk AI (Art. 5 prohibited)? | EU AI Act | ☐ |
| AI-3 | Is this a High-Risk AI system (Annex III)? | EU AI Act | ☐ |
| AI-4 | Does the AI make decisions affecting natural persons? | EU AI Act, GDPR | ☐ |
| AI-5 | Is human oversight implemented (Art. 14)? | EU AI Act | ☐ |
| AI-6 | Is AI decision logging implemented (Art. 12)? | EU AI Act | ☐ |
| AI-7 | Is the AI system registered in EU database (Art. 49)? | EU AI Act | ☐ |
| **AI-8** | **What is the EU AI Act Risk Classification?** | EU AI Act | ☐ |

**AI Risk Classification Options:**
- MINIMAL: No specific obligations
- LIMITED: Transparency obligations
- HIGH: Strict compliance requirements
- UNACCEPTABLE: Prohibited

**Section 5 Total: 8 questions ☐**

---

## ✅ SRL Master Requirements (22 Total)

### Access Management Domain (4 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| AM-01 | User access rights must be reviewed periodically | ALL | 5.18 | 5.18-C01 | ✓ | ✓ | ☐ |
| AM-02 | Multi-factor authentication must be implemented for privileged access | MED_PLUS | 8.5 | 8.5-C01 | ✓ | ✓ | ☐ |
| AM-03 | Privileged access rights must be managed separately from standard user rights | HIGH_PLUS | 8.2 | 8.2-C01 | ✓ | ✓ | ☐ |
| AM-04 | Just-in-time access must be implemented for critical system access | CRIT_ONLY | 8.2 | 8.2-C02 | ✓ | ✗ | ☐ |

### Asset Management Domain (2 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| AS-01 | Application must be registered in the asset inventory | ALL | 5.9 | 5.9-C01 | ✓ | ✓ | ☐ |
| AS-02 | Application ownership and accountability must be assigned | ALL | 5.9 | 5.9-C02 | ✓ | ✓ | ☐ |

### Data Protection Domain (4 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| DP-01 | Data classification must be applied to all data processed | ALL | 5.12 | 5.12-C01 | ✓ | ✓ | ☐ |
| DP-02 | Encryption at rest must be implemented for confidential data | MED_PLUS | 8.24 | 8.24-C01 | ✓ | ✓ | ☐ |
| DP-03 | Encryption in transit must be implemented (TLS 1.2+) | ALL | 8.24 | 8.24-C02 | ✓ | ✓ | ☐ |
| DP-04 | Data masking or tokenization must be applied to sensitive data in non-production | HIGH_PLUS | 8.11 | 8.11-C01 | ✗ | ✗ | ☐ |

### Vulnerability Management Domain (3 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| VM-01 | Vulnerability scanning must be performed regularly | ALL | 8.8 | 8.8-C01 | ✓ | ✓ | ☐ |
| VM-02 | Critical vulnerabilities must be remediated within defined SLAs | MED_PLUS | 8.8 | 8.8-C02 | ✓ | ✓ | ☐ |
| VM-03 | Penetration testing must be performed annually | HIGH_PLUS | 8.8 | 8.8-C03 | ✓ | ✓ | ☐ |

### Logging & Monitoring Domain (3 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| LM-01 | Security events must be logged | ALL | 8.15 | 8.15-C01 | ✓ | ✓ | ☐ |
| LM-02 | Logs must be protected from tampering and unauthorized access | MED_PLUS | 8.15 | 8.15-C02 | ✓ | ✓ | ☐ |
| LM-03 | Security events must be monitored in real-time | HIGH_PLUS | 8.16 | 8.16-C01 | ✓ | ✓ | ☐ |

### Change Management Domain (2 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| CM-01 | All changes must follow a documented change management process | ALL | 8.32 | 8.32-C01 | ✓ | ✓ | ☐ |
| CM-02 | Changes must be tested before production deployment | MED_PLUS | 8.32 | 8.32-C02 | ✓ | ✓ | ☐ |

### Business Continuity Domain (3 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| BC-01 | Application must have documented recovery procedures | MED_PLUS | 5.30 | 5.30-C01 | ✓ | ✓ | ☐ |
| BC-02 | Regular backups must be performed and tested | ALL | 8.13 | 8.13-C01 | ✓ | ✓ | ☐ |
| BC-03 | Recovery time objectives (RTO) must be documented and tested | HIGH_PLUS | 5.30 | 5.30-C02 | ✓ | ✓ | ☐ |

### Third Party Management Domain (2 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| TP-01 | Third-party dependencies must be identified and documented | ALL | 5.19 | 5.19-C01 | ✓ | ✓ | ☐ |
| TP-02 | Critical vendors must be assessed for security compliance | MED_PLUS | 5.21 | 5.21-C01 | ✓ | ✓ | ☐ |

### Incident Management Domain (2 requirements)

| ID | Requirement | Applicability | ISO Control | Capability | DORA | NIS2 | Status |
|----|-------------|---------------|-------------|------------|------|------|--------|
| IM-01 | Security incident response procedures must be documented | ALL | 5.24 | 5.24-C01 | ✓ | ✓ | ☐ |
| IM-02 | Security incidents must be reported within defined timeframes | MED_PLUS | 5.24 | 5.24-C02 | ✓ | ✓ | ☐ |

**SRL Total: 22 requirements ☐**

---

## ✅ Threat Catalog (20 Threats)

| ID | Name | Category | C | I | A | Likelihood | Status |
|----|------|----------|---|---|---|------------|--------|
| T-MALWARE | Malware Infection | MALWARE | 4 | 4 | 4 | 4 | ☐ |
| T-RANSOM | Ransomware Attack | MALWARE | 3 | 5 | 5 | 4 | ☐ |
| T-PHISH | Phishing Attack | SOCIAL_ENGINEERING | 4 | 3 | 2 | 5 | ☐ |
| T-SOCIAL | Social Engineering | SOCIAL_ENGINEERING | 4 | 3 | 2 | 4 | ☐ |
| T-UNAUTH | Unauthorized Access | UNAUTHORIZED_ACCESS | 5 | 4 | 3 | 4 | ☐ |
| T-CRED | Credential Theft | UNAUTHORIZED_ACCESS | 5 | 4 | 2 | 4 | ☐ |
| T-PRIV | Privilege Escalation | UNAUTHORIZED_ACCESS | 5 | 5 | 4 | 3 | ☐ |
| T-DATAEXP | Data Exposure | DATA_BREACH | 5 | 2 | 1 | 4 | ☐ |
| T-DATALEAK | Data Leakage | DATA_BREACH | 5 | 2 | 1 | 3 | ☐ |
| T-INSIDER | Malicious Insider | INSIDER_THREAT | 5 | 5 | 4 | 2 | ☐ |
| T-SHADOW | Shadow IT | INSIDER_THREAT | 4 | 3 | 2 | 4 | ☐ |
| T-DOS | Denial of Service | DENIAL_OF_SERVICE | 1 | 2 | 5 | 3 | ☐ |
| T-DDOS | Distributed Denial of Service | DENIAL_OF_SERVICE | 1 | 2 | 5 | 3 | ☐ |
| T-SUPPLY | Supply Chain Attack | SUPPLY_CHAIN | 4 | 5 | 3 | 3 | ☐ |
| T-VENDOR | Vendor Risk | SUPPLY_CHAIN | 4 | 3 | 3 | 3 | ☐ |
| T-MISCONFIG | Security Misconfiguration | CONFIGURATION | 4 | 3 | 3 | 4 | ☐ |
| T-PATCH | Unpatched Vulnerabilities | CONFIGURATION | 4 | 4 | 4 | 4 | ☐ |
| T-COMPLY | Regulatory Non-Compliance | COMPLIANCE | 3 | 3 | 2 | 3 | ☐ |
| T-PHYSICAL | Physical Security Breach | PHYSICAL | 4 | 4 | 4 | 2 | ☐ |
| T-DISASTER | Natural Disaster | NATURAL_DISASTER | 1 | 3 | 5 | 2 | ☐ |

**Threat Catalog Total: 20 threats ☐**

---

## ✅ Application Register Fields (43 Fields)

### Identifiers (6 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| appId | String | APP-XXXX format, unique | ☐ |
| name | String | Canonical name, max 100 chars | ☐ |
| description | Text | Full description | ☐ |
| category | Enum | APPLICATION, APPLICATION_PLATFORM | ☐ |
| subCategory | Enum | BUSINESS_APPLICATION, etc. | ☐ |
| lifecycleStatus | Enum | DISCOVERY → DECOMMISSIONED | ☐ |

### Ownership (5 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| applicationManagerId | FK | Link to User | ☐ |
| vendorApplicationManager | String | If externally owned | ☐ |
| departmentId | FK | Link to Department | ☐ |
| assignmentGroup | String | ITSM group | ☐ |
| costCenter | String | Cost center code | ☐ |

### Vendor/Hosting (7 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| externallyOwned | Boolean | External ownership flag | ☐ |
| vendorSoftwareSupplier | String | Software vendor | ☐ |
| technologySupplier | String | Tech/cloud supplier | ☐ |
| serviceOperationsSupplier | String | Service operations vendor | ☐ |
| hosting | Enum | ON_PREMISE, CLOUD_IAAS, CLOUD_PAAS, CLOUD_SAAS, HYBRID | ☐ |
| licenseType | Enum | ENTERPRISE, PER_USER, etc. | ☐ |
| internallyDeveloped | Boolean | In-house development flag | ☐ |

### Technical (2 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| fqdn | String | Fully qualified domain name | ☐ |
| authenticationMode | String | LDAP, SAML, OAuth, MFA | ☐ |

### Classification/BIA Inputs (4 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| criticality | Enum | CRITICAL, HIGH, MEDIUM, LOW | ☐ |
| cRating | Int | 1-4 Confidentiality rating | ☐ |
| iRating | Int | 1-4 Integrity rating | ☐ |
| aRating | Int | 1-4 Availability rating | ☐ |

### Critical Function - DORA (1 field)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| supportsCriticalFunction | Boolean | DORA critical function flag | ☐ |

### Data & Privacy (4 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| dataClassification | Enum | PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED | ☐ |
| personalData | Boolean | PII processing flag | ☐ |
| dataCategories | String | Financial, Customer PII, etc. | ☐ |
| countryPiiStorage | String | Country codes for PII storage | ☐ |

### Resilience/BIA Outputs (4 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| rto | String | Recovery Time Objective | ☐ |
| rpo | String | Recovery Point Objective | ☐ |
| bcpReference | String | BCP document reference | ☐ |
| drpReference | String | DRP document reference | ☐ |

### Security Assessment (4 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| tscmFrequency | Enum | DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL | ☐ |
| lastSecurityAssessment | DateTime | Last assessment date | ☐ |
| nextReviewDate | DateTime | Next review date | ☐ |
| pentestDate | DateTime | Last penetration test | ☐ |

### Documentation (3 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| osgDocumentRef | String | OSG document reference | ☐ |
| riskRegisterRef | String | Risk register reference | ☐ |
| authorizationMatrixRef | String | Authorization matrix reference | ☐ |

### Relationships (2 fields)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| infrastructureCIs | JSON | Array of CI IDs | ☐ |
| thirdPartyDependencies | JSON | Array of Vendor IDs | ☐ |

### Notes (1 field)
| Field | Type | Description | Status |
|-------|------|-------------|--------|
| notes | Text | Free text notes | ☐ |

**Application Fields Total: 43 fields ☐**

---

## Summary

| Component | Count in App | Verified in Excel |
|-----------|--------------|-------------------|
| BIA Questions | 45 | ☐ |
| SRL Requirements | 22 | ☐ |
| Threat Catalog | 20 | ☐ |
| Application Fields | 43 | ☐ |

### Missing Items (to be filled after verification)

List any items from the Excel that are NOT found in the app:

1. _________________________________
2. _________________________________
3. _________________________________

---

*Generated: 2025-12-18*
*Source Excel: ISRA_ISO27001_Capability_Aligned_v4 (3).xlsx*
