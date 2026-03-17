# CMDB Data Model

## Design Philosophy

### Flat vs Deep Hierarchy

**iTop Approach (Deep Hierarchy):**
```
FunctionalCI → PhysicalDevice → ConnectableCI → DatacenterDevice → Server
```
- 5+ levels of inheritance
- Complex queries
- Rigid structure

**RiskReady Approach (Flat with Types):**
```
Asset (with assetType discriminator)
├── Type-specific fields in JSON or extension tables
└── Common fields on base model
```
- Simple queries
- Flexible extension
- Easier to understand

### Integration with Existing Models

The CMDB extends and links to existing entities:

| Existing Model | CMDB Relationship |
|----------------|-------------------|
| `Department` | Asset.ownerDepartmentId |
| `Location` | Asset.locationId |
| `BusinessProcess` | BusinessProcess → Asset (many-to-many) |
| `Application` | Becomes a subtype of Asset |
| `TechnologyPlatform` | Migrates into Asset |
| `ExternalDependency` | Links to vendor-provided Assets |

---

## Core Schema

### Asset (Base Configuration Item)

```prisma
// ============================================
// CMDB MODULE - Configuration Items
// ============================================

model Asset {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?

  // ============================================
  // IDENTIFICATION
  // ============================================
  
  // Unique identifier (e.g., AST-SRV-001, AST-APP-042)
  assetTag        String   @unique
  name            String
  displayName     String?
  description     String?  @db.Text
  
  // Type discriminator
  assetType       AssetType
  assetSubtype    String?   // Flexible subtype within category
  
  // ============================================
  // CLASSIFICATION (Security Focus)
  // ============================================
  
  // Business criticality for risk assessment
  businessCriticality  BusinessCriticality @default(MEDIUM)
  
  // Data classification
  dataClassification   DataClassification  @default(INTERNAL)
  
  // What types of data does this asset handle?
  handlesPersonalData      Boolean @default(false)
  handlesFinancialData     Boolean @default(false)
  handlesHealthData        Boolean @default(false)
  handlesConfidentialData  Boolean @default(false)
  
  // ============================================
  // COMPLIANCE SCOPE
  // ============================================
  
  inIsmsScope       Boolean @default(true)
  inPciScope        Boolean @default(false)
  inDoraScope       Boolean @default(false)
  inGdprScope       Boolean @default(false)
  scopeNotes        String?
  
  // ============================================
  // OWNERSHIP & RESPONSIBILITY
  // ============================================
  
  // Primary owner (accountable)
  ownerId           String?
  owner             User?       @relation("AssetOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  
  // Technical custodian (responsible for operation)
  custodianId       String?
  custodian         User?       @relation("AssetCustodian", fields: [custodianId], references: [id], onDelete: SetNull)
  
  // Owning department
  departmentId      String?
  department        Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  
  // ============================================
  // LOCATION
  // ============================================
  
  locationId        String?
  location          Location?   @relation(fields: [locationId], references: [id], onDelete: SetNull)
  
  // For cloud resources
  cloudProvider     CloudProvider?
  cloudRegion       String?
  cloudAccountId    String?
  cloudResourceId   String?     // AWS ARN, Azure Resource ID, GCP self-link
  
  // Physical location details
  datacenter        String?
  rack              String?
  rackPosition      Int?
  
  // ============================================
  // LIFECYCLE
  // ============================================
  
  status            AssetStatus @default(ACTIVE)
  
  // Key dates
  purchaseDate      DateTime?
  deploymentDate    DateTime?
  warrantyExpiry    DateTime?
  endOfLife         DateTime?
  endOfSupport      DateTime?
  disposalDate      DateTime?
  
  // Lifecycle notes
  lifecycleNotes    String?
  
  // ============================================
  // TECHNICAL DETAILS (Common)
  // ============================================
  
  // Network
  ipAddresses       Json?       @default("[]")  // Array of IP addresses
  fqdn              String?
  macAddresses      Json?       @default("[]")
  
  // Software
  operatingSystem   String?
  osVersion         String?
  
  // Versioning
  version           String?
  patchLevel        String?
  
  // ============================================
  // VENDOR & SUPPORT
  // ============================================
  
  manufacturer      String?
  model             String?
  serialNumber      String?
  
  // Support
  supportContract   String?
  supportExpiry     DateTime?
  supportTier       String?     // gold, silver, bronze
  
  // If vendor-provided (SaaS, managed service)
  vendorId          String?
  vendor            ExternalDependency? @relation(fields: [vendorId], references: [id], onDelete: SetNull)
  
  // ============================================
  // FINANCIAL
  // ============================================
  
  purchaseCost      Decimal?    @db.Decimal(15, 2)
  costCurrency      String      @default("USD")
  annualCost        Decimal?    @db.Decimal(15, 2)  // Ongoing costs
  costCenter        String?
  
  // ============================================
  // SECURITY POSTURE
  // ============================================
  
  // Encryption
  encryptionAtRest      Boolean @default(false)
  encryptionInTransit   Boolean @default(false)
  encryptionMethod      String?
  
  // Backup
  backupEnabled         Boolean @default(false)
  backupFrequency       String?
  backupRetention       String?
  lastBackupDate        DateTime?
  
  // Monitoring
  monitoringEnabled     Boolean @default(false)
  loggingEnabled        Boolean @default(false)
  
  // Vulnerability status
  lastVulnScan          DateTime?
  vulnerabilityCount    Int?
  criticalVulnCount     Int?
  
  // ============================================
  // CAPACITY MANAGEMENT (NIS2 Compliance)
  // ============================================
  
  // Current capacity metrics
  cpuCapacity           Int?        // Total CPU cores/vCPUs
  cpuUsagePercent       Int?        // Current utilization %
  memoryCapacityGB      Decimal?    // Total RAM in GB
  memoryUsagePercent    Int?        // Current utilization %
  storageCapacityGB     Decimal?    // Total storage in GB
  storageUsagePercent   Int?        // Current utilization %
  networkBandwidthMbps  Int?        // Network capacity
  
  // Thresholds & Alerts
  cpuThresholdPercent       Int?    @default(80)  // Alert threshold
  memoryThresholdPercent    Int?    @default(80)
  storageThresholdPercent   Int?    @default(80)
  
  // Capacity status
  capacityStatus        CapacityStatus @default(NORMAL)
  capacityNotes         String?
  
  // Trend tracking
  lastCapacityReview    DateTime?
  nextCapacityReview    DateTime?
  capacityTrend         String?     // growing, stable, declining
  growthRatePercent     Decimal?    // Monthly growth rate
  projectedExhaustionDate DateTime? // When will we run out?
  
  // ============================================
  // RESILIENCE & AVAILABILITY (NIS2 Compliance)
  // ============================================
  
  // Recovery objectives (linked to BIA)
  rtoMinutes            Int?        // Recovery Time Objective
  rpoMinutes            Int?        // Recovery Point Objective
  mtpdMinutes           Int?        // Maximum Tolerable Period of Disruption
  
  // Availability
  targetAvailability    Decimal?    // e.g., 99.9%
  actualAvailability    Decimal?    // Measured availability
  
  // Redundancy
  hasRedundancy         Boolean     @default(false)
  redundancyType        String?     // active-active, active-passive, N+1
  failoverAssetId       String?     // Link to failover asset
  
  // Last outage tracking
  lastOutageDate        DateTime?
  lastOutageDurationMin Int?
  outageCount12Months   Int?        @default(0)
  
  // ============================================
  // TYPE-SPECIFIC EXTENSIONS
  // ============================================
  
  // Flexible JSON for type-specific attributes
  // Avoids need for many extension tables
  typeAttributes    Json?       @default("{}")
  
  // Custom tags for flexible categorization
  tags              Json?       @default("[]")
  
  // ============================================
  // AUDIT & METADATA
  // ============================================
  
  createdBy         User?       @relation("AssetCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy         User?       @relation("AssetUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  
  // Data source
  discoverySource   String?     // manual, agent, api, import
  lastVerified      DateTime?
  verifiedById      String?
  
  // ============================================
  // RELATIONSHIPS
  // ============================================
  
  // Relationships where this asset is the source
  outgoingRelationships    AssetRelationship[] @relation("AssetFrom")
  
  // Relationships where this asset is the target
  incomingRelationships    AssetRelationship[] @relation("AssetTo")
  
  // Link to business processes
  businessProcessLinks     AssetBusinessProcess[]
  
  // Link to controls
  controlLinks             AssetControl[]
  
  // Link to risks
  riskLinks                AssetRisk[]
  
  // Link to changes
  changeLinks              ChangeAsset[]
  
  // Software installed on this asset (for hardware assets)
  installedSoftware        AssetSoftware[]
  
  // Capacity management
  capacityRecords          CapacityRecord[]
  capacityPlans            CapacityPlan[]
  
  // ============================================
  // INDEXES
  // ============================================
  
  @@index([assetTag])
  @@index([assetType])
  @@index([status])
  @@index([businessCriticality])
  @@index([dataClassification])
  @@index([departmentId])
  @@index([ownerId])
  @@index([locationId])
  @@index([cloudProvider])
  @@index([inIsmsScope])
}

// ============================================
// ENUMS
// ============================================

enum AssetType {
  // Hardware
  SERVER
  WORKSTATION
  LAPTOP
  MOBILE_DEVICE
  NETWORK_DEVICE
  STORAGE_DEVICE
  SECURITY_APPLIANCE
  IOT_DEVICE
  
  // Software
  OPERATING_SYSTEM
  APPLICATION
  DATABASE
  MIDDLEWARE
  
  // Cloud
  CLOUD_VM
  CLOUD_CONTAINER
  CLOUD_DATABASE
  CLOUD_STORAGE
  CLOUD_NETWORK
  CLOUD_SERVERLESS
  CLOUD_KUBERNETES
  
  // Services
  INTERNAL_SERVICE
  EXTERNAL_SERVICE
  SAAS_APPLICATION
  API_ENDPOINT
  
  // Data
  DATA_STORE
  DATA_FLOW
  
  // Other
  OTHER
}

enum AssetStatus {
  PLANNED
  PROCUREMENT
  DEVELOPMENT
  STAGING
  ACTIVE
  MAINTENANCE
  RETIRING
  DISPOSED
}

enum BusinessCriticality {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum DataClassification {
  RESTRICTED
  CONFIDENTIAL
  INTERNAL
  PUBLIC
}

enum CloudProvider {
  AWS
  AZURE
  GCP
  ORACLE_CLOUD
  IBM_CLOUD
  ALIBABA_CLOUD
  PRIVATE_CLOUD
  ON_PREMISES
}

enum CapacityStatus {
  NORMAL        // Within thresholds
  WARNING       // Approaching threshold
  CRITICAL      // Exceeded threshold
  EXHAUSTED     // No capacity remaining
  UNKNOWN       // Not monitored
}
```

---

### Asset Relationships

```prisma
// ============================================
// ASSET RELATIONSHIPS
// ============================================

model AssetRelationship {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  
  // Source asset
  fromAssetId String
  fromAsset   Asset    @relation("AssetFrom", fields: [fromAssetId], references: [id], onDelete: Cascade)
  
  // Target asset
  toAssetId   String
  toAsset     Asset    @relation("AssetTo", fields: [toAssetId], references: [id], onDelete: Cascade)
  
  // Relationship type
  relationshipType  RelationshipType
  
  // Description
  description       String?
  
  // Is this relationship critical? (for impact analysis)
  isCritical        Boolean @default(false)
  
  // Metadata
  notes             String?
  
  createdBy         User?   @relation("RelCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  
  @@unique([fromAssetId, toAssetId, relationshipType])
  @@index([fromAssetId])
  @@index([toAssetId])
  @@index([relationshipType])
}

enum RelationshipType {
  // Dependency
  DEPENDS_ON          // A depends on B to function
  
  // Hosting
  RUNS_ON             // Software runs on hardware
  HOSTED_ON           // VM hosted on hypervisor
  DEPLOYED_TO         // App deployed to server/cluster
  
  // Network
  CONNECTS_TO         // Network connection
  
  // Data
  STORES_DATA_ON      // Data stored on storage
  READS_FROM          // Reads data from
  WRITES_TO           // Writes data to
  REPLICATES_TO       // Data replication
  
  // Management
  MANAGED_BY          // Management tool relationship
  MONITORED_BY        // Monitoring tool
  
  // Backup & DR
  BACKED_UP_TO        // Backup target
  FAILS_OVER_TO       // Failover target
  
  // Security
  PROTECTED_BY        // Protected by security device
  AUTHENTICATES_VIA   // Authentication provider
  
  // Logical
  MEMBER_OF           // Member of cluster/group
  CONTAINS            // Contains (parent-child)
}
```

---

### Link Tables

```prisma
// ============================================
// ASSET - BUSINESS PROCESS LINK
// ============================================

model AssetBusinessProcess {
  id                String          @id @default(cuid())
  createdAt         DateTime        @default(now())
  
  assetId           String
  asset             Asset           @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  businessProcessId String
  businessProcess   BusinessProcess @relation(fields: [businessProcessId], references: [id], onDelete: Cascade)
  
  // How critical is this asset to the process?
  criticality       String          @default("medium") // critical, high, medium, low
  
  // Role of asset in process
  role              String?         // primary, backup, supporting
  
  notes             String?
  
  @@unique([assetId, businessProcessId])
  @@index([businessProcessId])
}

// ============================================
// ASSET - CONTROL LINK
// ============================================

model AssetControl {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  assetId     String
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  controlId   String
  control     Control  @relation(fields: [controlId], references: [id], onDelete: Cascade)
  
  // Implementation status for this asset
  status      String   @default("planned") // planned, in_progress, implemented, not_applicable
  
  // Implementation details
  implementationNotes String?
  implementedDate     DateTime?
  
  // Evidence
  evidenceUrl         String?
  lastVerified        DateTime?
  
  @@unique([assetId, controlId])
  @@index([controlId])
  @@index([status])
}

// ============================================
// ASSET - RISK LINK
// ============================================

model AssetRisk {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  
  assetId     String
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  riskId      String
  risk        Risk     @relation(fields: [riskId], references: [id], onDelete: Cascade)
  
  // Impact if this asset is compromised
  impactLevel String?  // critical, high, medium, low
  
  notes       String?
  
  @@unique([assetId, riskId])
  @@index([riskId])
}

// ============================================
// ASSET - SOFTWARE RELATIONSHIP
// For tracking what software is installed on hardware
// ============================================

model AssetSoftware {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Hardware asset
  hardwareAssetId String
  hardwareAsset   Asset    @relation(fields: [hardwareAssetId], references: [id], onDelete: Cascade)
  
  // Software details (could link to another Asset or be standalone)
  softwareName    String
  softwareVersion String?
  vendor          String?
  
  // Installation details
  installDate     DateTime?
  installPath     String?
  
  // Licensing
  licenseType     String?   // perpetual, subscription, open_source
  licenseKey      String?
  licenseExpiry   DateTime?
  
  // Status
  isApproved      Boolean   @default(true)
  
  @@index([hardwareAssetId])
  @@index([softwareName])
}

// ============================================
// CAPACITY MANAGEMENT (NIS2 Article 21)
// Historical capacity records for trend analysis
// ============================================

model CapacityRecord {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  
  assetId         String
  asset           Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  // Timestamp of measurement
  recordedAt      DateTime @default(now())
  
  // Metrics snapshot
  cpuUsagePercent       Int?
  memoryUsagePercent    Int?
  storageUsagePercent   Int?
  networkUsagePercent   Int?
  
  // Additional metrics (flexible)
  customMetrics         Json?   @default("{}")
  
  // Source
  source                String? // agent, api, manual
  
  @@index([assetId])
  @@index([recordedAt])
  @@index([assetId, recordedAt])
}

// ============================================
// CAPACITY PLANNING
// For capacity forecasting and planning
// ============================================

model CapacityPlan {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdById     String?
  
  // Which asset(s) does this plan cover?
  assetId         String?
  asset           Asset?   @relation(fields: [assetId], references: [id], onDelete: SetNull)
  
  // Or a group of assets
  assetGroup      String?  // e.g., "Production Databases", "Web Servers"
  
  // Plan details
  title           String
  description     String?  @db.Text
  
  // Current state
  currentCapacity String   @db.Text  // Description of current state
  currentUtilizationPercent Int?
  
  // Projections
  projectedGrowthPercent    Decimal?  // Expected growth
  projectionPeriodMonths    Int?      // Over what period
  projectedExhaustionDate   DateTime?
  
  // Recommendations
  recommendedAction         String?   @db.Text
  recommendedDate           DateTime?
  estimatedCost             Decimal?
  costCurrency              String    @default("USD")
  
  // Status
  status          CapacityPlanStatus @default(DRAFT)
  approvedById    String?
  approvedAt      DateTime?
  implementedAt   DateTime?
  
  // Review
  reviewDate      DateTime?
  nextReviewDate  DateTime?
  
  createdBy       User?    @relation("CapPlanCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  
  @@index([assetId])
  @@index([status])
}

enum CapacityPlanStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

---

## Type-Specific Attributes

Instead of separate tables for each asset type, we use the `typeAttributes` JSON field. Here are the expected structures:

### Server Attributes
```json
{
  "cpuModel": "Intel Xeon Gold 6248",
  "cpuCores": 20,
  "ramGB": 256,
  "storageGB": 4096,
  "storageType": "SSD",
  "hypervisor": "VMware ESXi 7.0",
  "virtualMachineCount": 15,
  "rackUnits": 2,
  "powerWatts": 750,
  "redundantPower": true
}
```

### Cloud VM Attributes
```json
{
  "instanceType": "m5.xlarge",
  "vCPUs": 4,
  "memoryGB": 16,
  "ebsOptimized": true,
  "spotInstance": false,
  "availabilityZone": "us-east-1a",
  "vpcId": "vpc-12345",
  "subnetId": "subnet-67890",
  "securityGroups": ["sg-web", "sg-ssh"],
  "iamRole": "EC2-WebServer-Role"
}
```

### Database Attributes
```json
{
  "engine": "PostgreSQL",
  "engineVersion": "14.5",
  "instanceClass": "db.r5.large",
  "storageGB": 500,
  "storageType": "gp3",
  "multiAZ": true,
  "encrypted": true,
  "backupRetentionDays": 30,
  "maintenanceWindow": "Sun:03:00-Sun:04:00",
  "parameterGroup": "custom-pg14"
}
```

### Network Device Attributes
```json
{
  "deviceType": "switch",
  "portCount": 48,
  "uplinkPorts": 4,
  "managementProtocol": "SSH",
  "firmwareVersion": "16.12.4",
  "vlanSupport": true,
  "poeEnabled": true,
  "stackMember": true,
  "stackRole": "master"
}
```

### SaaS Application Attributes
```json
{
  "vendorName": "Salesforce",
  "subscriptionTier": "Enterprise",
  "userCount": 250,
  "ssoEnabled": true,
  "ssoProvider": "Okta",
  "mfaRequired": true,
  "dataResidency": "EU",
  "apiIntegrations": ["HubSpot", "Slack", "SAP"],
  "contractRenewalDate": "2025-03-01"
}
```

---

## Queries

### Find All Critical Assets
```typescript
const criticalAssets = await prisma.asset.findMany({
  where: {
    businessCriticality: 'CRITICAL',
    status: 'ACTIVE'
  },
  include: {
    owner: true,
    department: true,
    location: true
  }
});
```

### Impact Analysis (What depends on this asset?)
```typescript
const impactedAssets = await prisma.assetRelationship.findMany({
  where: {
    toAssetId: assetId,
    relationshipType: 'DEPENDS_ON'
  },
  include: {
    fromAsset: true
  }
});
```

### Assets Without Controls
```typescript
const unprotectedAssets = await prisma.asset.findMany({
  where: {
    status: 'ACTIVE',
    inIsmsScope: true,
    controlLinks: {
      none: {}
    }
  }
});
```

### Assets by Cloud Provider
```typescript
const awsAssets = await prisma.asset.findMany({
  where: {
    cloudProvider: 'AWS',
    status: 'ACTIVE'
  },
  orderBy: {
    businessCriticality: 'desc'
  }
});
```
