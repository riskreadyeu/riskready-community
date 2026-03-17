# Policy Module - Document Templates & Markdown Format

**Version**: 2.0  
**Last Updated**: December 2024

---

## 1. Structured Document Format

The Policy Module supports a structured markdown format with YAML frontmatter and section markers for parsing and rendering documents consistently.

### 1.1 Format Overview

```markdown
---
# YAML Frontmatter - Document Metadata
documentId: POL-002
title: Information Risk Management Policy
documentType: POLICY
classification: INTERNAL
status: PUBLISHED
version: "1.0"
# ... more metadata
---

# Document Title

<!-- section: MANAGEMENT_COMMITMENT -->
## Management Commitment Statement

> Management commitment content...

<!-- section: PURPOSE number: 1 -->
## 1. Purpose

Purpose content...

<!-- section: DEFINITIONS number: 3 -->
## 3. Definitions

<!-- definitions-table -->
| Term | Definition |
|------|------------|
| **Risk** | ... |
```

---

## 2. YAML Frontmatter

### 2.1 Required Fields

```yaml
---
documentId: POL-002                    # Unique document identifier
title: Information Risk Management Policy  # Full document title
documentType: POLICY                   # POLICY | STANDARD | PROCEDURE
classification: INTERNAL               # PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED
status: PUBLISHED                      # DRAFT | PUBLISHED | etc.
version: "1.0"                         # Semantic version string
---
```

### 2.2 Complete Frontmatter Example

```yaml
---
# ===========================================
# DOCUMENT METADATA
# ===========================================
documentId: POL-002
title: Information Risk Management Policy
shortTitle: Risk Management Policy
documentType: POLICY

# Classification & Status
classification: INTERNAL
status: PUBLISHED

# Version Control
version: "1.0"
majorVersion: 1
minorVersion: 0

# Ownership
documentOwner: Chief Information Security Officer (CISO)
author: "[ORGANIZATION] Information Security Team"
approvedBy: Chief Executive Officer / Information Security Steering Committee
approvalDate: 2025-01-15

# Dates
effectiveDate: 2025-01-15
reviewFrequency: ANNUAL
nextReviewDate: 2026-01-15

# Distribution
distribution:
  - All employees
  - Contractors
  - Risk owners
  - Senior management

# Hierarchy
parentDocumentId: POL-001
childDocuments:
  - STD-002-01
  - STD-002-02
  - STD-002-03

# Tags & Keywords
tags:
  - risk-management
  - iso-27001
  - information-security
keywords:
  - risk assessment
  - risk treatment
  - risk appetite
---
```

---

## 3. Section Markers

### 3.1 Section Types

| Section Type | Usage | For Document Types |
|--------------|-------|-------------------|
| `MANAGEMENT_COMMITMENT` | Executive commitment statement | Policies only |
| `PURPOSE` | Document purpose/objectives | All |
| `SCOPE` | Applicability and boundaries | All |
| `DEFINITIONS` | Glossary of terms | All |
| `POLICY_FRAMEWORK` | Framework description | Policies |
| `POLICY_STATEMENTS` | Core policy statements | Policies |
| `REQUIREMENTS` | Mandatory requirements | Standards |
| `PROCEDURE_STEPS` | Step-by-step instructions | Procedures |
| `PREREQUISITES` | Prerequisites checklist | Procedures |
| `ROLES_RESPONSIBILITIES` | Roles and RACI matrix | All |
| `SCHEDULE_REQUIREMENTS` | Schedules and timelines | All |
| `COMPLIANCE` | Compliance measurement | All |
| `RELATED_DOCUMENTS` | Document references | All |
| `ISO_CONTROLS` | ISO 27001 control mappings | All |
| `TRAINING_AWARENESS` | Training requirements | All |
| `REVIEW_MAINTENANCE` | Review triggers | All |
| `REVISION_HISTORY` | Version history table | All |

### 3.2 Section Marker Syntax

```markdown
<!-- section: SECTION_TYPE number: N -->
## N. Section Title

Section content...
```

**Examples:**

```markdown
<!-- section: PURPOSE number: 1 -->
## 1. Purpose

<!-- section: SCOPE number: 2 -->
## 2. Scope

<!-- section: DEFINITIONS number: 3 -->
## 3. Definitions
```

---

## 4. Table Markers

### 4.1 Definitions Table

```markdown
<!-- definitions-table -->
| Term | Definition |
|------|------------|
| **Risk** | The effect of uncertainty on objectives |
| **Risk Appetite** | Amount of risk willing to accept |
| **Threat** | Potential cause of unwanted incident |
```

### 4.2 Roles Table

```markdown
<!-- roles-table -->
| Role | Key Responsibilities |
|------|---------------------|
| **CEO** | Ultimate accountability; approval of risk appetite |
| **CISO** | Ownership of risk management framework |
| **Risk Owners** | Implementation of treatment plans |
```

### 4.3 RACI Matrix

```markdown
<!-- raci-matrix -->
| Activity | CEO | CISO | InfoSec Mgr | Risk Owners |
|----------|-----|------|-------------|-------------|
| Define risk appetite | A | C | C | I |
| Conduct assessments | I | A | R | C |
| Implement controls | I | A | C | R |

**Legend:** A = Accountable, R = Responsible, C = Consulted, I = Informed
```

### 4.4 ISO Controls Tables

```markdown
<!-- iso-controls: primary -->
| Control | Title | Description and Relevance |
|---------|-------|---------------------------|
| 5.7 | Threat intelligence | Requires gathering threat intel... |

<!-- iso-controls: supporting -->
| Control | Title | Relevance |
|---------|-------|-----------|
| 6.1.2 | Risk assessment | Core requirement... |
```

### 4.5 Related Documents

```markdown
<!-- related-docs: parent -->
| Policy ID | Policy Name |
|-----------|-------------|
| POL-001 | Information Security Policy |

<!-- related-docs: supporting-policies -->
| Policy ID | Policy Name |
|-----------|-------------|
| POL-003 | Asset Management Policy |

<!-- related-docs: supporting-standards-procedures -->
| Document ID | Document Name |
|-------------|---------------|
| STD-002-01 | Risk Assessment Methodology |
| PRO-002-01 | Risk Assessment Procedure |

<!-- related-docs: templates-forms -->
- Risk Assessment Template
- Risk Acceptance Request Form

<!-- related-docs: external -->
- ISO/IEC 27001:2022 - Information security management systems
- ISO/IEC 27005:2022 - Risk management
```

### 4.6 Revision History

```markdown
<!-- revision-history-table -->
| Version | Date | Author | Approved By | Description |
|---------|------|--------|-------------|-------------|
| 1.0 | 2025-01-15 | InfoSec Team | CEO | Initial version |
```

---

## 5. Policy Template

```markdown
---
documentId: POL-XXX
title: [Policy Title]
shortTitle: [Short Title]
documentType: POLICY
classification: INTERNAL
status: DRAFT
version: "1.0"
documentOwner: [Owner Title]
author: [Author]
reviewFrequency: ANNUAL
distribution:
  - All employees
tags:
  - [tag1]
  - [tag2]
---

# [Policy Title]

<!-- section: MANAGEMENT_COMMITMENT -->
## Management Commitment Statement

> [Organization] is committed to...
>
> We commit to:
> - [Commitment 1]
> - [Commitment 2]

| | |
|---|---|
| **Signature** | _________________________ |
| **Name** | [Executive Name] |
| **Title** | [Executive Title] |
| **Date** | _________________________ |

---

<!-- section: PURPOSE number: 1 -->
## 1. Purpose

[Purpose statement...]

---

<!-- section: SCOPE number: 2 -->
## 2. Scope

### 2.1 Applicability

This policy applies to:

**Categories:**
- [Category 1]
- [Category 2]

### 2.2 Boundaries

[Boundary description...]

---

<!-- section: DEFINITIONS number: 3 -->
## 3. Definitions

<!-- definitions-table -->
| Term | Definition |
|------|------------|
| **Term 1** | Definition... |
| **Term 2** | Definition... |

---

<!-- section: POLICY_FRAMEWORK number: 4 -->
## 4. Policy Framework

### 4.1 Framework Alignment

[Framework description...]

### 4.2 Key Principles

[Principles...]

---

<!-- section: POLICY_STATEMENTS number: 5 -->
## 5. Policy Statements

### 5.1 [Statement Area 1]

[Statement content...]

### 5.2 [Statement Area 2]

[Statement content...]

---

<!-- section: ROLES_RESPONSIBILITIES number: 6 -->
## 6. Roles and Responsibilities

### 6.1 Key Roles

<!-- roles-table -->
| Role | Key Responsibilities |
|------|---------------------|
| **[Role 1]** | [Responsibilities] |
| **[Role 2]** | [Responsibilities] |

### 6.2 RACI Matrix

<!-- raci-matrix -->
| Activity | [Role1] | [Role2] | [Role3] |
|----------|---------|---------|---------|
| [Activity 1] | A | R | C |
| [Activity 2] | I | A | R |

---

<!-- section: COMPLIANCE number: 7 -->
## 7. Compliance

### 7.1 Compliance Measurement

[Measurement methods...]

### 7.2 Exceptions

[Exception process...]

### 7.3 Non-Compliance

[Non-compliance consequences...]

---

<!-- section: RELATED_DOCUMENTS number: 8 -->
## 8. Related Documents

### 8.1 Parent Policy

<!-- related-docs: parent -->
| Policy ID | Policy Name |
|-----------|-------------|
| POL-001 | Information Security Policy |

### 8.2 Supporting Documents

<!-- related-docs: supporting-standards-procedures -->
| Document ID | Document Name |
|-------------|---------------|
| STD-XXX-XX | [Standard Name] |
| PRO-XXX-XX | [Procedure Name] |

---

<!-- section: ISO_CONTROLS number: 9 -->
## 9. ISO 27001:2022 Controls Addressed

### 9.1 Primary Controls

<!-- iso-controls: primary -->
| Control | Title | Relevance |
|---------|-------|-----------|
| X.X | [Control Title] | [How addressed] |

### 9.2 Supporting Controls

<!-- iso-controls: supporting -->
| Control | Title | Relevance |
|---------|-------|-----------|
| X.X | [Control Title] | [Relevance] |

---

<!-- section: TRAINING_AWARENESS number: 10 -->
## 10. Training and Awareness

<!-- training-table -->
| Audience | Training Content | Frequency |
|----------|------------------|-----------|
| [Audience 1] | [Content] | [Frequency] |

---

<!-- section: REVIEW_MAINTENANCE number: 11 -->
## 11. Review and Maintenance

This policy shall be reviewed:

- **Mandatory Review:** At least annually
- **Triggered Review:** Following:
  - Significant security incident
  - Regulatory changes
  - Audit findings

---

<!-- section: REVISION_HISTORY number: 12 -->
## 12. Revision History

<!-- revision-history-table -->
| Version | Date | Author | Approved By | Description |
|---------|------|--------|-------------|-------------|
| 1.0 | [Date] | [Author] | [Approver] | Initial version |

---

**Document End**
```

---

## 6. Standard Template

```markdown
---
documentId: STD-XXX-YY
title: [Standard Title]
documentType: STANDARD
classification: INTERNAL
status: DRAFT
version: "1.0"
documentOwner: [Owner]
author: [Author]
parentDocumentId: POL-XXX
reviewFrequency: ANNUAL
---

# [Standard Title]

<!-- section: DOCUMENT_CONTROL -->
## Document Control

<!-- document-control-table -->
| Attribute | Value |
|-----------|-------|
| **Document Type** | Standard |
| **Parent Policy** | POL-XXX [Policy Name] |
| **Distribution** | [Distribution list] |
| **Confidentiality** | Internal |
| **Approval Authority** | [Authority] |

---

<!-- section: PURPOSE number: 1 -->
## 1. Purpose

[Purpose...]

---

<!-- section: SCOPE number: 2 -->
## 2. Scope

[Scope...]

---

<!-- section: DEFINITIONS number: 3 -->
## 3. Definitions

<!-- definitions-table -->
| Term | Definition |
|------|------------|
| **Term** | Definition |

---

<!-- section: REQUIREMENTS number: 4 -->
## 4. Requirements

### 4.1 [Requirement Area]

[Requirements...]

---

<!-- section: RELATED_DOCUMENTS number: 5 -->
## 5. Related Documents

[Related documents...]

---

<!-- section: REVISION_HISTORY number: 6 -->
## 6. Revision History

<!-- revision-history-table -->
| Version | Date | Author | Approved By | Description |
|---------|------|--------|-------------|-------------|
| 1.0 | [Date] | [Author] | [Approver] | Initial version |

---

**Document End**
```

---

## 7. Procedure Template

```markdown
---
documentId: PRO-XXX-YY-Name
title: [Procedure Title]
documentType: PROCEDURE
classification: INTERNAL
status: DRAFT
version: "1.0"
documentOwner: [Owner]
parentDocumentId: STD-XXX-YY
reviewFrequency: SEMI_ANNUAL
---

# [Procedure Title]

<!-- section: DOCUMENT_CONTROL -->
## Document Control

[Control table...]

---

<!-- section: PURPOSE number: 1 -->
## 1. Purpose

[Purpose...]

---

<!-- section: SCOPE number: 2 -->
## 2. Scope

[Scope...]

---

<!-- section: PREREQUISITES number: 3 -->
## 3. Prerequisites

### 3.1 Mandatory Requirements

<!-- prerequisites: mandatory -->
- [ ] [Prerequisite 1]
- [ ] [Prerequisite 2]

### 3.2 Supporting Information

<!-- prerequisites: supporting -->
- [ ] [Supporting item 1]
- [ ] [Supporting item 2]

---

<!-- section: PROCEDURE_STEPS number: 4 -->
## 4. Procedure Steps

<!-- step: 1 -->
### Step 1: [Step Title]

**Objective:** [What this step achieves]

**Activities:**
1. [Activity 1]
2. [Activity 2]

**Deliverables:**
- [Deliverable 1]

**Responsibility:** [Role]

---

<!-- step: 2 -->
### Step 2: [Step Title]

[Step content...]

---

<!-- section: REVISION_HISTORY number: 5 -->
## 5. Revision History

[Revision history table...]

---

**Document End**
```

---

## 8. Markdown Rendering

The Policy Module uses React Markdown with custom styling for professional document rendering:

### 8.1 Supported Markdown Features

| Feature | Syntax | Rendered As |
|---------|--------|-------------|
| Headers | `# ## ### ####` | Styled headings |
| Bold | `**text**` | **Bold text** |
| Italic | `*text*` | *Italic text* |
| Lists | `- item` | Bulleted lists |
| Numbered lists | `1. item` | Numbered lists |
| Tables | `\| col \|` | Styled tables |
| Blockquotes | `> quote` | Highlighted quotes |
| Code | `` `code` `` | Inline code |
| Links | `[text](url)` | Hyperlinks |
| Horizontal rule | `---` | Section divider |

### 8.2 Custom Styling

The module applies custom styling to ensure consistent, professional document appearance:
- Consistent font sizes
- Proper spacing between sections
- Colored bullet points
- Bordered tables with hover effects
- Highlighted blockquotes

---

*Next: [06-iso27001-mapping.md](./06-iso27001-mapping.md) - ISO 27001 compliance mapping*








