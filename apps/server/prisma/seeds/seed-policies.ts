import { PrismaClient, DocumentType, DocumentStatus, ClassificationLevel, ReviewFrequency, ApprovalLevel, ChangeType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Path to the policy documents
const DOCS_BASE_PATH = path.join(__dirname, '../../../../_temp/ISO27001/iso-27001-policies-and-standards');

interface ParsedDocument {
  documentId: string;
  title: string;
  documentType: DocumentType;
  classification: ClassificationLevel;
  distribution: string[];
  purpose: string;
  scope: string;
  content: string;
  summary?: string;
  documentOwner: string;
  author: string;
  approvalLevel: ApprovalLevel;
  reviewFrequency: ReviewFrequency;
  effectiveDate?: Date;
  nextReviewDate?: Date;
  tags: string[];
  keywords: string[];
  parentDocumentId?: string;
}

function parseMarkdownDocument(filePath: string, fileName: string): ParsedDocument | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract document ID from filename
    const docIdMatch = fileName.match(/(POL|STD|PRO)-(\d{3})(-\d{2})?/);
    if (!docIdMatch) {
      console.log(`Skipping file without valid ID pattern: ${fileName}`);
      return null;
    }
    
    const prefix = docIdMatch[1];
    const mainNum = docIdMatch[2];
    const subNum = docIdMatch[3] || '';
    const documentId = `${prefix}-${mainNum}${subNum}`;
    
    // Determine document type based on prefix
    let documentType: DocumentType;
    let approvalLevel: ApprovalLevel;
    
    switch (prefix) {
      case 'POL':
        documentType = DocumentType.POLICY;
        approvalLevel = ApprovalLevel.EXECUTIVE;
        break;
      case 'STD':
        documentType = DocumentType.STANDARD;
        approvalLevel = ApprovalLevel.SENIOR_MANAGEMENT;
        break;
      case 'PRO':
        documentType = DocumentType.PROCEDURE;
        approvalLevel = ApprovalLevel.MANAGEMENT;
        break;
      default:
        documentType = DocumentType.GUIDELINE;
        approvalLevel = ApprovalLevel.MANAGEMENT;
    }
    
    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : fileName;
    
    // Extract classification
    const classMatch = content.match(/\*\*Classification\*\*[:\s|]+([A-Za-z]+)/i);
    let classification: ClassificationLevel = ClassificationLevel.INTERNAL;
    if (classMatch) {
      const classStr = classMatch[1].toUpperCase();
      if (classStr === 'PUBLIC') classification = ClassificationLevel.PUBLIC;
      else if (classStr === 'CONFIDENTIAL') classification = ClassificationLevel.CONFIDENTIAL;
      else if (classStr === 'RESTRICTED') classification = ClassificationLevel.RESTRICTED;
    }
    
    // Extract document owner
    const ownerMatch = content.match(/\*\*Document Owner\*\*[:\s|]+(.+?)[\n|]/i);
    const documentOwner = ownerMatch ? ownerMatch[1].trim() : 'Information Security Team';
    
    // Extract author
    const authorMatch = content.match(/\*\*Author\*\*[:\s|]+(.+?)[\n|]/i);
    const author = authorMatch ? authorMatch[1].trim().replace('[ORGANIZATION]', 'Organization') : 'Information Security Team';
    
    // Extract distribution
    const distMatch = content.match(/\*\*Distribution\*\*[:\s|]+(.+?)[\n|]/i);
    const distribution = distMatch 
      ? distMatch[1].split(/[,;]/).map(d => d.trim()).filter(Boolean)
      : ['All employees'];
    
    // Extract effective date
    const effectiveDateMatch = content.match(/\*\*Effective Date\*\*[:\s|]+(\d{4}-\d{2}-\d{2})/i);
    const effectiveDate = effectiveDateMatch ? new Date(effectiveDateMatch[1]) : undefined;
    
    // Extract next review date
    const nextReviewMatch = content.match(/\*\*Next Review Date\*\*[:\s|]+(\d{4}-\d{2}-\d{2})/i);
    const nextReviewDate = nextReviewMatch ? new Date(nextReviewMatch[1]) : undefined;
    
    // Extract review frequency
    const reviewFreqMatch = content.match(/\*\*Review Frequency\*\*[:\s|]+(.+?)[\n|]/i);
    let reviewFrequency: ReviewFrequency = ReviewFrequency.ANNUAL;
    if (reviewFreqMatch) {
      const freqStr = reviewFreqMatch[1].toLowerCase();
      if (freqStr.includes('quarterly')) reviewFrequency = ReviewFrequency.QUARTERLY;
      else if (freqStr.includes('semi') || freqStr.includes('bi-annual')) reviewFrequency = ReviewFrequency.SEMI_ANNUAL;
      else if (freqStr.includes('monthly')) reviewFrequency = ReviewFrequency.MONTHLY;
    }
    
    // Extract purpose section
    let purpose = '';
    const purposeMatch = content.match(/##\s*\d*\.?\s*Purpose\s*\n+([\s\S]*?)(?=\n##|\n---)/i);
    if (purposeMatch) {
      purpose = purposeMatch[1].trim().substring(0, 2000);
    }
    
    // Extract scope section
    let scope = '';
    const scopeMatch = content.match(/##\s*\d*\.?\s*Scope\s*\n+([\s\S]*?)(?=\n##|\n---)/i);
    if (scopeMatch) {
      scope = scopeMatch[1].trim().substring(0, 2000);
    }
    
    // Generate tags based on content
    const tags: string[] = ['ISO 27001'];
    if (content.toLowerCase().includes('risk')) tags.push('Risk Management');
    if (content.toLowerCase().includes('access')) tags.push('Access Control');
    if (content.toLowerCase().includes('incident')) tags.push('Incident Management');
    if (content.toLowerCase().includes('audit')) tags.push('Audit');
    if (content.toLowerCase().includes('compliance')) tags.push('Compliance');
    if (content.toLowerCase().includes('security')) tags.push('Information Security');
    
    // Generate keywords
    const keywords: string[] = [documentId, prefix, title.toLowerCase()];
    
    // Determine parent document ID for standards and procedures
    let parentDocumentId: string | undefined;
    if (prefix === 'STD' || prefix === 'PRO') {
      // Standards and procedures link to their parent policy (POL-XXX)
      parentDocumentId = `POL-${mainNum}`;
    }
    
    return {
      documentId,
      title,
      documentType,
      classification,
      distribution,
      purpose: purpose || `This document defines the ${title.toLowerCase()}.`,
      scope: scope || `This document applies to all personnel and systems within the organization's ISMS scope.`,
      content: content.substring(0, 50000), // Limit content size
      summary: `${title} - ${documentType.toLowerCase()} document for ISO 27001 compliance.`,
      documentOwner,
      author,
      approvalLevel,
      reviewFrequency,
      effectiveDate,
      nextReviewDate,
      tags,
      keywords,
      parentDocumentId,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

async function seedPolicies() {
  console.log('Starting policy document seeding...');
  
  // Get the default organization
  const org = await prisma.organisationProfile.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  
  if (!org) {
    console.error('No organization found. Please run the main seed first.');
    return;
  }
  
  // Get default user for author/owner relations
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  
  const organisationId = org.id;
  const userId = user?.id;
  
  console.log(`Using organization: ${org.name} (${organisationId})`);
  
  // Collect all documents to import
  const documents: ParsedDocument[] = [];
  
  // Parse policy documents (only IMPROVED versions)
  const policiesDir = path.join(DOCS_BASE_PATH, 'policies');
  if (fs.existsSync(policiesDir)) {
    const policyFiles = fs.readdirSync(policiesDir).filter(f => f.endsWith('-IMPROVED.md'));
    console.log(`Found ${policyFiles.length} policy files`);
    
    for (const file of policyFiles) {
      const parsed = parseMarkdownDocument(path.join(policiesDir, file), file);
      if (parsed) {
        documents.push(parsed);
      }
    }
  }
  
  // Parse standard documents (only IMPROVED versions where available)
  const standardsDir = path.join(DOCS_BASE_PATH, 'standards_populated');
  if (fs.existsSync(standardsDir)) {
    const standardFiles = fs.readdirSync(standardsDir);
    const improvedStandards = standardFiles.filter(f => f.endsWith('-IMPROVED.md'));
    const regularStandards = standardFiles.filter(f => 
      f.endsWith('.md') && 
      !f.endsWith('-IMPROVED.md') && 
      !improvedStandards.some(imp => imp.replace('-IMPROVED', '') === f)
    );
    
    console.log(`Found ${improvedStandards.length} improved standards and ${regularStandards.length} regular standards`);
    
    for (const file of [...improvedStandards, ...regularStandards].slice(0, 20)) { // Limit to 20 standards for testing
      const parsed = parseMarkdownDocument(path.join(standardsDir, file), file);
      if (parsed) {
        documents.push(parsed);
      }
    }
  }
  
  // Parse procedure documents
  const proceduresDir = path.join(DOCS_BASE_PATH, 'procedures');
  if (fs.existsSync(proceduresDir)) {
    const procedureFiles = fs.readdirSync(proceduresDir).filter(f => f.endsWith('.md'));
    console.log(`Found ${procedureFiles.length} procedure files`);
    
    for (const file of procedureFiles) {
      const parsed = parseMarkdownDocument(path.join(proceduresDir, file), file);
      if (parsed) {
        documents.push(parsed);
      }
    }
  }
  
  console.log(`\nTotal documents to import: ${documents.length}`);
  
  // Sort documents: policies first, then standards, then procedures
  // This ensures parent documents exist before children
  const typeOrder = { POLICY: 0, STANDARD: 1, PROCEDURE: 2, WORK_INSTRUCTION: 3 };
  documents.sort((a, b) => {
    const orderA = typeOrder[a.documentType as keyof typeof typeOrder] ?? 99;
    const orderB = typeOrder[b.documentType as keyof typeof typeOrder] ?? 99;
    return orderA - orderB;
  });
  
  // Map to track created document IDs
  const createdDocIds = new Map<string, string>();
  
  // Create documents
  let created = 0;
  let skipped = 0;
  
  for (const doc of documents) {
    try {
      // Check if document already exists
      const existing = await prisma.policyDocument.findFirst({
        where: { documentId: doc.documentId, organisationId },
      });
      
      if (existing) {
        console.log(`  Skipping ${doc.documentId} - already exists`);
        createdDocIds.set(doc.documentId, existing.id);
        skipped++;
        continue;
      }
      
      // Look up parent document if specified
      let parentId: string | undefined;
      if (doc.parentDocumentId) {
        parentId = createdDocIds.get(doc.parentDocumentId);
        if (!parentId) {
          // Try to find parent in database
          const parent = await prisma.policyDocument.findFirst({
            where: { documentId: doc.parentDocumentId, organisationId },
          });
          if (parent) {
            parentId = parent.id;
          }
        }
      }
      
      // Create the document
      const created_doc = await prisma.policyDocument.create({
        data: {
          documentId: doc.documentId,
          title: doc.title,
          shortTitle: doc.title.length > 50 ? doc.title.substring(0, 50) : undefined,
          documentType: doc.documentType,
          classification: doc.classification,
          distribution: doc.distribution,
          purpose: doc.purpose,
          scope: doc.scope,
          content: doc.content,
          summary: doc.summary,
          documentOwner: doc.documentOwner,
          author: doc.author,
          approvalLevel: doc.approvalLevel,
          reviewFrequency: doc.reviewFrequency,
          effectiveDate: doc.effectiveDate,
          nextReviewDate: doc.nextReviewDate,
          tags: doc.tags,
          keywords: doc.keywords,
          version: '1.0',
          majorVersion: 1,
          minorVersion: 0,
          status: DocumentStatus.PUBLISHED,
          organisation: { connect: { id: organisationId } },
          parentDocument: parentId ? { connect: { id: parentId } } : undefined,
          createdBy: userId ? { connect: { id: userId } } : undefined,
          owner: userId ? { connect: { id: userId } } : undefined,
          authorUser: userId ? { connect: { id: userId } } : undefined,
        },
      });
      
      createdDocIds.set(doc.documentId, created_doc.id);
      console.log(`  Created: ${doc.documentId} - ${doc.title.substring(0, 50)}...`);
      created++;
      
      // Create initial version history entry
      await prisma.documentVersion.create({
        data: {
          documentId: created_doc.id,
          version: '1.0',
          majorVersion: 1,
          minorVersion: 0,
          content: doc.content,
          changeDescription: 'Initial document creation',
          changeSummary: 'Initial version imported from markdown files',
          changeType: ChangeType.INITIAL,
          createdById: userId,
        },
      });
      
    } catch (error) {
      console.error(`  Error creating ${doc.documentId}:`, error);
    }
  }
  
  console.log(`\n✅ Seeding complete!`);
  console.log(`   Created: ${created} documents`);
  console.log(`   Skipped: ${skipped} documents (already existed)`);
}

// Run the seed
seedPolicies()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
