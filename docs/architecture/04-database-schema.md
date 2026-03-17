# Database Schema

This document details the PostgreSQL database schema, Prisma ORM configuration, and data modelling patterns.

---

## Table of Contents

1. [Prisma Configuration](#prisma-configuration)
2. [Schema Organisation](#schema-organisation)
3. [Common Patterns](#common-patterns)
4. [Schema Modules](#schema-modules)
5. [Relationships](#relationships)
6. [Indexes](#indexes)
7. [Migrations](#migrations)

---

## Prisma Configuration

### Schema Files

The Prisma schema is split across multiple files for maintainability:

```
prisma/schema/
├── base.prisma         # Datasource and generator configuration
├── auth.prisma         # Authentication models (User, Session)
├── organisation.prisma # Organisation module models
└── controls.prisma     # Risk & Control models (includes Treatment Plans)
```

### Base Configuration

```prisma
// base.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### Environment Variables

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/riskready?schema=public"
```

---

## Schema Organisation

### Module-Based Schema Files

Each feature module has its own schema file containing related models:

| File | Models | Purpose |
|------|--------|---------|
| `base.prisma` | - | Database connection config |
| `auth.prisma` | User, Session | Authentication & users |
| `organisation.prisma` | 23+ models | Organisation management |
| `controls.prisma` | Risk, Control, Treatment, etc. | Risk & control management |

### Future Schema Files

As the application grows, additional schema files will be added:

```
prisma/schema/
├── base.prisma
├── auth.prisma
├── organisation.prisma
├── risk.prisma           # Risk management models
├── control.prisma        # Control management models
├── policy.prisma         # Policy management models
├── audit.prisma          # Audit management models
└── incident.prisma       # Incident management models
```

---

## Common Patterns

### Base Entity Fields

All entities include standard audit fields:

```prisma
model Entity {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?
  
  // ... entity-specific fields
  
  createdBy User? @relation("EntityCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User? @relation("EntityUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | String (CUID) | Unique identifier |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `createdById` | String? | User who created |
| `updatedById` | String? | User who last updated |

### Soft Delete Pattern

Entities use `isActive` for soft deletion:

```prisma
model Department {
  // ... fields
  isActive Boolean @default(true)
  
  @@index([isActive])
}
```

### Status Fields

Entities with workflow states:

```prisma
model MeetingActionItem {
  status String @default("open")  // open, in_progress, completed, cancelled
  
  @@index([status])
}
```

### Code/Identifier Pattern

Entities with human-readable codes:

```prisma
model Department {
  departmentCode String @unique
  
  @@index([departmentCode])
}
```

### Hierarchical Pattern

Self-referencing for tree structures:

```prisma
model Department {
  id       String  @id @default(cuid())
  parentId String?
  
  parent   Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children Department[] @relation("DepartmentHierarchy")
  
  @@index([parentId])
}
```

### JSON Fields

For flexible/array data:

```prisma
model OrganisationProfile {
  primaryCompetitors     Json? @default("[]")     // Array
  riskTolerance          Json? @default("{}")     // Object
  employeeCategories     Json? @default("[]")     // Array of objects
}
```

### Decimal Fields

For financial/precise values:

```prisma
model Department {
  budget         Decimal? @db.Decimal(15, 2)
  budgetCurrency String   @default("USD")
}
```

---

## Schema Modules

### Auth Module

```prisma
// auth.prisma

model User {
  id           String   @id @default(cuid())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  email        String   @unique
  passwordHash String
  name         String
  role         String   @default("user")
  isActive     Boolean  @default(true)
  
  // Profile
  avatarUrl    String?
  phone        String?
  jobTitle     String?
  
  // Timestamps
  lastLoginAt  DateTime?
  
  // Relations to other modules
  departmentHead      Department[]        @relation("DepartmentHead")
  departmentDeputy    Department[]        @relation("DepartmentDeputy")
  departmentMember    DepartmentMember[]
  // ... many more relations
  
  @@index([email])
  @@index([role])
  @@index([isActive])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}
```

### Organisation Module

The organisation module contains 23+ models. Key models include:

#### OrganisationProfile

```prisma
model OrganisationProfile {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?

  // Basic Information
  name                String
  legalName           String
  description         String?
  logoUrl             String?

  // Industry Information
  industrySector      String?
  industrySubsector   String?
  industryCode        String?

  // Financial Information
  annualRevenue       Decimal?  @db.Decimal(20, 2)
  revenueCurrency     String    @default("USD")
  employeeCount       Int

  // ISMS Information (Clause 4.3)
  ismsScope           String?
  ismsPolicy          String?
  ismsObjectives      Json?     @default("[]")
  
  // Scope Details
  productsServicesInScope Json?   @default("[]")
  departmentsInScope      Json?   @default("[]")
  locationsInScope        Json?   @default("[]")
  processesInScope        Json?   @default("[]")
  systemsInScope          Json?   @default("[]")
  scopeExclusions         String?
  exclusionJustification  String?

  // ISO Certification
  isoCertificationStatus String  @default("not_certified")
  certificationBody      String?
  certificationDate      DateTime?
  certificationExpiry    DateTime?
  nextAuditDate          DateTime?

  // Risk Management
  riskAppetite        String?
  riskTolerance       Json?     @default("{}")

  @@index([name])
  @@index([industrySector])
}
```

#### Department

```prisma
model Department {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?

  // Basic Information
  name            String
  departmentCode  String   @unique
  description     String?

  // Hierarchy
  parentId        String?
  parent          Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children        Department[] @relation("DepartmentHierarchy")

  // Classification
  departmentCategory String?
  criticalityLevel   String?

  // Leadership
  departmentHeadId String?
  departmentHead   User?    @relation("DepartmentHead", fields: [departmentHeadId], references: [id])
  deputyHeadId     String?
  deputyHead       User?    @relation("DepartmentDeputy", fields: [deputyHeadId], references: [id])

  // Resources
  headcount       Int?
  contractorCount Int?
  budget          Decimal? @db.Decimal(15, 2)
  budgetCurrency  String   @default("USD")
  costCenter      String?

  // Data Handling
  handlesPersonalData   Boolean @default(false)
  handlesFinancialData  Boolean @default(false)

  // Status
  isActive        Boolean   @default(true)

  // Relations
  members           DepartmentMember[]
  businessProcesses BusinessProcess[]
  securityChampions SecurityChampion[]
  externalDependencies ExternalDependency[]

  @@index([departmentCode])
  @@index([parentId])
  @@index([departmentHeadId])
  @@index([isActive])
}
```

#### Location

```prisma
model Location {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?

  // Basic Information
  locationCode  String?  @unique
  name          String
  locationType  String?

  // Address
  address    String?
  city       String?
  state      String?
  country    String?
  postalCode String?
  region     String?

  // Physical Security
  physicalSecurityLevel String?
  accessControlType     String?
  securityFeatures      Json?    @default("[]")

  // IT Infrastructure
  isDataCenter      Boolean  @default(false)
  hasServerRoom     Boolean  @default(false)
  networkType       String?
  backupPower       Boolean  @default(false)

  // ISMS Scope
  inIsmsScope        Boolean  @default(true)
  scopeJustification String?

  // Status
  isActive        Boolean  @default(true)

  @@index([locationCode])
  @@index([locationType])
  @@index([inIsmsScope])
}
```

#### SecurityCommittee & Related

```prisma
model SecurityCommittee {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  name             String
  committeeType    String
  description      String?
  chairId          String?
  chair            User?    @relation("CommitteeChair", fields: [chairId], references: [id])
  meetingFrequency String?
  authorityLevel   String?
  isActive         Boolean  @default(true)

  memberships CommitteeMembership[]
  meetings    CommitteeMeeting[]

  @@index([committeeType])
  @@index([isActive])
}

model CommitteeMeeting {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  committeeId     String
  committee       SecurityCommittee @relation(fields: [committeeId], references: [id])
  meetingNumber   String?
  title           String
  meetingType     String   @default("regular")
  meetingDate     DateTime
  startTime       String?
  endTime         String?
  
  agenda          String?
  objectives      String?
  minutes         String?
  
  status          String  @default("scheduled")
  quorumAchieved  Boolean @default(false)

  attendances MeetingAttendance[]
  decisions   MeetingDecision[]
  actionItems MeetingActionItem[]

  @@unique([committeeId, meetingDate, startTime])
  @@index([committeeId])
  @@index([meetingDate])
  @@index([status])
}

model MeetingDecision {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  meetingId      String
  meeting        CommitteeMeeting @relation(fields: [meetingId], references: [id])
  decisionNumber String?
  title          String
  description    String
  decisionType   String
  rationale      String?
  
  voteType     String @default("majority")
  votesFor     Int    @default(0)
  votesAgainst Int    @default(0)
  votesAbstain Int    @default(0)
  
  responsiblePartyId     String?
  implementationDeadline DateTime?
  implemented            Boolean   @default(false)
  implementationDate     DateTime?

  @@index([meetingId])
  @@index([decisionType])
  @@index([implemented])
}

model MeetingActionItem {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  meetingId    String
  meeting      CommitteeMeeting @relation(fields: [meetingId], references: [id])
  actionNumber String?
  title        String
  description  String
  
  assignedToId String?
  priority     String   @default("medium")
  dueDate      DateTime
  
  status             String    @default("open")
  progressPercentage Int       @default(0)
  completionDate     DateTime?
  completionNotes    String?

  @@index([meetingId])
  @@index([assignedToId])
  @@index([status])
  @@index([priority, dueDate])
}
```

### Risk & Control Module (Treatment Plans)

The controls module contains risk management and treatment planning models:

#### TreatmentPlan

```prisma
model TreatmentPlan {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?

  // Identification
  treatmentId String  // "TP-001", "TP-002", etc.
  title       String
  description String  @db.Text

  // Classification
  treatmentType TreatmentType     @default(MITIGATE)
  priority      TreatmentPriority @default(MEDIUM)
  status        TreatmentStatus   @default(DRAFT)

  // Risk Scoring & Targets
  targetResidualScore  Int?
  currentResidualScore Int?
  expectedReduction    Int?  // Percentage (0-100)

  // Financial
  estimatedCost Decimal? @db.Decimal(15, 2)
  actualCost    Decimal? @db.Decimal(15, 2)
  costBenefit   String?  @db.Text
  roi           Decimal? @db.Decimal(10, 2)

  // Timeline
  proposedDate     DateTime?
  approvedDate     DateTime?
  targetStartDate  DateTime?
  targetEndDate    DateTime?
  actualStartDate  DateTime?
  actualEndDate    DateTime?

  // Ownership
  riskOwnerId   String?
  riskOwner     User?   @relation("TreatmentRiskOwner", fields: [riskOwnerId], references: [id], onDelete: SetNull)
  implementerId String?
  implementer   User?   @relation("TreatmentImplementer", fields: [implementerId], references: [id], onDelete: SetNull)
  approvedById  String?
  approvedBy    User?   @relation("TreatmentApprovedBy", fields: [approvedById], references: [id], onDelete: SetNull)

  // Risk Acceptance (for ACCEPT type)
  acceptanceRationale   String?   @db.Text
  acceptanceCriteria    String?   @db.Text
  acceptanceConditions  Json?     @default("[]")
  acceptanceExpiryDate  DateTime?

  // Progress Tracking
  progressPercentage Int     @default(0)
  progressNotes      String? @db.Text

  // Related Controls
  controlIds String? @db.Text

  // Relations
  riskId         String
  risk           Risk              @relation(fields: [riskId], references: [id], onDelete: Cascade)
  organisationId String
  actions        TreatmentAction[]
  
  // Treatment Enhancements
  history            TreatmentPlanHistory[]
  sourceDependencies TreatmentDependency[] @relation("SourceDependencies")
  targetDependencies TreatmentDependency[] @relation("TargetDependencies")

  // Audit
  createdBy User? @relation("TreatmentCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User? @relation("TreatmentUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@unique([treatmentId, organisationId])
  @@index([riskId])
  @@index([organisationId])
  @@index([status])
  @@index([priority])
  @@index([treatmentType])
  @@index([targetEndDate])
}

enum TreatmentType {
  MITIGATE  // Reduce likelihood or impact
  TRANSFER  // Transfer to third party (insurance, outsourcing)
  AVOID     // Eliminate the risk source
  ACCEPT    // Accept the risk with justification
}

enum TreatmentStatus {
  DRAFT        // Initial creation
  PROPOSED     // Submitted for review
  APPROVED     // Approved for implementation
  IN_PROGRESS  // Being implemented
  COMPLETED    // Implementation complete
  CANCELLED    // Cancelled/abandoned
}

enum TreatmentPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

#### TreatmentAction

```prisma
model TreatmentAction {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?

  // Identification
  actionId    String  // "ACT-001", "ACT-002", etc.
  title       String
  description String? @db.Text

  // Classification
  status   ActionStatus      @default(NOT_STARTED)
  priority TreatmentPriority @default(MEDIUM)

  // Timeline
  dueDate       DateTime?
  completedDate DateTime?

  // Assignment
  assignedToId String?
  assignedTo   User?   @relation("ActionAssignedTo", fields: [assignedToId], references: [id], onDelete: SetNull)

  // Effort Tracking
  estimatedHours Int?
  actualHours    Int?

  // Completion Details
  completionNotes String? @db.Text
  blockerNotes    String? @db.Text

  // Relations
  treatmentPlanId String
  treatmentPlan   TreatmentPlan @relation(fields: [treatmentPlanId], references: [id], onDelete: Cascade)

  // Audit
  createdBy User? @relation("ActionCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)

  @@unique([actionId, treatmentPlanId])
  @@index([treatmentPlanId])
  @@index([status])
  @@index([assignedToId])
  @@index([dueDate])
}

enum ActionStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  BLOCKED
  CANCELLED
}
```

#### TreatmentTemplate

```prisma
model TreatmentTemplate {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  // Identification
  templateId  String  // "TPL-001", "TPL-002", etc.
  title       String
  description String  @db.Text

  // Classification
  treatmentType TreatmentType     @default(MITIGATE)
  priority      TreatmentPriority @default(MEDIUM)

  // Applicability
  riskLevels String[]  // ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

  // Cost Estimates
  estimatedCostMin Decimal? @db.Decimal(15, 2)
  estimatedCostMax Decimal? @db.Decimal(15, 2)

  // Relations
  organisationId String?
  organisation   OrganisationProfile? @relation(fields: [organisationId], references: [id], onDelete: Cascade)

  // Audit
  createdBy User? @relation("TemplateCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)

  @@unique([templateId, organisationId])
  @@index([treatmentType])
  @@index([organisationId])
}
```

#### TreatmentDependency

```prisma
model TreatmentDependency {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  createdById String?

  // Source and Target
  sourceTreatmentId String
  sourceTreatment   TreatmentPlan @relation("SourceDependencies", fields: [sourceTreatmentId], references: [id], onDelete: Cascade)
  
  targetTreatmentId String
  targetTreatment   TreatmentPlan @relation("TargetDependencies", fields: [targetTreatmentId], references: [id], onDelete: Cascade)

  // Dependency Details
  dependencyType DependencyType
  description    String?        @db.Text
  isMandatory    Boolean        @default(true)

  // Audit
  createdBy User? @relation("DependencyCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)

  @@unique([sourceTreatmentId, targetTreatmentId])
  @@index([sourceTreatmentId])
  @@index([targetTreatmentId])
  @@index([dependencyType])
}

enum DependencyType {
  BLOCKS    // Source must complete before target can start
  REQUIRES  // Target needs source to be effective
  RELATED   // Informational link only
}
```

#### TreatmentPlanHistory

```prisma
model TreatmentPlanHistory {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  // Treatment Plan Reference
  treatmentPlanId String
  treatmentPlan   TreatmentPlan @relation(fields: [treatmentPlanId], references: [id], onDelete: Cascade)

  // Change Details
  action  TreatmentHistoryAction
  details Json?                  @default("{}")
  notes   String?                @db.Text

  // User who made the change
  userId String?
  user   User?   @relation("TreatmentHistoryUser", fields: [userId], references: [id], onDelete: SetNull)

  @@index([treatmentPlanId])
  @@index([action])
  @@index([createdAt])
}

enum TreatmentHistoryAction {
  CREATED
  UPDATED
  APPROVED
  REJECTED
  STARTED
  PROGRESS_UPDATED
  COMPLETED
  CANCELLED
  REOPENED
  ACTION_ADDED
  ACTION_COMPLETED
  ACTION_BLOCKED
  COMMENT_ADDED
}
```

---

## Relationships

### Relationship Types

| Type | Prisma Syntax | Example |
|------|---------------|---------|
| One-to-One | `@relation` | User → Profile |
| One-to-Many | `[]` on many side | Department → Members |
| Many-to-Many | Join table | Committee ↔ Users |
| Self-referential | Same model relation | Department → Parent/Children |

### One-to-Many Example

```prisma
model Department {
  id      String @id
  members DepartmentMember[]
}

model DepartmentMember {
  id           String @id
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  
  @@index([departmentId])
}
```

### Many-to-Many via Join Table

```prisma
model SecurityCommittee {
  id          String @id
  memberships CommitteeMembership[]
}

model User {
  id          String @id
  memberships CommitteeMembership[]
}

model CommitteeMembership {
  id          String @id
  committeeId String
  userId      String
  role        String?
  hasVotingRights Boolean @default(true)
  
  committee SecurityCommittee @relation(fields: [committeeId], references: [id])
  user      User              @relation(fields: [userId], references: [id])
  
  @@unique([committeeId, userId])
  @@index([committeeId])
  @@index([userId])
}
```

### Self-Referential Hierarchy

```prisma
model Department {
  id       String  @id
  parentId String?
  
  parent   Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children Department[] @relation("DepartmentHierarchy")
  
  @@index([parentId])
}
```

### Cascade Behaviors

| Behavior | When to Use |
|----------|-------------|
| `Cascade` | Delete children when parent deleted |
| `SetNull` | Set FK to null when parent deleted |
| `Restrict` | Prevent deletion if children exist |
| `NoAction` | Database default behavior |

```prisma
// Cascade - delete members when department deleted
model DepartmentMember {
  department Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
}

// SetNull - keep record but clear reference
model Department {
  departmentHead User? @relation(fields: [departmentHeadId], references: [id], onDelete: SetNull)
}
```

---

## Indexes

### Index Strategy

| Index Type | Purpose | Example |
|------------|---------|---------|
| Primary Key | Unique identifier | `@id` |
| Unique | Enforce uniqueness | `@unique` |
| Composite Unique | Multi-field uniqueness | `@@unique([a, b])` |
| Standard Index | Query performance | `@@index([field])` |
| Composite Index | Multi-field queries | `@@index([a, b])` |

### Common Index Patterns

```prisma
model Department {
  id             String  @id @default(cuid())
  departmentCode String  @unique              // Unique lookup
  parentId       String?
  departmentHeadId String?
  isActive       Boolean @default(true)
  
  @@index([departmentCode])                   // Code lookups
  @@index([parentId])                         // Hierarchy queries
  @@index([departmentHeadId])                 // Head lookups
  @@index([isActive])                         // Active filtering
}

model MeetingActionItem {
  status   String   @default("open")
  priority String   @default("medium")
  dueDate  DateTime
  
  @@index([status])                           // Status filtering
  @@index([priority, dueDate])                // Priority + due date sorting
}
```

### Composite Unique Constraints

```prisma
model CommitteeMeeting {
  committeeId String
  meetingDate DateTime
  startTime   String?
  
  @@unique([committeeId, meetingDate, startTime])  // No duplicate meetings
}

model DepartmentMember {
  departmentId String
  userId       String
  
  @@unique([departmentId, userId])  // User can only be in department once
}
```

---

## Migrations

### Migration Commands

```bash
# Create migration from schema changes
npm run prisma:migrate

# Apply migrations to database
npx prisma migrate deploy

# Reset database (dev only)
npm run db:reset

# Generate Prisma client
npm run prisma:generate
```

### Migration Workflow

```
1. Modify schema file(s)
        ↓
2. Run prisma migrate dev
        ↓
3. Review generated migration SQL
        ↓
4. Test migration locally
        ↓
5. Commit schema + migration files
        ↓
6. Deploy: prisma migrate deploy
```

### Migration Best Practices

| Practice | Description |
|----------|-------------|
| **Descriptive names** | `add_department_budget_fields` |
| **Small migrations** | One logical change per migration |
| **Review SQL** | Check generated SQL before applying |
| **Test rollback** | Ensure migrations can be reversed |
| **Seed after reset** | Always seed test data after reset |

### Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: {},
    create: {
      email: 'admin@local.test',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });

  // Create organisation profile
  await prisma.organisationProfile.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Acme Corporation',
      legalName: 'Acme Corporation Ltd',
      employeeCount: 500,
      createdById: admin.id,
    },
  });

  // Create departments
  const itDept = await prisma.department.upsert({
    where: { departmentCode: 'IT' },
    update: {},
    create: {
      name: 'Information Technology',
      departmentCode: 'IT',
      criticalityLevel: 'high',
      createdById: admin.id,
    },
  });

  // ... more seed data
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORGANISATION MODULE ERD                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │ OrganisationProfile│        │      User        │                          │
│  └────────┬─────────┘         └────────┬─────────┘                          │
│           │                            │                                     │
│           │                   ┌────────┼────────┬──────────┐                │
│           │                   │        │        │          │                │
│           ▼                   ▼        ▼        ▼          ▼                │
│  ┌──────────────────┐  ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐     │
│  │    Department    │◀─│DeptMember│ │KeyPers │ │SecChamp│ │ExecPos   │     │
│  └────────┬─────────┘  └──────────┘ └────────┘ └────────┘ └──────────┘     │
│           │                                                                  │
│     ┌─────┴─────┐                                                           │
│     │           │                                                           │
│     ▼           ▼                                                           │
│  ┌────────┐ ┌────────────┐                                                  │
│  │BusProc │ │ExtDependency│                                                  │
│  └────────┘ └────────────┘                                                  │
│                                                                              │
│  ┌──────────────────┐                                                       │
│  │SecurityCommittee │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                  │
│     ┌─────┴─────┐                                                           │
│     │           │                                                           │
│     ▼           ▼                                                           │
│  ┌────────┐ ┌──────────────┐                                                │
│  │Members │ │CommitteeMtg  │                                                │
│  └────────┘ └──────┬───────┘                                                │
│                    │                                                         │
│           ┌────────┼────────┐                                               │
│           │        │        │                                               │
│           ▼        ▼        ▼                                               │
│     ┌──────────┐ ┌────────┐ ┌──────────┐                                   │
│     │Attendance│ │Decision│ │ActionItem│                                   │
│     └──────────┘ └────────┘ └──────────┘                                   │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ InterestedParty  │  │   ContextIssue   │  │ApplicableFramework│          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  ProductService  │  │TechnologyPlatform│  │     Location     │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Query Patterns

### Include Related Data

```typescript
// Get department with relations
const department = await prisma.department.findUnique({
  where: { id },
  include: {
    departmentHead: {
      select: { id: true, name: true, email: true },
    },
    parent: true,
    children: true,
    members: {
      include: { user: true },
    },
    _count: {
      select: { members: true, businessProcesses: true },
    },
  },
});
```

### Filtering

```typescript
// Filter departments
const departments = await prisma.department.findMany({
  where: {
    isActive: true,
    criticalityLevel: { in: ['critical', 'high'] },
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { departmentCode: { contains: searchTerm, mode: 'insensitive' } },
    ],
  },
  orderBy: { name: 'asc' },
});
```

### Aggregations

```typescript
// Count by status
const statusCounts = await prisma.meetingActionItem.groupBy({
  by: ['status'],
  _count: { status: true },
});

// Sum budgets
const totalBudget = await prisma.department.aggregate({
  _sum: { budget: true },
  where: { isActive: true },
});
```
