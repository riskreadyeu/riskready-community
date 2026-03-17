# ITSM Integration Guide

## Overview

The ITSM module (CMDB + Change Management) serves as the foundation for the entire RiskReady platform. This guide explains how ITSM integrates with every other module.

## Integration Architecture

```
                            ┌─────────────────────────────────────┐
                            │           ITSM MODULE               │
                            │  ┌───────────┐  ┌────────────────┐  │
                            │  │   CMDB    │  │     Change     │  │
                            │  │  (Assets) │  │   Management   │  │
                            │  └─────┬─────┘  └───────┬────────┘  │
                            └───────│─────────────────│───────────┘
                                    │                 │
        ┌───────────────────────────┼─────────────────┼───────────────────────────┐
        │                           │                 │                           │
        ▼                           ▼                 ▼                           ▼
┌───────────────┐         ┌─────────────────┐ ┌───────────────┐         ┌─────────────────┐
│  Organisation │         │     Risks       │ │   Incidents   │         │    Controls     │
│    Module     │         │    Module       │ │    Module     │         │     Module      │
└───────────────┘         └─────────────────┘ └───────────────┘         └─────────────────┘
        │                           │                 │                           │
        │                           │                 │                           │
        └───────────────────────────┴─────────────────┴───────────────────────────┘
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │     Third-Party Risk      │
                              │        Module             │
                              └───────────────────────────┘
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │     Policy Module         │
                              │  (Scope & Applicability)  │
                              └───────────────────────────┘
```

---

## Module Integrations

### 1. Organisation Module

The Organisation module provides the organizational context for assets.

| Organisation Entity | ITSM Relationship | Purpose |
|---------------------|-------------------|---------|
| `Department` | Asset.departmentId | Asset ownership |
| `Location` | Asset.locationId | Physical location |
| `BusinessProcess` | AssetBusinessProcess | Process dependencies |
| `ExternalDependency` | Asset.vendorId | Vendor-provided assets |
| `User` | Asset.ownerId, Asset.custodianId | Accountability |

#### Schema Integration

```prisma
// In Asset model
departmentId      String?
department        Department?       @relation(fields: [departmentId], references: [id])

locationId        String?
location          Location?         @relation(fields: [locationId], references: [id])

ownerId           String?
owner             User?             @relation("AssetOwner", fields: [ownerId], references: [id])

vendorId          String?
vendor            ExternalDependency? @relation(fields: [vendorId], references: [id])
```

#### Add to Organisation Schema

```prisma
// Add to Department model
model Department {
  // ... existing fields ...
  
  // ITSM Relations
  assets            Asset[]
  changes           Change[]
}

// Add to Location model
model Location {
  // ... existing fields ...
  
  // ITSM Relations
  assets            Asset[]
}

// Add to BusinessProcess model
model BusinessProcess {
  // ... existing fields ...
  
  // ITSM Relations
  assetLinks        AssetBusinessProcess[]
}

// Add to ExternalDependency model
model ExternalDependency {
  // ... existing fields ...
  
  // ITSM Relations (vendor-provided assets)
  providedAssets    Asset[]
}
```

---

### 2. Risks Module

Assets are the foundation of risk assessment - you need to know what can be impacted.

| Risk Entity | ITSM Relationship | Purpose |
|-------------|-------------------|---------|
| `Risk` | AssetRisk | Which assets are at risk |
| `TreatmentPlan` | May require Changes | Implementing risk treatments |

#### Use Cases

1. **Risk Identification**
   - "What assets could be affected by this threat?"
   - Link risks to specific assets

2. **Impact Assessment**
   - Asset.businessCriticality → Risk impact level
   - Asset.dataClassification → Data breach severity

3. **Risk Treatment**
   - Treatment plans may create Changes
   - Changes tracked as treatment implementation

#### Schema Integration

```prisma
// Link table
model AssetRisk {
  id          String   @id @default(cuid())
  
  assetId     String
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  riskId      String
  risk        Risk     @relation(fields: [riskId], references: [id], onDelete: Cascade)
  
  impactLevel String?  // How this asset affects risk impact
  notes       String?
  
  @@unique([assetId, riskId])
}

// Add to Risk model
model Risk {
  // ... existing fields ...
  
  // ITSM Relations
  assetLinks        AssetRisk[]
}

// Add to TreatmentPlan model
model TreatmentPlan {
  // ... existing fields ...
  
  // Changes implementing this treatment
  implementingChangeId String?
  implementingChange   Change? @relation(fields: [implementingChangeId], references: [id])
}
```

#### Queries

```typescript
// Get all risks affecting critical assets
const criticalAssetRisks = await prisma.risk.findMany({
  where: {
    assetLinks: {
      some: {
        asset: {
          businessCriticality: 'CRITICAL'
        }
      }
    }
  }
});

// Get risk exposure for an asset
const assetRisks = await prisma.assetRisk.findMany({
  where: { assetId },
  include: {
    risk: {
      include: {
        treatmentPlan: true
      }
    }
  }
});
```

---

### 3. Controls Module

Controls protect assets. Understanding which controls protect which assets is essential.

| Control Entity | ITSM Relationship | Purpose |
|----------------|-------------------|---------|
| `Control` | AssetControl | Which controls protect which assets |
| `StatementOfApplicability` | Informed by assets in scope | Scope definition |

#### Use Cases

1. **Control Coverage Analysis**
   - "Which assets have this control implemented?"
   - "Which assets lack adequate controls?"

2. **Control Implementation**
   - Changes implement controls on assets
   - Track implementation status per asset

3. **Audit Evidence**
   - Show which assets are protected by which controls
   - Evidence of control effectiveness

#### Schema Integration

```prisma
// Link table
model AssetControl {
  id          String   @id @default(cuid())
  
  assetId     String
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  controlId   String
  control     Control  @relation(fields: [controlId], references: [id], onDelete: Cascade)
  
  // Implementation status
  status            String   @default("planned") // planned, in_progress, implemented, not_applicable
  implementedDate   DateTime?
  implementationNotes String?
  
  // Evidence
  evidenceUrl       String?
  lastVerified      DateTime?
  
  @@unique([assetId, controlId])
}

// Add to Control model
model Control {
  // ... existing fields ...
  
  // ITSM Relations
  assetLinks        AssetControl[]
}
```

#### Control Coverage Dashboard

```typescript
// Calculate control coverage
const coverage = await prisma.asset.findMany({
  where: {
    status: 'ACTIVE',
    inIsmsScope: true
  },
  select: {
    id: true,
    name: true,
    businessCriticality: true,
    controlLinks: {
      where: { status: 'implemented' },
      select: { controlId: true }
    }
  }
});

// Assets with no controls
const unprotected = coverage.filter(a => a.controlLinks.length === 0);
```

---

### 4. Incidents Module (Under Construction)

When incidents occur, knowing what's affected is critical.

| Incident Entity | ITSM Relationship | Purpose |
|-----------------|-------------------|---------|
| `SecurityIncident` | IncidentAsset | Affected assets |
| `SecurityIncident` | Change | Emergency changes |

#### Use Cases

1. **Impact Assessment**
   - "What assets were compromised?"
   - "What depends on the affected assets?"

2. **Response**
   - Emergency changes created from incidents
   - Track containment actions

3. **Post-Incident**
   - Identify control failures
   - Update asset security posture

#### Schema Integration

```prisma
// Link table (for when Incidents module is built)
model IncidentAsset {
  id              String   @id @default(cuid())
  
  incidentId      String
  incident        SecurityIncident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  
  assetId         String
  asset           Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  // Impact details
  impactType      String   // compromised, affected, at_risk
  impactDetails   String?
  
  // Recovery
  recoveryStatus  String?  // not_started, in_progress, recovered
  recoveredAt     DateTime?
  
  @@unique([incidentId, assetId])
}

// In Change model
model Change {
  // ... existing fields ...
  
  // Link to triggering incident (for emergency changes)
  incidentId      String?
  incident        SecurityIncident? @relation(fields: [incidentId], references: [id])
}
```

---

### 5. Third-Party Risk Module (Under Construction)

Vendor-provided assets and services need tracking.

| Third-Party Entity | ITSM Relationship | Purpose |
|--------------------|-------------------|---------|
| `ThirdPartyProvider` | Asset.vendorId | Vendor-provided assets |
| `ThirdPartyProvider` | Provider changes | Vendor-initiated changes |

#### Use Cases

1. **Vendor Asset Inventory**
   - "What assets does this vendor provide?"
   - SaaS applications, managed services

2. **Concentration Risk**
   - "How many critical assets depend on this vendor?"
   - DORA Article 28 compliance

3. **Vendor Changes**
   - Track vendor-initiated changes
   - Vendor patch management

#### Schema Integration

```prisma
// ExternalDependency already exists - extend it
model ExternalDependency {
  // ... existing fields ...
  
  // ITSM Relations
  providedAssets    Asset[]
  
  // Vendor-initiated changes
  vendorChanges     Change[] @relation("VendorChange")
}

// In Asset model
model Asset {
  // ... existing fields ...
  
  // Vendor providing this asset
  vendorId          String?
  vendor            ExternalDependency? @relation(fields: [vendorId], references: [id])
}

// In Change model
model Change {
  // ... existing fields ...
  
  // If this is a vendor-initiated change
  vendorId          String?
  vendor            ExternalDependency? @relation("VendorChange", fields: [vendorId], references: [id])
}
```

---

### 6. Policy Module

Policies define requirements that apply to assets.

| Policy Entity | ITSM Relationship | Purpose |
|---------------|-------------------|---------|
| `PolicyDocument` | Asset scope | Which assets policy applies to |

#### Use Cases

1. **Policy Scope**
   - "Which assets does this policy apply to?"
   - Filter by asset type, classification, etc.

2. **Compliance Checking**
   - Compare policy requirements to asset configuration
   - Identify non-compliant assets

#### Schema Integration

```prisma
// Link table
model PolicyAssetScope {
  id              String   @id @default(cuid())
  
  policyId        String
  policy          PolicyDocument @relation(fields: [policyId], references: [id], onDelete: Cascade)
  
  // Scope criteria (not individual assets, but criteria)
  assetTypes      Json?    @default("[]")  // Which asset types
  departments     Json?    @default("[]")  // Which departments
  dataClassifications Json? @default("[]") // Which data classifications
  customCriteria  Json?    // Additional filter criteria
  
  // Or link to specific assets
  specificAssets  Asset[]  @relation("PolicyScopeAssets")
}
```

---

### 7. Applications/ISRA Module

The existing Application entity becomes part of the CMDB.

#### Migration Strategy

**Option A: Application as Asset Type**
- Mark applications with `assetType: APPLICATION`
- Migrate Application fields to Asset.typeAttributes
- Keep existing Application entity for ISRA-specific data

**Option B: Application References Asset**
- Application.assetId → links to Asset record
- Asset provides CMDB foundation
- Application provides ISRA-specific assessment data

#### Recommended: Option B (Reference)

```prisma
// Modify Application model
model Application {
  // ... existing fields ...
  
  // Link to CMDB asset record
  assetId           String?   @unique
  asset             Asset?    @relation(fields: [assetId], references: [id])
  
  // ISRA-specific data remains here
  // TVA, BIA, SRL assessments
}
```

---

## Data Flow Examples

### Example 1: New Application Deployment

```
1. Asset Created
   └─ Asset (type: APPLICATION) created in CMDB
   
2. Risk Assessment
   └─ Risks linked to Asset
   └─ Impact based on Asset.businessCriticality
   
3. Control Assignment
   └─ Required controls linked to Asset
   └─ Implementation tracked
   
4. Change Request
   └─ Change created for deployment
   └─ Change links to Asset
   └─ Approval based on Asset criticality
   
5. Deployment
   └─ Change implemented
   └─ Asset.status = ACTIVE
   
6. Ongoing
   └─ Vulnerabilities scanned → linked to Asset
   └─ Incidents → linked to Asset
   └─ Policy compliance → checked against Asset
```

### Example 2: Security Incident Response

```
1. Incident Detected
   └─ SecurityIncident created
   
2. Impact Analysis
   └─ Affected Assets identified
   └─ Asset.relationships → determine blast radius
   └─ Asset.businessCriticality → determine severity
   
3. Containment
   └─ Emergency Change created
   └─ Change.incidentId = incident
   └─ Expedited approval
   
4. Recovery
   └─ Recovery changes created
   └─ Asset status updated
   
5. Post-Incident
   └─ Control failures identified
   └─ AssetControl → identify gaps
   └─ New risks registered → linked to Assets
```

### Example 3: Vendor Risk Assessment

```
1. Vendor Onboarding
   └─ ExternalDependency created
   └─ Risk assessment completed
   
2. Asset Registration
   └─ Assets provided by vendor created
   └─ Asset.vendorId = vendor
   └─ Marked as SAAS_APPLICATION or EXTERNAL_SERVICE
   
3. Concentration Analysis
   └─ Query: critical assets by vendor
   └─ DORA concentration risk report
   
4. Vendor Change
   └─ Vendor announces update
   └─ Change created with vendor link
   └─ Impact assessed via affected Assets
```

---

## API Integration Patterns

### Creating an Asset with Relations

```typescript
// API endpoint: POST /api/assets
async function createAsset(data: CreateAssetDto) {
  return prisma.asset.create({
    data: {
      assetTag: generateAssetTag(data.assetType),
      name: data.name,
      assetType: data.assetType,
      businessCriticality: data.businessCriticality,
      dataClassification: data.dataClassification,
      
      // Link to org entities
      departmentId: data.departmentId,
      locationId: data.locationId,
      ownerId: data.ownerId,
      
      // Link to vendor if applicable
      vendorId: data.vendorId,
      
      // Business process links
      businessProcessLinks: {
        create: data.businessProcessIds?.map(bpId => ({
          businessProcessId: bpId,
          criticality: 'medium'
        }))
      },
      
      // Control links
      controlLinks: {
        create: data.controlIds?.map(cId => ({
          controlId: cId,
          status: 'planned'
        }))
      }
    }
  });
}
```

### Impact Analysis Query

```typescript
// Get full impact of an asset failure
async function getAssetImpact(assetId: string) {
  // Get asset with all relationships
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      // What depends on this asset
      incomingRelationships: {
        where: { relationshipType: 'DEPENDS_ON' },
        include: { fromAsset: true }
      },
      // Business processes using this asset
      businessProcessLinks: {
        include: { businessProcess: true }
      },
      // Risks associated with this asset
      riskLinks: {
        include: { risk: true }
      }
    }
  });
  
  // Recursive dependency analysis
  const allAffected = await getTransitiveDependencies(assetId);
  
  return {
    asset,
    directlyAffected: asset.incomingRelationships.map(r => r.fromAsset),
    transitivelyAffected: allAffected,
    businessProcesses: asset.businessProcessLinks.map(l => l.businessProcess),
    risks: asset.riskLinks.map(l => l.risk)
  };
}
```

---

## Migration Considerations

### Existing Data Migration

1. **TechnologyPlatform → Asset**
   - Map fields to Asset model
   - Set assetType based on platformType
   - Preserve all existing data

2. **Application → Asset + Application**
   - Create Asset record for each Application
   - Link Application.assetId to Asset
   - Keep ISRA data in Application

### Backward Compatibility

- Keep existing API endpoints working
- Add new CMDB endpoints alongside
- Gradual migration with feature flags

### Data Quality

- Run data quality reports
- Identify incomplete records
- Owner assignment campaign
