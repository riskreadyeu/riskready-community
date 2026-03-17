# Cross-Reference System

This document describes the framework cross-reference system that maps controls across ISO 27001, SOC 2, NIS2, and DORA compliance frameworks.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [Mapping Types](#3-mapping-types)
4. [Framework Matrix](#4-framework-matrix)
5. [Control Domains](#5-control-domains)
6. [Search and Lookup](#6-search-and-lookup)
7. [Service API](#7-service-api)
8. [Use Cases](#8-use-cases)

---

## 1. Overview

The Cross-Reference System enables organizations to:

- Map controls across multiple compliance frameworks
- Identify equivalent or related controls
- Reduce duplicate compliance efforts
- Support multi-framework audits
- Understand control coverage across regulations

### Supported Frameworks

| Framework | Full Name | Region | Focus |
|-----------|-----------|--------|-------|
| **ISO** | ISO 27001:2022 | International | Information Security Management |
| **SOC2** | SOC 2 Type II | USA | Trust Services Criteria |
| **NIS2** | NIS2 Directive | EU | Network and Information Security |
| **DORA** | Digital Operational Resilience Act | EU | Financial Sector ICT Resilience |

---

## 2. Data Model

### FrameworkCrossReference Entity

```prisma
model FrameworkCrossReference {
  id String @id @default(cuid())

  // Source framework and control
  sourceFramework ControlFramework
  sourceControlId String           // "A.5.1", "CC1.1", "Art.21.2(a)"
  sourceName      String?          // Control/requirement name

  // Target framework and control
  targetFramework ControlFramework
  targetControlId String           // Mapped control ID
  targetName      String?          // Target control name

  // Mapping details
  mappingType     MappingType @default(RELATED)
  mappingStrength Int?        @default(100)  // 0-100 percentage
  notes           String?     @db.Text

  @@unique([sourceFramework, sourceControlId, targetFramework, targetControlId])
  @@index([sourceFramework, sourceControlId])
  @@index([targetFramework, targetControlId])
  @@index([sourceFramework])
  @@index([targetFramework])
}
```

### ControlDomain Entity

```prisma
model ControlDomain {
  id          String  @id @default(cuid())
  name        String  @unique  // "Governance & Policy", "Access Control"
  description String? @db.Text
  sortOrder   Int     @default(0)

  // Control mappings per framework (comma-separated IDs)
  isoControls  String? @db.Text  // "A.5.1,A.5.2,A.5.3"
  soc2Criteria String? @db.Text  // "CC1.1,CC1.2,CC1.3"
  nis2Articles String? @db.Text  // "Art.20.1,Art.20.2"
  doraArticles String? @db.Text  // "Art.5,Art.6"

  // Control areas within this domain
  controlAreas Json? @default("[]")

  @@index([name])
  @@index([sortOrder])
}
```

### MappingType Enum

```typescript
enum MappingType {
  EQUIVALENT  // Direct 1:1 mapping
  RELATED     // Related but not identical
  PARTIAL     // Partial coverage
}
```

---

## 3. Mapping Types

### EQUIVALENT Mapping

Direct 1:1 correspondence between controls:

```
ISO A.5.1 (Information Security Policies)
    │
    │ EQUIVALENT
    │
    ▼
SOC2 CC1.1 (Control Environment - Principles)
```

- Same control objective
- Same implementation requirements
- Pass one, pass the other

### RELATED Mapping

Conceptually related but not identical:

```
ISO A.8.24 (Use of Cryptography)
    │
    │ RELATED
    │
    ▼
DORA Art.9 (ICT Security Policies)
```

- Similar control objectives
- Different scope or depth
- May need additional evidence

### PARTIAL Mapping

One control partially addresses another:

```
ISO A.8.1 (User Endpoint Devices)
    │
    │ PARTIAL
    │
    ▼
NIS2 Art.21.2(d) (Supply Chain Security)
```

- Control addresses part of requirement
- Additional controls needed for full coverage
- Used with mapping strength percentage

### Mapping Strength

```typescript
mappingStrength: number  // 0-100

// Examples:
100 = Full coverage (EQUIVALENT)
80  = Strong overlap, minor gaps
50  = Partial coverage
20  = Tangentially related
```

---

## 4. Framework Matrix

### Cross-Reference Matrix

```typescript
interface CrossReferenceMatrixCell {
  sourceFramework: ControlFramework;
  targetFramework: ControlFramework;
  count: number;
  mappings: Array<{
    sourceControlId: string;
    sourceName: string | null;
    targetControlId: string;
    targetName: string | null;
    mappingType: MappingType;
  }>;
}
```

### Matrix Visualization

```
┌───────────────────────────────────────────────────────────────┐
│               FRAMEWORK CROSS-REFERENCE MATRIX                 │
├───────────┬──────────┬──────────┬──────────┬──────────────────┤
│ From ↓ To→│   ISO    │   SOC2   │   NIS2   │      DORA        │
├───────────┼──────────┼──────────┼──────────┼──────────────────┤
│    ISO    │    -     │   187    │   156    │       142        │
├───────────┼──────────┼──────────┼──────────┼──────────────────┤
│   SOC2    │   187    │    -     │   134    │       128        │
├───────────┼──────────┼──────────┼──────────┼──────────────────┤
│   NIS2    │   156    │   134    │    -     │       168        │
├───────────┼──────────┼──────────┼──────────┼──────────────────┤
│   DORA    │   142    │   128    │   168    │        -         │
└───────────┴──────────┴──────────┴──────────┴──────────────────┘
```

### Getting the Matrix

```typescript
async getMatrix(): Promise<CrossReferenceMatrixCell[]> {
  const frameworks = ['ISO', 'SOC2', 'NIS2', 'DORA'];
  const matrix = [];

  for (const source of frameworks) {
    for (const target of frameworks) {
      if (source === target) continue;

      const mappings = await prisma.frameworkCrossReference.findMany({
        where: {
          sourceFramework: source,
          targetFramework: target,
        },
      });

      matrix.push({
        sourceFramework: source,
        targetFramework: target,
        count: mappings.length,
        mappings,
      });
    }
  }

  return matrix;
}
```

---

## 5. Control Domains

### Domain Structure

Domains group controls by functional area across all frameworks:

```typescript
interface DomainMatrixItem {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  controlAreas: any[];
  frameworks: {
    iso: string[];     // ["A.5.1", "A.5.2"]
    soc2: string[];    // ["CC1.1", "CC1.2"]
    nis2: string[];    // ["Art.20.1"]
    dora: string[];    // ["Art.5"]
  };
}
```

### Standard Domains

| Domain | Description | ISO | SOC2 | NIS2 | DORA |
|--------|-------------|-----|------|------|------|
| Governance & Policy | Organization-level controls | A.5.x | CC1.x | Art.20 | Art.5 |
| Access Control | Identity and access management | A.5.15-18, A.8.2-6 | CC6.x | Art.21.2(i) | Art.9 |
| Asset Management | Asset inventory and classification | A.5.9-14 | CC6.1 | Art.21.2(a) | Art.8 |
| Cryptography | Encryption and key management | A.8.24 | CC6.7 | Art.21.2(e) | Art.9 |
| Operations Security | Operational procedures | A.8.x | CC7.x | Art.21.2 | Art.10-11 |
| Communications | Network security | A.8.20-23 | CC6.6 | Art.21.2(d) | Art.9 |
| Incident Management | Incident response | A.5.24-28 | CC7.4-5 | Art.23 | Art.17-19 |
| Business Continuity | BCM and disaster recovery | A.5.29-30 | A1.x | Art.21.2(c) | Art.11-12 |
| Compliance | Legal and regulatory | A.5.31-36 | CC3.x | Art.32 | Art.46 |
| Supplier Management | Third-party security | A.5.19-23 | CC9.x | Art.21.2(d) | Art.28-30 |

### Domain Retrieval

```typescript
async getDomains(): Promise<DomainMatrixItem[]> {
  const domains = await prisma.controlDomain.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return domains.map(d => ({
    id: d.id,
    name: d.name,
    description: d.description,
    sortOrder: d.sortOrder,
    controlAreas: d.controlAreas || [],
    frameworks: {
      iso: parseCommaSeparated(d.isoControls),
      soc2: parseCommaSeparated(d.soc2Criteria),
      nis2: parseCommaSeparated(d.nis2Articles),
      dora: parseCommaSeparated(d.doraArticles),
    },
  }));
}
```

---

## 6. Search and Lookup

### Control Search

```typescript
interface CrossReferenceSearchResult {
  controlId: string;
  controlName: string | null;
  framework: ControlFramework;
  mappings: Array<{
    framework: ControlFramework;
    controlId: string;
    controlName: string | null;
    mappingType: MappingType;
  }>;
  existingControl?: {
    id: string;
    implementationStatus: string;
    applicable: boolean;
    capabilityCount: number;
  } | null;
}
```

### Search Implementation

```typescript
async search(query: string): Promise<CrossReferenceSearchResult[]> {
  if (!query || query.length < 2) return [];

  // Search source controls
  const sourceMatches = await prisma.frameworkCrossReference.findMany({
    where: {
      OR: [
        { sourceControlId: { contains: query, mode: 'insensitive' } },
        { sourceName: { contains: query, mode: 'insensitive' } },
      ],
    },
  });

  // Search target controls (reverse lookup)
  const targetMatches = await prisma.frameworkCrossReference.findMany({
    where: {
      OR: [
        { targetControlId: { contains: query, mode: 'insensitive' } },
        { targetName: { contains: query, mode: 'insensitive' } },
      ],
    },
  });

  // Group and deduplicate results
  const grouped = new Map<string, CrossReferenceSearchResult>();

  // Process source matches...
  // Process target matches (reverse lookup)...

  // Link to existing controls if available
  for (const result of grouped.values()) {
    if (result.framework === 'ISO') {
      const control = await findMatchingControl(result.controlId);
      if (control) result.existingControl = control;
    }
  }

  return Array.from(grouped.values());
}
```

### Get Control Cross-Reference

```typescript
async getControlCrossReference(framework: ControlFramework, controlId: string) {
  // Get outgoing mappings (where this control is source)
  const outgoing = await prisma.frameworkCrossReference.findMany({
    where: {
      sourceFramework: framework,
      sourceControlId: controlId,
    },
  });

  // Get incoming mappings (where this control is target)
  const incoming = await prisma.frameworkCrossReference.findMany({
    where: {
      targetFramework: framework,
      targetControlId: controlId,
    },
  });

  // Combine and deduplicate
  const allMappings = mergeAndDeduplicate(outgoing, incoming);

  return {
    controlId,
    framework,
    mappings: Array.from(allMappings.values()),
  };
}
```

---

## 7. Service API

### CrossReferenceService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getMatrix` | - | `MatrixCell[]` | Get full cross-reference matrix |
| `getByFramework` | `framework, params?` | `{ results, count }` | Get mappings from framework |
| `search` | `query: string` | `SearchResult[]` | Search across all frameworks |
| `getDomains` | - | `DomainMatrixItem[]` | Get domain matrix |
| `getControlCrossReference` | `framework, controlId` | `CrossReference` | Get specific control mappings |
| `getStats` | - | `Stats` | Get statistics |
| `createMapping` | `data` | `Mapping` | Create new mapping |
| `bulkCreateMappings` | `mappings[]` | `Result` | Bulk create mappings |
| `upsertDomain` | `data` | `Domain` | Create/update domain |

### Statistics Response

```typescript
interface CrossReferenceStats {
  totalMappings: number;
  frameworkCounts: Record<ControlFramework, number>;
  typeCounts: Record<MappingType, number>;
  domainCount: number;
}
```

### Create Mapping

```typescript
interface CreateMappingInput {
  sourceFramework: ControlFramework;
  sourceControlId: string;
  sourceName?: string;
  targetFramework: ControlFramework;
  targetControlId: string;
  targetName?: string;
  mappingType?: MappingType;  // Default: RELATED
  mappingStrength?: number;   // Default: 100
  notes?: string;
}
```

---

## 8. Use Cases

### Multi-Framework Compliance

```
Scenario: Organization needs ISO 27001 + SOC 2 + DORA compliance

1. Implement ISO 27001 controls as baseline
2. Use cross-reference to identify SOC 2 coverage
3. Fill gaps for SOC 2-specific requirements
4. Use cross-reference to identify DORA coverage
5. Fill gaps for DORA-specific requirements

Result: ~60% effort reduction vs implementing separately
```

### Audit Evidence Mapping

```
Scenario: Auditor requests evidence for SOC 2 CC6.1

1. Look up CC6.1 in cross-reference
2. Find equivalent ISO A.5.9 (Asset Inventory)
3. Retrieve evidence already collected for ISO
4. Map evidence to SOC 2 requirement

Result: Single evidence collection serves multiple frameworks
```

### Gap Analysis

```
Scenario: Adding NIS2 compliance to existing ISO program

1. Get all ISO controls currently implemented
2. Look up NIS2 equivalents via cross-reference
3. Identify NIS2 articles with no ISO mapping
4. Create remediation plan for gaps

Result: Focused effort on new requirements only
```

### Pivot View

```typescript
// Get all mappings from ISO framework perspective
const isoMappings = await crossRefService.getByFramework('ISO');

// Returns:
{
  results: [
    {
      controlId: "A.5.1",
      controlName: "Policies for information security",
      framework: "ISO",
      mappings: {
        ISO: [],
        SOC2: [{ controlId: "CC1.1", name: "...", mappingType: "EQUIVALENT" }],
        NIS2: [{ controlId: "Art.20", name: "...", mappingType: "RELATED" }],
        DORA: [{ controlId: "Art.5", name: "...", mappingType: "PARTIAL" }],
      }
    },
    // ... more controls
  ],
  count: 93
}
```

---

## Key Files

| File | Description |
|------|-------------|
| `prisma/schema/controls.prisma` | FrameworkCrossReference, ControlDomain models |
| `src/controls/services/cross-reference.service.ts` | Cross-reference service |
| `src/controls/controllers/cross-reference.controller.ts` | REST API endpoints |

---

## Related Documentation

- [01-control-system.md](01-control-system.md) - Control framework support
- [05-soa-system.md](05-soa-system.md) - Statement of Applicability
- [07-reporting-gap-analysis.md](07-reporting-gap-analysis.md) - Multi-framework gap reports
