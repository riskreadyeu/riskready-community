# Prisma Schema Naming Conventions

Reference for new models and fields. Existing code is not required to be migrated, but new code should follow these conventions.

## Soft Delete

Use a `status` enum with an `ARCHIVED` value rather than an `isActive` boolean.

```prisma
enum VendorStatus {
  PROSPECT
  ACTIVE
  MONITORING
  SUSPENDED
  ARCHIVED       // preferred soft-delete state
  OFFBOARDED
}

model Vendor {
  status VendorStatus @default(ACTIVE)
}
```

Existing models that use `isActive Boolean` (e.g., `User.isActive`) are acceptable and do not need migration.

## Owner Fields

Use `ownerId` as a foreign key to the `User` model. Avoid storing owner names as plain strings.

```prisma
// Preferred
ownerId   String?
owner     User?   @relation("AssetOwner", fields: [ownerId], references: [id])

// Avoid
documentOwner String?  // plain string name, not a FK
```

## Reference Codes

Use `{model}Code` or `{model}Id` format for human-readable reference numbers. Keep existing patterns, apply to new models.

| Model    | Field          | Format          |
|----------|----------------|-----------------|
| Vendor   | `vendorCode`   | `VND-001`       |
| Incident | `referenceNumber` | `INC-2026-0001` |
| Asset    | `assetTag`     | `AST-SRV-0001`  |
| Control  | `controlId`    | `A.5.1`         |

## Status Fields

Use enums for status fields, not booleans or free-text strings.

```prisma
// Preferred
enum IncidentStatus {
  DETECTED
  TRIAGED
  INVESTIGATING
  CLOSED
}

status IncidentStatus @default(DETECTED)

// Avoid
status  String @default("draft")   // free-text string
isActive Boolean @default(true)    // boolean soft-delete
```

## Timestamps

Every model must include `createdAt` and `updatedAt`. Use `createdById` / `updatedById` for audit trails.

```prisma
model Example {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  updatedById String?
  createdBy   User?    @relation("ExampleCreatedBy", fields: [createdById], references: [id])
  updatedBy   User?    @relation("ExampleUpdatedBy", fields: [updatedById], references: [id])
}
```

## Indexes

Always index foreign key columns and frequently-queried fields.

```prisma
model Example {
  organisationId String
  ownerId        String?
  status         ExampleStatus
  createdAt      DateTime @default(now())

  @@index([organisationId])
  @@index([ownerId])
  @@index([status])
  @@index([createdAt])
}
```

Composite indexes for common query patterns:

```prisma
@@index([organisationId, status])
@@index([organisationId, createdAt])
```

## Naming Style

- **Models**: PascalCase singular (`Vendor`, `AssetSoftware`)
- **Fields**: camelCase (`vendorCode`, `businessCriticality`)
- **Enums**: PascalCase name, SCREAMING_SNAKE_CASE values (`VendorStatus.ACTIVE`)
- **Relations**: camelCase, describe the relationship (`relationshipOwner`, `createdBy`)
- **Join tables**: combine both model names (`IncidentAsset`, `IncidentControl`)
