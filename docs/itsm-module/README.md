# ITSM Module - RiskReady Platform

## Overview

The ITSM (IT Service Management) module provides comprehensive Configuration Management Database (CMDB) and Change Management capabilities for the RiskReady ISMS platform. It serves as the foundation for understanding what assets you're protecting and controlling changes to your environment.

## Module Capabilities

### 1. Configuration Management Database (CMDB)
- **Asset Register** - Complete inventory of all IT assets
- **Asset Classification** - Business criticality and data classification
- **Relationship Mapping** - Dependencies between assets
- **Compliance Scope** - Which frameworks apply to which assets
- **Data Quality Monitoring** - Track completeness of asset data

### 2. Change Management
- **Change Register** - All change requests with full lifecycle
- **Change Approval Workflow** - Multi-level approval process
- **CAB Dashboard** - Change Advisory Board management
- **Change Calendar** - Visual scheduling of changes
- **Impact Analysis** - Link changes to affected assets and processes

### 3. Dashboards & Reporting
- **ITSM Dashboard** - Overview of assets and changes
- **Data Quality Dashboard** - Asset data completeness metrics
- **Cloud Dashboard** - Cloud resource overview
- **DORA Compliance Report** - Regulatory compliance status
- **CAB Dashboard** - Pending approvals and meeting management

## Asset Categories

### Hardware
| Type | Description | Example Fields |
|------|-------------|----------------|
| Server | Physical or virtual servers | CPU, RAM, Storage, Rack Position |
| Workstation | Desktop computers | CPU, RAM, User assigned |
| Laptop | Portable computers | CPU, RAM, MDM status |
| Mobile Device | Phones, tablets | OS, IMEI, MDM enrolled |
| Network Device | Routers, switches, firewalls | Ports, Throughput, Firmware |
| Storage Device | NAS, SAN, DAS | Capacity, IOPS, RAID level |
| Security Appliance | Firewalls, IDS/IPS, HSM | Appliance type, Throughput |

### Software
| Type | Description | Example Fields |
|------|-------------|----------------|
| Application | Custom or packaged software | Tech stack, Version, Repository |
| Database | Database management systems | Engine, Version, Port, Replicas |
| Operating System | OS installations | Family, Distribution, Kernel |
| Middleware | Web servers, app servers, MQ | Type, Product, Port |

### Cloud Resources
| Type | Description | Example Fields |
|------|-------------|----------------|
| Cloud VM | Virtual machines in cloud | Instance type, vCPUs, Memory |
| Cloud Database | Managed database services | Engine, Multi-AZ, Replicas |
| Cloud Storage | Object/block storage | Storage class, Bucket name |
| Cloud Container | Docker/containerized apps | Runtime, Image, Replicas |
| Cloud Serverless | Lambda/Functions | Runtime, Memory, Timeout |
| Cloud Kubernetes | K8s clusters | Version, Node count, Auto-scaling |

### Services
| Type | Description | Example Fields |
|------|-------------|----------------|
| SaaS Application | Third-party SaaS | Vendor, Subscription tier, SSO |
| Internal Service | Internal APIs/services | URL, Auth method, SLA |
| External Service | External APIs | URL, Protocol, Health check |
| API Endpoint | API endpoints | Auth method, Protocol |

## Change Types

| Type | Description | Approval Required |
|------|-------------|-------------------|
| **Standard** | Pre-approved, low-risk changes | No (pre-approved) |
| **Normal** | Regular changes requiring approval | Yes |
| **Emergency** | Urgent changes for critical issues | Expedited |

## Documentation Structure

```
docs/itsm-module/
├── README.md                    # This file - Module overview
├── 01-cmdb-overview.md         # CMDB concepts and design principles
├── 02-cmdb-data-model.md       # Detailed Prisma schema documentation
├── 03-change-management.md     # Change management process and workflow
├── 04-integration-guide.md     # Integration with other modules
├── 05-implementation-roadmap.md # Development phases and status
└── 06-user-guide.md            # End-user guide with screenshots
```

## Quick Start

### For Users
1. Navigate to **ITSM** in the sidebar
2. View the **Dashboard** for an overview
3. Go to **Asset Register** to view/add assets
4. Use **New Asset** to register a new asset
5. Go to **Change Register** to manage changes

### For Developers
1. See [02-cmdb-data-model.md](./02-cmdb-data-model.md) for the Prisma schema
2. Backend code: `apps/server/src/itsm/`
3. Frontend code: `apps/web/src/pages/itsm/`
4. API types: `apps/web/src/lib/itsm-api.ts`

## UI Pages

| Page | Route | Description |
|------|-------|-------------|
| ITSM Dashboard | `/itsm` | Overview with stats and quick actions |
| Asset Register | `/itsm/assets` | List of all assets with filtering |
| Asset Form | `/itsm/assets/new`, `/itsm/assets/:id/edit` | Create/edit asset |
| Asset Detail | `/itsm/assets/:id` | View asset details and relationships |
| Data Quality | `/itsm/data-quality` | Data completeness metrics |
| Cloud Dashboard | `/itsm/cloud` | Cloud resource overview |
| DORA Report | `/itsm/dora-report` | DORA compliance report |
| Change Register | `/itsm/changes` | List of all changes |
| Change Form | `/itsm/changes/new`, `/itsm/changes/:id/edit` | Create/edit change |
| Change Detail | `/itsm/changes/:id` | View change details |
| Change Calendar | `/itsm/changes/calendar` | Calendar view of changes |
| CAB Dashboard | `/itsm/changes/cab` | Change Advisory Board |

## Compliance Mapping

| Framework | Requirement | ITSM Coverage |
|-----------|-------------|---------------|
| **ISO 27001** | A.8 Asset Management | Full CMDB |
| ISO 27001 | A.8.1 Inventory of assets | Asset Register |
| ISO 27001 | A.8.2 Ownership of assets | Owner/Custodian fields |
| ISO 27001 | A.8.9 Configuration management | CMDB + Change Mgmt |
| ISO 27001 | A.8.32 Change management | Full Change Management |
| **DORA** | Article 5 - ICT asset inventory | CMDB with cloud focus |
| DORA | Article 9 - ICT change management | Change Management |
| DORA | Article 28 - Third-party register | SaaS/External services |
| **NIS2** | Article 21(2)(a) - Risk analysis | Asset → Risk links |
| NIS2 | Article 21(2)(c) - Business continuity | RTO/RPO fields |
| NIS2 | Article 21(2)(d) - Supply chain | Asset dependencies |
| NIS2 | Article 21(2)(i) - Asset management | Full CMDB |
| NIS2 | Capacity management | Capacity fields |
| **SOC 2** | CC6.1 - Logical access | Access-related changes |
| SOC 2 | CC8.1 - Change management | Full Change Management |
| SOC 2 | A1.1 - Capacity planning | Capacity planning |

## Key Features

### Asset Management
- ✅ Auto-generated asset tags (e.g., `SRV-001`, `NET-002`)
- ✅ Category-based form with type-specific fields
- ✅ Accordion-based form sections with progress tracking
- ✅ Owner and Custodian assignment
- ✅ Multi-framework compliance scope
- ✅ Data handling flags (PII, Financial, Health, Confidential)
- ✅ Lifecycle management (Planned → Active → Retired → Disposed)
- ✅ Resilience fields (RTO, RPO, Availability, Redundancy)
- ✅ Capacity tracking for applicable asset types

### Change Management
- ✅ Change request workflow (Draft → Submit → Review → Approve → Implement)
- ✅ Impact analysis with linked assets and processes
- ✅ Risk assessment and backout planning
- ✅ Scheduling with maintenance window support
- ✅ CAB approval workflow
- ✅ Post-Implementation Review (PIR) tracking
- ✅ Change history and audit trail

### Data Quality
- ✅ Completeness tracking (owners, descriptions, classifications)
- ✅ Issue identification (critical assets without owners, etc.)
- ✅ Overall data quality score

## Integration with Other Modules

| Module | Integration |
|--------|-------------|
| **Organisation** | Assets link to Departments, Locations, Business Processes |
| **Risks** | Assets link to Risks they're affected by |
| **Controls** | Assets link to Controls that protect them |
| **Audits** | Assets can be audit scope items |
| **Applications** | Application records can be linked to Assets |
