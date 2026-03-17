# CMDB Overview

## What is a CMDB?

A Configuration Management Database (CMDB) is a repository that stores information about all significant entities (Configuration Items or CIs) in your IT environment and the relationships between them.

For ISMS purposes, the CMDB answers critical questions:
- **What do we have?** (Inventory)
- **Who owns it?** (Accountability)
- **How critical is it?** (Risk context)
- **What data does it hold?** (Classification)
- **What depends on what?** (Impact analysis)
- **What protects it?** (Control coverage)

## CMDB Scope for ISMS

### In Scope
| Category | Examples | Why It Matters |
|----------|----------|----------------|
| **Hardware** | Servers, workstations, network devices, mobile devices | Physical attack surface |
| **Software** | Operating systems, applications, databases | Vulnerabilities, licensing |
| **Cloud Resources** | VMs, containers, storage, managed services | Shared responsibility |
| **Services** | Internal services, SaaS, third-party services | Dependencies, availability |
| **Data Assets** | Databases, file stores, data flows | Classification, protection |
| **Network** | Subnets, VLANs, firewalls, VPNs | Segmentation, access control |
| **People Systems** | Identity providers, access management | Access control foundation |

### Out of Scope (for now)
- End-user peripherals (keyboards, mice)
- Consumables
- Furniture and facilities (unless security-relevant)

## Asset Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PLANNED   │───►│   ACTIVE    │───►│  RETIRING   │───►│  DISPOSED   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
   Procurement        In Production      End of Life      Secure Disposal
   Risk Assessment    Monitored          Data Wiping      Audit Trail
   Control Planning   Patched            Decommission     Compliance Record
```

### Lifecycle Statuses

| Status | Description | Security Implications |
|--------|-------------|----------------------|
| `PLANNED` | Approved, not yet deployed | Risk assessment required |
| `PROCUREMENT` | Being acquired | Vendor security review |
| `DEVELOPMENT` | In development/testing | Separate from production |
| `STAGING` | Pre-production testing | May contain production data |
| `ACTIVE` | Production use | Full security controls |
| `MAINTENANCE` | Temporarily offline | Ensure secure state |
| `RETIRING` | Being phased out | Data sanitization |
| `DISPOSED` | No longer exists | Audit record only |

## Asset Classification

### Business Criticality
Aligned with your existing `businessCriticity` field pattern:

| Level | Definition | RTO Expectation | Example |
|-------|------------|-----------------|---------|
| `CRITICAL` | Business cannot operate without it | < 1 hour | Core banking system |
| `HIGH` | Significant business impact if unavailable | < 4 hours | Email server |
| `MEDIUM` | Moderate impact, workarounds exist | < 24 hours | HR system |
| `LOW` | Minimal immediate impact | < 72 hours | Archive storage |

### Data Classification
What type of data does this asset process/store?

| Level | Definition | Handling Requirements |
|-------|------------|----------------------|
| `RESTRICTED` | Highly sensitive (PII, financial, health) | Encryption, strict access, audit |
| `CONFIDENTIAL` | Internal sensitive (strategies, contracts) | Need-to-know access |
| `INTERNAL` | Internal use only | Employee access |
| `PUBLIC` | Can be shared externally | No restrictions |

### Compliance Scope
Which frameworks/regulations apply to this asset?

- ISO 27001 ISMS Scope
- DORA ICT Asset Inventory
- PCI DSS Cardholder Data Environment
- GDPR Personal Data Processing
- SOC 2 Trust Services Criteria

## Asset Relationships

Understanding relationships enables impact analysis:

```
┌──────────────┐
│ BusinessProc │
│   (Order     │
│  Processing) │
└──────┬───────┘
       │ depends on
       ▼
┌──────────────┐     runs on      ┌──────────────┐
│ Application  │─────────────────►│    Server    │
│   (ERP)      │                  │  (APP-SRV-01)│
└──────┬───────┘                  └──────┬───────┘
       │                                 │
       │ uses                            │ connects to
       ▼                                 ▼
┌──────────────┐                  ┌──────────────┐
│   Database   │◄─────────────────│   Network    │
│  (ERP-DB)    │    stored on     │  (VLAN-100)  │
└──────────────┘                  └──────────────┘
```

### Relationship Types

| Relationship | Description | Example |
|--------------|-------------|---------|
| `RUNS_ON` | Software runs on hardware | App → Server |
| `DEPENDS_ON` | Requires for operation | App → Database |
| `CONNECTS_TO` | Network connectivity | Server → Switch |
| `STORES_DATA_ON` | Data storage location | App → Storage |
| `MANAGED_BY` | Management relationship | Server → Hypervisor |
| `BACKED_UP_TO` | Backup relationship | Server → Backup system |
| `REPLICATED_TO` | Replication target | DB → DR Site DB |
| `PROTECTED_BY` | Security relationship | Server → Firewall |

## Integration with Security Processes

### Risk Assessment
```
Asset → has → Risks
Asset → requires → Controls
Asset.businessCriticality → influences → Risk.impact
Asset.dataClassification → influences → Risk.impact
```

### Incident Response
```
Incident → affects → Assets[]
Asset.relationships → determines → blast radius
Asset.owner → notified during → incident
```

### Vulnerability Management
```
Asset.operatingSystem → matched with → Vulnerability
Asset.software → matched with → CVE
Asset.businessCriticality → prioritizes → patching
```

### Change Management
```
Change → affects → Assets[]
Asset.businessCriticality → determines → approval level
Asset.relationships → identifies → impacted systems
```

## CMDB Data Quality

### Completeness Metrics
- % of assets with assigned owner
- % of assets with data classification
- % of assets with business criticality
- % of assets with compliance scope defined

### Accuracy Metrics
- Last verification date
- Automated discovery vs manual entry
- Variance between discovered and recorded

### Best Practices
1. **Automated Discovery** - Use agents/scanning where possible
2. **Regular Verification** - Quarterly asset reviews
3. **Clear Ownership** - Every asset has an owner
4. **Lifecycle Tracking** - Know what's being retired
5. **Relationship Mapping** - Understand dependencies
