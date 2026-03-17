# Evidence Module - Migration Guide

This guide covers migrating legacy evidence data from existing tables to the centralized Evidence module.

## Overview

Before the Evidence module, evidence was stored in three separate locations:

| Legacy Table | Module | Purpose |
|--------------|--------|---------|
| `IncidentEvidence` | Incidents | Forensic evidence for incident investigations |
| `DocumentAttachment` | Policies | Attachments to policy documents |
| `VendorDocument` | Supply Chain | Vendor certifications and documents |

The migration consolidates all this data into the central `Evidence` table while maintaining links to the original entities via junction tables.

## Migration Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  IncidentEvidence   │     │    Evidence      │     │  EvidenceIncident   │
│                     │ --> │  (Central Store) │ <-- │  (Junction Table)   │
│  - title            │     │                  │     │  - evidenceId       │
│  - fileUrl          │     │  - evidenceRef   │     │  - incidentId       │
│  - hashSha256       │     │  - title         │     │  - linkType         │
│  - incidentId       │     │  - fileUrl       │     └─────────────────────┘
└─────────────────────┘     │  - hashSha256    │
                            │  - status        │
┌─────────────────────┐     │  - ...           │     ┌─────────────────────┐
│ DocumentAttachment  │     │                  │     │   EvidencePolicy    │
│                     │ --> │                  │ <-- │  (Junction Table)   │
│  - filename         │     │                  │     │  - evidenceId       │
│  - documentId       │     │                  │     │  - policyId         │
└─────────────────────┘     │                  │     └─────────────────────┘
                            │                  │
┌─────────────────────┐     │                  │     ┌─────────────────────┐
│   VendorDocument    │     │                  │     │   EvidenceVendor    │
│                     │ --> │                  │ <-- │  (Junction Table)   │
│  - title            │     │                  │     │  - evidenceId       │
│  - vendorId         │     │                  │     │  - vendorId         │
└─────────────────────┘     └──────────────────┘     └─────────────────────┘
```

## Pre-Migration Checklist

Before running the migration:

- [ ] **Backup Database**: Create a full database backup
- [ ] **Review Legacy Data**: Check for data quality issues
- [ ] **Verify Permissions**: Ensure migration user has write access
- [ ] **Plan Downtime**: Schedule maintenance window if needed
- [ ] **Test in Staging**: Run migration in non-production first

## Migration Endpoints

The migration service exposes REST API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/evidence-migration/run` | POST | Run full migration |
| `/api/evidence-migration/incident-evidence` | POST | Migrate IncidentEvidence only |
| `/api/evidence-migration/document-attachments` | POST | Migrate DocumentAttachment only |
| `/api/evidence-migration/vendor-documents` | POST | Migrate VendorDocument only |

All endpoints accept a `dryRun` query parameter (default: `true`).

## Running the Migration

### Step 1: Dry Run

Always start with a dry run to see what will be migrated:

```bash
# Full migration dry run
curl -X POST "http://localhost:3001/api/evidence-migration/run?dryRun=true" \
  -H "Authorization: Bearer <token>"
```

**Response:**

```json
{
  "incidentEvidence": {
    "migratedCount": 25,
    "skippedCount": 0,
    "errors": []
  },
  "documentAttachments": {
    "migratedCount": 150,
    "skippedCount": 5,
    "errors": []
  },
  "vendorDocuments": {
    "migratedCount": 80,
    "skippedCount": 2,
    "errors": []
  }
}
```

### Step 2: Review Results

Check the dry run results:

- **migratedCount**: Records that will be migrated
- **skippedCount**: Records already migrated (idempotent)
- **errors**: Any issues encountered

### Step 3: Run Actual Migration

Once satisfied with dry run results:

```bash
# Full migration - ACTUAL
curl -X POST "http://localhost:3001/api/evidence-migration/run?dryRun=false" \
  -H "Authorization: Bearer <token>"
```

### Step 4: Verify Migration

After migration:

1. Check evidence counts in the repository
2. Verify links are correctly created
3. Spot-check a few records for data accuracy
4. Test searching and filtering

## Migration Details by Table

### IncidentEvidence Migration

**Source Fields → Target Fields:**

| IncidentEvidence | Evidence | Notes |
|------------------|----------|-------|
| `title` | `title` | Direct copy |
| `description` | `description` | Direct copy |
| `evidenceType` | `evidenceType` | Mapped (see below) |
| `fileName` | `fileName`, `originalFileName` | Both set |
| `fileUrl` | `fileUrl` | Direct copy |
| `fileSizeBytes` | `fileSizeBytes` | Direct copy |
| `mimeType` | `mimeType` | Direct copy |
| `hashSha256` | `hashSha256` | Direct copy |
| `hashMd5` | `hashMd5` | Direct copy |
| `isForensicallySound` | `isForensicallySound` | Direct copy |
| `chainOfCustodyNotes` | `chainOfCustodyNotes` | Direct copy |
| `collectedAt` | `collectedAt` | Direct copy |
| `collectedById` | `collectedById` | Direct copy |
| `storageLocation` | `storagePath` | Direct copy |
| `retainUntil` | `retainUntil` | Direct copy |
| `createdById` | `createdById` | Direct copy |
| - | `status` | Set to `APPROVED` |
| - | `classification` | Set to `INTERNAL` |
| - | `sourceType` | Set to `MANUAL_UPLOAD` |

**Evidence Type Mapping:**

| IncidentEvidenceType | EvidenceType |
|----------------------|--------------|
| `DOCUMENT` | `DOCUMENT` |
| `LOG_FILE` | `LOG` |
| `SCREENSHOT` | `SCREENSHOT` |
| `EMAIL` | `EMAIL` |
| `NETWORK_CAPTURE` | `NETWORK_CAPTURE` |
| `MEMORY_DUMP` | `MEMORY_DUMP` |
| `DISK_IMAGE` | `DISK_IMAGE` |
| `MALWARE_SAMPLE` | `MALWARE_SAMPLE` |
| `VIDEO` | `VIDEO` |
| `AUDIO` | `AUDIO` |
| `OTHER` | `OTHER` |

**Junction Table Entry:**

```json
{
  "evidenceId": "<new_evidence_id>",
  "incidentId": "<original_incident_id>",
  "linkType": "Migrated",
  "notes": "Migrated from IncidentEvidence ID: <original_id>"
}
```

---

### DocumentAttachment Migration

**Source Fields → Target Fields:**

| DocumentAttachment | Evidence | Notes |
|--------------------|----------|-------|
| `originalFilename` | `title` | Used as title |
| `description` | `description` | Direct copy |
| - | `evidenceType` | Mapped from `attachmentType` |
| `filename` | `fileName` | Direct copy |
| `originalFilename` | `originalFileName` | Direct copy |
| `storagePath` | `fileUrl`, `storagePath` | Both set |
| `size` | `fileSizeBytes` | Direct copy |
| `mimeType` | `mimeType` | Direct copy |
| `checksum` | `hashSha256` | Assumed SHA256 |
| `isEncrypted` | `isEncrypted` | Direct copy |
| `storageProvider` | `storageProvider` | Direct copy |
| `uploadedAt` | `collectedAt` | Direct copy |
| `uploadedById` | `collectedById`, `createdById` | Both set |
| - | `status` | Set to `APPROVED` |
| document.classification | `classification` | Inherited from policy |
| - | `sourceType` | Set to `MANUAL_UPLOAD` |

**Attachment Type Mapping:**

| AttachmentType | EvidenceType |
|----------------|--------------|
| `SUPPORTING` | `DOCUMENT` |
| `APPENDIX` | `DOCUMENT` |
| `TEMPLATE` | `DOCUMENT` |
| `EVIDENCE` | `DOCUMENT` |
| `SIGNATURE` | `APPROVAL_RECORD` |
| `OTHER` | `OTHER` |

**Junction Table Entry:**

```json
{
  "evidenceId": "<new_evidence_id>",
  "policyId": "<original_document_id>",
  "linkType": "Attachment",
  "notes": "Migrated from DocumentAttachment ID: <original_id>"
}
```

---

### VendorDocument Migration

**Source Fields → Target Fields:**

| VendorDocument | Evidence | Notes |
|----------------|----------|-------|
| `title` | `title` | Direct copy |
| `description` | `description` | Direct copy |
| `documentType` | `evidenceType` | Mapped (see below) |
| `fileName` | `fileName`, `originalFileName` | Both set |
| `fileUrl` | `fileUrl` | Direct copy |
| `fileSize` | `fileSizeBytes` | Direct copy |
| `mimeType` | `mimeType` | Direct copy |
| `issueDate` | `validFrom`, `collectedAt` | Both set |
| `expiryDate` | `validUntil` | Direct copy |
| `isVerified` | - | Determines status |
| `verifiedDate` | `reviewedAt` | Direct copy |
| `verifiedById` | `reviewedById` | Direct copy |
| `notes` | `reviewNotes` | Direct copy |
| `createdById` | `createdById`, `collectedById` | Both set |
| - | `status` | `APPROVED` if verified, else `PENDING` |
| - | `classification` | Set to `INTERNAL` |
| - | `sourceType` | Set to `VENDOR_PROVIDED` |

**Document Type Mapping:**

| VendorDocumentType | EvidenceType |
|--------------------|--------------|
| `CERTIFICATE` | `CERTIFICATE` |
| `SOC_REPORT` | `AUDIT_REPORT` |
| `POLICY` | `POLICY` |
| `CONTRACT` | `DOCUMENT` |
| `EVIDENCE` | `DOCUMENT` |
| `ASSESSMENT` | `ASSESSMENT_RESULT` |
| `OTHER` | `OTHER` |

**Junction Table Entry:**

```json
{
  "evidenceId": "<new_evidence_id>",
  "vendorId": "<original_vendor_id>",
  "linkType": "Vendor Document",
  "notes": "Migrated from VendorDocument ID: <original_id>"
}
```

---

## Idempotency

The migration is idempotent - running it multiple times is safe:

1. Before creating evidence, the service checks if a junction table entry exists with the migration note
2. If found, the record is skipped
3. This allows re-running migration after fixing errors

**Skip Detection:**

```typescript
// Check for existing migration
const existingLink = await prisma.evidenceIncident.findFirst({
  where: {
    incidentId: legacy.incidentId,
    notes: `Migrated from IncidentEvidence ID: ${legacy.id}`,
  },
});

if (existingLink) {
  // Skip - already migrated
  skippedCount++;
  continue;
}
```

## Handling Errors

### Common Errors

**Missing User Reference:**
```json
{
  "id": "abc123",
  "type": "IncidentEvidence",
  "error": "Foreign key constraint failed: collectedById"
}
```
*Solution*: The original collector user may have been deleted. Migration will use `createdById` as fallback.

**Invalid Evidence Type:**
```json
{
  "id": "def456",
  "type": "VendorDocument",
  "error": "Invalid enum value for evidenceType"
}
```
*Solution*: Check the type mapping. Unknown types default to `OTHER`.

**Duplicate Evidence:**
```json
{
  "id": "ghi789",
  "type": "DocumentAttachment",
  "error": "Unique constraint failed: evidenceRef"
}
```
*Solution*: This shouldn't happen with auto-generated refs. Check for race conditions.

### Error Recovery

1. Review the errors array in the response
2. Fix underlying data issues
3. Re-run migration (idempotent - will skip already migrated)

## Post-Migration Steps

### 1. Verify Data Integrity

```sql
-- Check evidence counts
SELECT COUNT(*) FROM "Evidence";

-- Check links are created
SELECT COUNT(*) FROM "EvidenceIncident";
SELECT COUNT(*) FROM "EvidencePolicy";
SELECT COUNT(*) FROM "EvidenceVendor";

-- Verify no orphaned links
SELECT ei.* FROM "EvidenceIncident" ei
LEFT JOIN "Evidence" e ON ei."evidenceId" = e.id
WHERE e.id IS NULL;
```

### 2. Update Application Code

After successful migration, update code that references legacy tables:

```typescript
// Before
const evidence = await prisma.incidentEvidence.findMany({
  where: { incidentId },
});

// After
const evidence = await prisma.evidenceIncident.findMany({
  where: { incidentId },
  include: { evidence: true },
});
```

### 3. Deprecate Legacy Tables

Once migration is verified:

1. Comment out legacy models in Prisma schema (already done)
2. Create migration to drop legacy tables (optional, can keep for rollback)
3. Remove legacy table references from code

### 4. Update UI Components

Update any UI components that directly queried legacy tables to use the Evidence module API.

## Rollback Plan

If migration needs to be rolled back:

1. **Data is preserved**: Legacy tables are not modified during migration
2. **Delete migrated evidence**: 

```sql
-- Delete evidence created by migration
DELETE FROM "Evidence" 
WHERE id IN (
  SELECT "evidenceId" FROM "EvidenceIncident" 
  WHERE notes LIKE 'Migrated from%'
);
```

3. **Uncomment legacy models**: Restore models in Prisma schema
4. **Regenerate Prisma client**: `npx prisma generate`

## Programmatic Migration

For custom migration scripts:

```typescript
import { EvidenceMigrationService } from '../services/evidence-migration.service';

// Inject service
const migrationService = new EvidenceMigrationService(prisma, evidenceService, linkService);

// Run specific migration
const result = await migrationService.migrateIncidentEvidence(false); // dryRun = false

console.log(`Migrated: ${result.migratedCount}`);
console.log(`Skipped: ${result.skippedCount}`);
console.log(`Errors: ${result.errors.length}`);
```

## Monitoring Migration

For large migrations, monitor progress:

```typescript
// The service logs progress
this.logger.log(`Migrating IncidentEvidence (dryRun: ${dryRun})...`);
this.logger.verbose(`Migrated IncidentEvidence ${legacy.id} to Evidence ${created.id}`);
this.logger.log(`IncidentEvidence migration finished. Migrated: ${count}, Errors: ${errors.length}`);
```

Check server logs for detailed progress.

---

## FAQ

**Q: Will migration affect existing evidence in the new module?**
A: No, migration only adds new evidence. Existing evidence is untouched.

**Q: Can I run migration multiple times?**
A: Yes, migration is idempotent. Already-migrated records are skipped.

**Q: What happens to the legacy tables?**
A: They remain unchanged. You can keep them for reference or drop them later.

**Q: How long does migration take?**
A: Depends on data volume. Typically:
- 1,000 records: ~30 seconds
- 10,000 records: ~5 minutes
- 100,000 records: ~30-60 minutes

**Q: Can I migrate only specific records?**
A: Currently, migration is all-or-nothing per table. For selective migration, use the programmatic API.







