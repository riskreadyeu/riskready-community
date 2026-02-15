import { PrismaClient, DocumentType, DocumentStatus, ClassificationLevel, ReviewFrequency, ApprovalLevel } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Source directory for ISO 27001 documents
const ISO_DOCS_PATH = '/path/to/riskready-community/.temp/ISO27001/iso-27001-policies-and-standards';

// Will be set dynamically
let ORGANISATION_ID: string;

async function getOrganisation(): Promise<string> {
  // Find the first organisation in the database (model is OrganisationProfile)
  const org = await prisma.organisationProfile.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!org) {
    throw new Error('No organisation found in database. Please run main seed first.');
  }

  console.log(`📍 Using organisation: ${org.name} (${org.id})`);
  return org.id;
}

// ============================================
// MARKDOWN PARSING UTILITIES
// ============================================

interface DocumentMetadata {
  id: string;
  title: string;
  version: string;
  classification: ClassificationLevel;
  owner: string;
  author: string;
  approvedBy: string;
  effectiveDate: Date | null;
  nextReviewDate: Date | null;
  reviewFrequency: ReviewFrequency;
  distribution: string[];
  parentId?: string;
}

interface ParsedDocument {
  metadata: DocumentMetadata;
  content: string;
  purpose: string;
  scope: string;
  definitions: Array<{ term: string; definition: string }>;
  isoControls: string[];
  relatedDocuments: Array<{ id: string; title: string }>;
  roles: Array<{ role: string; responsibilities: string[] }>;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.includes('[') || dateStr === '[Date]') return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function extractMetadataValue(content: string, key: string): string {
  const patterns = [
    new RegExp(`\\*\\*${key}\\*\\*:\\s*(.+?)(?:\\s*\\||\\n|$)`, 'i'),
    new RegExp(`\\*\\*${key}\\*\\*\\s*\\|\\s*(.+?)\\s*\\|`, 'i'),
    new RegExp(`${key}:\\s*(.+?)(?:\\n|$)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\*\*/g, '');
    }
  }
  return '';
}

function extractSection(content: string, sectionName: string): string {
  const patterns = [
    new RegExp(`##\\s*\\d*\\.?\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i'),
    new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function extractDefinitions(content: string): Array<{ term: string; definition: string }> {
  const definitions: Array<{ term: string; definition: string }> = [];
  const section = extractSection(content, 'Definitions');

  if (!section) return definitions;

  // Parse markdown table
  const tableMatch = section.match(/\|.*\|[\s\S]*?\|/g);
  if (tableMatch) {
    const lines = section.split('\n').filter(line => line.includes('|'));
    for (const line of lines) {
      // Skip header and separator rows
      if (line.includes('Term') || line.includes('Definition') || line.match(/^\|[\s-:]+\|$/)) continue;

      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        const term = cells[0].replace(/\*\*/g, '').trim();
        const definition = cells[1].trim();
        if (term && definition && term !== 'Term') {
          definitions.push({ term, definition });
        }
      }
    }
  }

  return definitions;
}

function extractISOControls(content: string): string[] {
  const controls: string[] = [];
  const section = extractSection(content, 'ISO 27001');

  if (!section) {
    // Try alternate pattern
    const match = content.match(/ISO[_\s]?27001[_\s]?Controls[_\s]?Addressed[\s\S]*?(?=##|$)/i);
    if (match) {
      const controlMatches = match[0].match(/\b(\d+\.\d+)\b/g);
      if (controlMatches) {
        controls.push(...controlMatches);
      }
    }
  } else {
    const controlMatches = section.match(/\b(\d+\.\d+)\b/g);
    if (controlMatches) {
      controls.push(...controlMatches);
    }
  }

  // Also check for controls in metadata
  const metaMatch = content.match(/ISO_27001_Controls["']?\s*[:=]\s*["']?([^"'\n]+)/i);
  if (metaMatch) {
    const additionalControls = metaMatch[1].match(/\d+\.\d+/g);
    if (additionalControls) {
      controls.push(...additionalControls);
    }
  }

  return [...new Set(controls)]; // Remove duplicates
}

function extractRelatedDocuments(content: string): Array<{ id: string; title: string }> {
  const docs: Array<{ id: string; title: string }> = [];

  // Match patterns like [POL-001: Title] or POL-001 or STD-001-01
  const matches = content.matchAll(/\[?(POL|STD|PRO)-(\d{3})(?:-(\d{2}))?[:\s]*([^\]|\n]*)\]?/gi);

  for (const match of matches) {
    const type = match[1].toUpperCase();
    const num = match[2];
    const sub = match[3] || '';
    const title = match[4]?.trim() || '';

    const id = sub ? `${type}-${num}-${sub}` : `${type}-${num}`;
    docs.push({ id, title });
  }

  return docs;
}

function extractRoles(content: string): Array<{ role: string; responsibilities: string[] }> {
  const roles: Array<{ role: string; responsibilities: string[] }> = [];
  const section = extractSection(content, 'Roles and Responsibilities');

  if (!section) return roles;

  // Look for role headings and their bullet points
  const roleMatches = section.matchAll(/###\s*[\d.]*\s*(.+?)\s*\n([\s\S]*?)(?=###|$)/g);

  for (const match of roleMatches) {
    const role = match[1].replace(/\*\*/g, '').trim();
    const respSection = match[2];

    // Extract bullet points
    const responsibilities = respSection
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[\s-*]+/, '').trim())
      .filter(r => r.length > 0);

    if (role && responsibilities.length > 0) {
      roles.push({ role, responsibilities });
    }
  }

  // Also try to extract from tables
  const tableMatch = section.match(/\|.*Role.*\|[\s\S]*?(?=\n\n|$)/i);
  if (tableMatch && roles.length === 0) {
    const lines = tableMatch[0].split('\n').filter(line => line.includes('|'));
    for (const line of lines) {
      if (line.includes('Role') || line.match(/^\|[\s-:]+\|$/)) continue;
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        const role = cells[0].replace(/\*\*/g, '').trim();
        const resp = cells[1].trim();
        if (role && resp) {
          roles.push({ role, responsibilities: [resp] });
        }
      }
    }
  }

  return roles;
}

function determineDocumentType(filename: string): DocumentType {
  if (filename.startsWith('POL-')) return 'POLICY';
  if (filename.startsWith('STD-')) return 'STANDARD';
  if (filename.startsWith('PRO-')) return 'PROCEDURE';
  return 'POLICY';
}

function determineApprovalLevel(docType: DocumentType): ApprovalLevel {
  switch (docType) {
    case 'POLICY': return 'EXECUTIVE';
    case 'STANDARD': return 'SENIOR_MANAGEMENT';
    case 'PROCEDURE': return 'MANAGEMENT';
    default: return 'MANAGEMENT';
  }
}

function parseDocument(filePath: string, filename: string): ParsedDocument {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract document ID from filename
  const idMatch = filename.match(/(POL|STD|PRO)-(\d{3})(?:-(\d{2}))?/i);
  const docId = idMatch ? idMatch[0].toUpperCase() : filename.replace('.md', '');

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+?)(?:\n|$)/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace('.md', '');

  // Extract metadata
  const metadata: DocumentMetadata = {
    id: docId,
    title: title,
    version: extractMetadataValue(content, 'Version') || '1.0',
    classification: (extractMetadataValue(content, 'Classification')?.toUpperCase() as ClassificationLevel) || 'INTERNAL',
    owner: extractMetadataValue(content, 'Document Owner') || extractMetadataValue(content, 'Owner') || 'Information Security Team',
    author: extractMetadataValue(content, 'Author') || 'Information Security Team',
    approvedBy: extractMetadataValue(content, 'Approved by') || extractMetadataValue(content, 'Approved By') || '',
    effectiveDate: parseDate(extractMetadataValue(content, 'Effective Date')),
    nextReviewDate: parseDate(extractMetadataValue(content, 'Next Review Date')),
    reviewFrequency: 'ANNUAL',
    distribution: ['All employees'],
  };

  // Determine parent document for standards and procedures
  if (docId.startsWith('STD-')) {
    const policyNum = docId.match(/STD-(\d{3})/)?.[1];
    if (policyNum) {
      metadata.parentId = `POL-${policyNum}`;
    }
  } else if (docId.startsWith('PRO-')) {
    const policyNum = docId.match(/PRO-(\d{3})/)?.[1];
    if (policyNum) {
      metadata.parentId = `POL-${policyNum}`;
    }
  }

  return {
    metadata,
    content,
    purpose: extractSection(content, 'Purpose'),
    scope: extractSection(content, 'Scope'),
    definitions: extractDefinitions(content),
    isoControls: extractISOControls(content),
    relatedDocuments: extractRelatedDocuments(content),
    roles: extractRoles(content),
  };
}

// ============================================
// DATABASE SEEDING
// ============================================

async function seedPolicies() {
  // Get organisation ID first
  ORGANISATION_ID = await getOrganisation();

  console.log('🔍 Reading policy files...');

  const policiesDir = path.join(ISO_DOCS_PATH, 'policies');
  const standardsDir = path.join(ISO_DOCS_PATH, 'standards_populated');
  const proceduresDir = path.join(ISO_DOCS_PATH, 'procedures');

  const allDocs: ParsedDocument[] = [];

  // Parse policies (use IMPROVED versions where available)
  const policyFiles = fs.readdirSync(policiesDir)
    .filter(f => f.endsWith('-IMPROVED.md') || (f.endsWith('.md') && !f.includes('IMPROVED') && !f.includes('STRUCTURED')));

  // Deduplicate - prefer IMPROVED versions
  const policyMap = new Map<string, string>();
  for (const file of policyFiles) {
    const baseId = file.match(/(POL-\d{3})/)?.[1];
    if (baseId) {
      if (file.includes('IMPROVED') || !policyMap.has(baseId)) {
        policyMap.set(baseId, file);
      }
    }
  }

  for (const [_, filename] of policyMap) {
    const filePath = path.join(policiesDir, filename);
    console.log(`  📄 Parsing ${filename}`);
    allDocs.push(parseDocument(filePath, filename));
  }

  // Parse standards (use IMPROVED versions where available)
  const standardFiles = fs.readdirSync(standardsDir).filter(f => f.endsWith('.md'));
  const standardMap = new Map<string, string>();
  for (const file of standardFiles) {
    const baseId = file.match(/(STD-\d{3}-\d{2})/)?.[1];
    if (baseId) {
      if (file.includes('IMPROVED') || !standardMap.has(baseId)) {
        standardMap.set(baseId, file);
      }
    }
  }

  for (const [_, filename] of standardMap) {
    const filePath = path.join(standardsDir, filename);
    console.log(`  📄 Parsing ${filename}`);
    allDocs.push(parseDocument(filePath, filename));
  }

  // Parse procedures
  const procedureFiles = fs.readdirSync(proceduresDir).filter(f => f.endsWith('.md'));
  for (const filename of procedureFiles) {
    const filePath = path.join(proceduresDir, filename);
    console.log(`  📄 Parsing ${filename}`);
    allDocs.push(parseDocument(filePath, filename));
  }

  console.log(`\n📊 Parsed ${allDocs.length} documents total`);
  console.log(`   - ${allDocs.filter(d => d.metadata.id.startsWith('POL')).length} policies`);
  console.log(`   - ${allDocs.filter(d => d.metadata.id.startsWith('STD')).length} standards`);
  console.log(`   - ${allDocs.filter(d => d.metadata.id.startsWith('PRO')).length} procedures`);

  // Create documents in database
  console.log('\n💾 Creating documents in database...');

  // First pass: Create all policy documents (no parents)
  const createdDocs = new Map<string, string>(); // docId -> database id

  // Sort: policies first, then standards, then procedures
  const sortedDocs = allDocs.sort((a, b) => {
    const order = { 'POL': 0, 'STD': 1, 'PRO': 2 };
    const aType = a.metadata.id.substring(0, 3) as keyof typeof order;
    const bType = b.metadata.id.substring(0, 3) as keyof typeof order;
    return (order[aType] || 3) - (order[bType] || 3);
  });

  for (const doc of sortedDocs) {
    const docType = determineDocumentType(doc.metadata.id);

    // Check if parent exists
    let parentDbId: string | undefined;
    if (doc.metadata.parentId) {
      parentDbId = createdDocs.get(doc.metadata.parentId);
    }

    try {
      // Check if document already exists
      const existing = await prisma.policyDocument.findFirst({
        where: {
          documentId: doc.metadata.id,
          organisationId: ORGANISATION_ID,
        },
      });

      if (existing) {
        console.log(`  ⏭️  Skipping ${doc.metadata.id} (already exists)`);
        createdDocs.set(doc.metadata.id, existing.id);
        continue;
      }

      const created = await prisma.policyDocument.create({
        data: {
          documentId: doc.metadata.id,
          title: doc.metadata.title,
          shortTitle: doc.metadata.id,
          documentType: docType,
          classification: doc.metadata.classification || 'INTERNAL',
          distribution: doc.metadata.distribution,
          purpose: doc.purpose || 'See document content',
          scope: doc.scope || 'See document content',
          content: doc.content,
          version: doc.metadata.version,
          majorVersion: parseInt(doc.metadata.version.split('.')[0]) || 1,
          minorVersion: parseInt(doc.metadata.version.split('.')[1]) || 0,
          status: 'PUBLISHED',
          effectiveDate: doc.metadata.effectiveDate || new Date(),
          documentOwner: doc.metadata.owner,
          author: doc.metadata.author,
          approvalLevel: determineApprovalLevel(docType),
          approvedBy: doc.metadata.approvedBy || undefined,
          approvalDate: doc.metadata.effectiveDate || undefined,
          reviewFrequency: doc.metadata.reviewFrequency,
          nextReviewDate: doc.metadata.nextReviewDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          tags: ['ISO 27001', docType.toLowerCase()],
          keywords: doc.isoControls.map(c => `control-${c}`),
          requiresAcknowledgment: docType === 'POLICY',
          acknowledgmentDeadline: 30,
          organisationId: ORGANISATION_ID,
          parentDocumentId: parentDbId,
        },
      });

      createdDocs.set(doc.metadata.id, created.id);
      console.log(`  ✅ Created ${doc.metadata.id}: ${doc.metadata.title}`);

      // Create definitions
      if (doc.definitions.length > 0) {
        for (let i = 0; i < doc.definitions.length; i++) {
          const def = doc.definitions[i];
          try {
            await prisma.documentDefinition.create({
              data: {
                documentId: created.id,
                term: def.term,
                definition: def.definition,
                order: i,
              },
            });
          } catch (e) {
            // Skip duplicate definitions
          }
        }
        console.log(`     📖 Added ${doc.definitions.length} definitions`);
      }

      // Create roles
      if (doc.roles.length > 0) {
        for (let i = 0; i < doc.roles.length; i++) {
          const role = doc.roles[i];
          await prisma.documentRole.create({
            data: {
              documentId: created.id,
              role: role.role,
              responsibilities: role.responsibilities,
              order: i,
            },
          });
        }
        console.log(`     👥 Added ${doc.roles.length} roles`);
      }

    } catch (error) {
      console.error(`  ❌ Error creating ${doc.metadata.id}:`, error);
    }
  }

  // Second pass: Create control mappings
  console.log('\n🔗 Creating control mappings...');

  for (const doc of sortedDocs) {
    const dbId = createdDocs.get(doc.metadata.id);
    if (!dbId || doc.isoControls.length === 0) continue;

    for (const controlNum of doc.isoControls) {
      // Find control by control ID pattern (e.g., "5.1" -> look for control with similar ID)
      const control = await prisma.control.findFirst({
        where: {
          OR: [
            { controlId: { contains: controlNum } },
            { name: { contains: `${controlNum}` } },
          ],
          organisationId: ORGANISATION_ID,
        },
      });

      if (control) {
        try {
          await prisma.documentControlMapping.create({
            data: {
              documentId: dbId,
              controlId: control.id,
              mappingType: 'IMPLEMENTS',
              coverage: 'FULL',
              notes: `Addresses ISO 27001:2022 Control ${controlNum}`,
              evidenceRequired: true,
            },
          });
        } catch (e) {
          // Skip duplicates
        }
      }
    }
  }

  console.log('\n✨ ISO 27001 policy seeding complete!');
  console.log(`   Created ${createdDocs.size} documents with structured data`);
}

// Run the seed
seedPolicies()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
