# Organisation Module Overview

## Introduction

The Organisation Module is the cornerstone of the RiskReady ISMS (Information Security Management System) platform. It provides a comprehensive framework for capturing, managing, and maintaining all organisational context required for ISO 27001:2022 certification and ongoing compliance.

## Purpose

The module serves three primary purposes:

1. **Establish Organisational Context** - Document the internal and external factors that affect your organisation's ability to achieve the intended outcomes of its ISMS
2. **Define ISMS Scope** - Clearly delineate the boundaries and applicability of your information security management system
3. **Enable Governance** - Provide structures for leadership commitment, roles, responsibilities, and decision-making

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORGANISATION MODULE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ORGANISATIONAL CONTEXT                            │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │Organisation  │  │  Context     │  │   Interested Parties     │   │    │
│  │  │  Profile     │  │   Issues     │  │   (Stakeholders)         │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ORGANISATIONAL STRUCTURE                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │ Departments  │  │Organisational│  │      Locations           │   │    │
│  │  │              │  │    Units     │  │                          │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    LEADERSHIP & GOVERNANCE                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │  Executive   │  │   Security   │  │     Key Personnel        │   │    │
│  │  │  Positions   │  │  Committees  │  │     (ISMS Roles)         │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │  Committee   │  │   Meeting    │  │     Meeting Action       │   │    │
│  │  │  Meetings    │  │  Decisions   │  │        Items             │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    OPERATIONAL CONTEXT                               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │  Business    │  │  External    │  │      Regulators          │   │    │
│  │  │  Processes   │  │Dependencies  │  │                          │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ISMS SCOPE ELEMENTS                               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │    │
│  │  │  Products &  │  │  Technology  │  │    Applicable            │   │    │
│  │  │  Services    │  │  Platforms   │  │    Frameworks            │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SECURITY NETWORK                                  │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │              Security Champions (per Department)              │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Entity Summary

The Organisation Module contains **20 core entities** organised into functional groups:

### Organisational Context (Clause 4)
| Entity | Purpose | ISO 27001 Clause |
|--------|---------|------------------|
| **OrganisationProfile** | Core organisation details, ISMS scope, certification status | 4.1, 4.3 |
| **ContextIssue** | Internal and external issues affecting the ISMS | 4.1 |
| **InterestedParty** | Stakeholders and their security requirements | 4.2 |

### Organisational Structure
| Entity | Purpose | ISO 27001 Clause |
|--------|---------|------------------|
| **Department** | Organisational departments with hierarchy | 5.3, 7.1 |
| **DepartmentMember** | Department membership assignments | 5.3 |
| **OrganisationalUnit** | Alternative organisational units (divisions, teams) | 5.3 |
| **Location** | Physical and virtual locations in ISMS scope | 4.3 |

### Leadership & Governance (Clause 5)
| Entity | Purpose | ISO 27001 Clause |
|--------|---------|------------------|
| **ExecutivePosition** | Executive roles with security responsibilities | 5.1, 5.3 |
| **KeyPersonnel** | ISMS-specific roles (CISO, DPO, etc.) | 5.3 |
| **SecurityChampion** | Departmental security representatives | 5.3, 7.3 |
| **SecurityCommittee** | Governance committees | 5.1, 9.3 |
| **CommitteeMembership** | Committee member assignments | 5.1 |
| **CommitteeMeeting** | Meeting records with agenda and minutes | 9.3 |
| **MeetingAttendance** | Attendance tracking with quorum | 9.3 |
| **MeetingDecision** | Formal decisions with voting records | 9.3, 10.1 |
| **MeetingActionItem** | Action items with assignment and tracking | 10.1 |

### Operational Context (Clause 8)
| Entity | Purpose | ISO 27001 Clause |
|--------|---------|------------------|
| **BusinessProcess** | Business processes with BCP/DR details | 8.1 |
| **ExternalDependency** | Third-party suppliers and vendors | 8.1 |
| **Regulator** | Regulatory bodies and compliance requirements | 4.2, 8.1 |

### ISMS Scope Elements
| Entity | Purpose | ISO 27001 Clause |
|--------|---------|------------------|
| **ProductService** | Products and services in ISMS scope | 4.3 |
| **TechnologyPlatform** | Technology systems in ISMS scope | 4.3 |
| **ApplicableFramework** | Applicable standards and regulations | 4.2, 8.1 |
| **RegulatoryEligibilitySurvey** | Regulatory applicability assessments | 4.2 |

## Key Features

### 1. Comprehensive ISMS Scope Definition
- Define scope boundaries with justifications
- Track inclusions and exclusions
- Link scope to specific locations, departments, processes, and systems

### 2. Full Governance Lifecycle
- Create and manage security committees
- Schedule and conduct meetings
- Record decisions with voting
- Track action items to completion

### 3. Stakeholder Management
- Power/Interest matrix analysis
- Engagement strategy tracking
- Communication frequency management

### 4. Context Monitoring
- Internal and external issue tracking
- Trend analysis (improving/stable/worsening)
- Review scheduling and monitoring

### 5. Third-Party Risk Management
- Supplier and vendor tracking
- SLA and contract management
- Compliance certification tracking
- Exit strategy documentation

### 6. Regulatory Compliance
- Multiple framework tracking (ISO 27001, SOC 2, GDPR, etc.)
- Compliance percentage monitoring
- Certification status and expiry tracking

## Integration Points

The Organisation Module integrates with other RiskReady modules:

| Module | Integration |
|--------|-------------|
| **Risk Management** | Context issues escalate to risks; risk appetite from org profile |
| **Asset Management** | Departments own assets; locations contain assets |
| **Policy Management** | ISMS policy from org profile; committee decisions create policies |
| **Audit Management** | Audit dates from org profile; findings create action items |
| **Incident Management** | Departments and personnel linked to incidents |
| **Training & Awareness** | Personnel training records; security champion training |

## Data Model Principles

### Audit Trail
Every entity includes:
- `createdAt` - Creation timestamp
- `updatedAt` - Last modification timestamp
- `createdById` - User who created the record
- `updatedById` - User who last modified the record

### Soft Delete Pattern
Entities use `isActive` boolean for soft deletion, preserving historical data.

### Hierarchical Relationships
Several entities support hierarchies:
- Departments → Parent/Child departments
- Organisational Units → Parent/Child units
- Executive Positions → Reports-to relationships
- Business Processes → Parent/Sub-processes

### ISMS Scope Tracking
Scope-relevant entities include:
- `inIsmsScope` - Boolean indicating inclusion
- `scopeJustification` - Reason for inclusion/exclusion

## Next Steps

- [Getting Started](./02-getting-started.md) - Set up your organisation
- [Entities Reference](./03-entities-reference.md) - Detailed entity documentation
- [ISO 27001 Mapping](./05-iso27001-mapping.md) - Clause-by-clause mapping
