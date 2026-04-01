import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Types inlined from @riskready/mcp-shared (ESM package, not directly
// importable via static import in this CJS NestJS server). The runtime
// data is loaded via dynamic import() below.
// ---------------------------------------------------------------------------

interface Iso27001DocumentDef {
  documentId: string;
  title: string;
  documentType: 'POLICY' | 'STANDARD' | 'PROCEDURE';
  classification: string;
  approvalLevel: string;
  reviewFrequency: string;
  wave: 1 | 2 | 3;
  isoClause?: string;
  sections: { sectionType: string; title: string; promptHint: string; isoReference?: string }[];
  controlMappings: { controlRef: string; mappingType: string; coverage: string }[];
  riskMappings?: { riskRef: string; mappingType: string }[];
  tags: string[];
  requiresAcknowledgment: boolean;
  parentDocumentId?: string;
  documentOwner: string;
  seeded?: boolean;
}

interface GenerationResult {
  wave: number;
  generated: { documentId: string; title: string; pendingActionId: string }[];
  skipped: { documentId: string; title: string; reason: string }[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Lazy-loaded ESM modules from @riskready/mcp-shared
// ---------------------------------------------------------------------------
let _registry: Iso27001DocumentDef[] | undefined;
let _getIsoReference: ((documentId: string) => string) | undefined;

async function ensureRegistry(): Promise<Iso27001DocumentDef[]> {
  if (!_registry) {
    const mod = await import('@riskready/mcp-shared');
    _registry = mod.ISO27001_REGISTRY as Iso27001DocumentDef[];
  }
  return _registry;
}

async function ensureGetIsoReference(): Promise<(documentId: string) => string> {
  if (!_getIsoReference) {
    const mod = await import('@riskready/mcp-shared');
    _getIsoReference = mod.getIsoReference;
  }
  return _getIsoReference!;
}

// ---------------------------------------------------------------------------
// In-flight concurrency guard -- one generation per wave at a time
// ---------------------------------------------------------------------------
const inFlight = new Map<number, boolean>();

// ---------------------------------------------------------------------------
// System prompt for document generation
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an ISO 27001:2022 Lead Implementer writing ISMS documentation for an organisation.
Generate professional, implementation-ready content. Use the organisation context provided to tailor the document.
Output ONLY valid JSON with exactly these fields:
- "purpose": a concise purpose statement for the document
- "scope": the scope of the document
- "body": the full document body in Markdown format

Do not wrap the JSON in code fences. Do not include any text outside the JSON object.`;

// ---------------------------------------------------------------------------
// Org context type
// ---------------------------------------------------------------------------
interface OrgContext {
  org: {
    name: string;
    industrySector: string | null;
    employeeCount: number;
    description: string | null;
  };
  departments: { name: string }[];
  processes: { name: string }[];
  riskToleranceStatements: {
    domain: string | null;
    appetiteLevel: string | null;
    proposedToleranceLevel: string;
  }[];
}

@Injectable()
export class Iso27001GenerationService {
  private readonly logger = new Logger(Iso27001GenerationService.name);
  private client: Anthropic | undefined;

  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Public: get coverage status for all ISO 27001 documents
  // -------------------------------------------------------------------------
  async getStatus(organisationId: string) {
    const registry = await ensureRegistry();

    // Get all existing policy documents for this org
    const existingDocs = await this.prisma.policyDocument.findMany({
      where: { organisationId, deletedAt: null },
      select: { documentId: true, title: true, status: true, version: true },
    });
    const existingMap = new Map(existingDocs.map((d) => [d.documentId, d]));

    // Get pending CREATE_POLICY actions
    const pendingActions = await this.prisma.mcpPendingAction.findMany({
      where: {
        organisationId,
        actionType: 'CREATE_POLICY',
        status: 'PENDING',
      },
      select: { payload: true },
    });
    const pendingDocIds = new Set<string>();
    for (const action of pendingActions) {
      const payload = action.payload as Record<string, unknown> | null;
      if (payload && typeof payload === 'object' && 'documentId' in payload) {
        pendingDocIds.add(payload['documentId'] as string);
      }
    }

    const documents = registry.filter((d) => !d.seeded).map((def) => {
      const existing = existingMap.get(def.documentId);
      let status: 'NOT_STARTED' | 'PENDING_APPROVAL' | 'DRAFT' | 'PUBLISHED' | 'OTHER';
      if (existing) {
        if (existing.status === 'PUBLISHED') status = 'PUBLISHED';
        else if (existing.status === 'DRAFT') status = 'DRAFT';
        else status = 'OTHER';
      } else if (pendingDocIds.has(def.documentId)) {
        status = 'PENDING_APPROVAL';
      } else {
        status = 'NOT_STARTED';
      }

      return {
        documentId: def.documentId,
        title: def.title,
        documentType: def.documentType,
        wave: def.wave,
        status,
        existingVersion: existing?.version ?? null,
      };
    });

    const totalDocs = documents.length;
    const completed = documents.filter((d) => d.status === 'PUBLISHED').length;
    const inProgress = documents.filter(
      (d) => d.status === 'DRAFT' || d.status === 'PENDING_APPROVAL' || d.status === 'OTHER',
    ).length;
    const notStarted = documents.filter((d) => d.status === 'NOT_STARTED').length;

    return {
      summary: {
        total: totalDocs,
        completed,
        inProgress,
        notStarted,
        completionPercentage: totalDocs > 0 ? Math.round((completed / totalDocs) * 100) : 0,
      },
      waves: {
        wave1: documents.filter((d) => d.wave === 1),
        wave2: documents.filter((d) => d.wave === 2),
        wave3: documents.filter((d) => d.wave === 3),
      },
      documents,
    };
  }

  // -------------------------------------------------------------------------
  // Public: generate ISO 27001 documents for a given wave
  // -------------------------------------------------------------------------
  async generate(
    wave: 1 | 2 | 3,
    organisationId: string,
    userId: string,
  ): Promise<GenerationResult> {
    if (inFlight.get(wave)) {
      throw new ConflictException(
        `Generation for wave ${wave} is already in progress. Please wait for it to complete.`,
      );
    }
    inFlight.set(wave, true);

    try {
      const registry = await ensureRegistry();
      const docs = registry.filter((d) => d.wave === wave && !d.seeded);
      if (docs.length === 0) {
        return {
          wave,
          generated: [],
          skipped: [],
          summary: `No documents defined for wave ${wave}.`,
        };
      }

      const orgContext = await this.loadOrgContext(organisationId);
      const skipMap = await this.getSkippedDocIds(organisationId, docs);

      const generated: GenerationResult['generated'] = [];
      const skipped: GenerationResult['skipped'] = [];

      // Sequential generation to avoid rate limits
      for (const doc of docs) {
        const skipReason = skipMap.get(doc.documentId);
        if (skipReason) {
          skipped.push({
            documentId: doc.documentId,
            title: doc.title,
            reason: skipReason,
          });
          continue;
        }

        try {
          const content = await this.generateSingleDocument(doc, orgContext);

          // Create McpPendingAction directly via Prisma
          const pendingAction = await this.prisma.mcpPendingAction.create({
            data: {
              actionType: 'CREATE_POLICY',
              summary: `Create ISO 27001 ${doc.documentType.toLowerCase()} "${doc.title}" (${doc.documentId})`,
              reason: `Auto-generated ISO 27001:2022 Wave ${wave} document for ISMS implementation.`,
              payload: {
                documentId: doc.documentId,
                title: doc.title,
                documentType: doc.documentType,
                purpose: content.purpose,
                scope: content.scope,
                content: content.body,
                classification: doc.classification,
                approvalLevel: doc.approvalLevel,
                documentOwner: doc.documentOwner,
                author: 'ISO 27001 Generation Engine',
                reviewFrequency: doc.reviewFrequency,
                tags: doc.tags,
                requiresAcknowledgment: doc.requiresAcknowledgment,
                parentDocumentId: doc.parentDocumentId,
                organisationId,
              },
              mcpToolName: 'generate_iso27001_documents',
              organisationId,
            },
          });

          generated.push({
            documentId: doc.documentId,
            title: doc.title,
            pendingActionId: pendingAction.id,
          });

          this.logger.log(`Generated ${doc.documentId}: ${doc.title}`);
        } catch (err) {
          this.logger.error(`Failed to generate ${doc.documentId}: ${err}`);
          skipped.push({
            documentId: doc.documentId,
            title: doc.title,
            reason: `Generation failed: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      const summary = `Wave ${wave}: generated ${generated.length} document(s), skipped ${skipped.length}.`;
      return { wave, generated, skipped, summary };
    } finally {
      inFlight.delete(wave);
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic();
    }
    return this.client;
  }

  private async loadOrgContext(organisationId: string): Promise<OrgContext> {
    const [org, departments, processes, riskToleranceStatements] =
      await Promise.all([
        this.prisma.organisationProfile.findUniqueOrThrow({
          where: { id: organisationId },
          select: {
            name: true,
            industrySector: true,
            employeeCount: true,
            description: true,
          },
        }),
        this.prisma.department.findMany({
          select: { name: true },
        }),
        this.prisma.businessProcess.findMany({
          select: { name: true },
        }),
        this.prisma.riskToleranceStatement.findMany({
          where: { organisationId },
          select: {
            domain: true,
            appetiteLevel: true,
            proposedToleranceLevel: true,
          },
        }),
      ]);

    return { org, departments, processes, riskToleranceStatements };
  }

  private async getSkippedDocIds(
    organisationId: string,
    docs: Iso27001DocumentDef[],
  ): Promise<Map<string, string>> {
    const docIds = docs.map((d) => d.documentId);
    const skipMap = new Map<string, string>();

    const existing = await this.prisma.policyDocument.findMany({
      where: {
        organisationId,
        documentId: { in: docIds },
      },
      select: { documentId: true },
    });
    for (const e of existing) {
      skipMap.set(e.documentId, 'Already exists in database');
    }

    const pending = await this.prisma.mcpPendingAction.findMany({
      where: {
        organisationId,
        actionType: 'CREATE_POLICY',
        status: 'PENDING',
      },
      select: { payload: true },
    });
    for (const p of pending) {
      const payload = p.payload as Record<string, unknown> | null;
      if (payload && typeof payload === 'object' && 'documentId' in payload) {
        const pid = payload['documentId'] as string;
        if (docIds.includes(pid) && !skipMap.has(pid)) {
          skipMap.set(pid, 'Pending action already exists');
        }
      }
    }

    return skipMap;
  }

  private async buildUserPrompt(doc: Iso27001DocumentDef, orgContext: OrgContext): Promise<string> {
    const getIsoRef = await ensureGetIsoReference();
    const isoRef = getIsoRef(doc.documentId);
    const sectionList = doc.sections
      .map((s) => `- ${s.title}: ${s.promptHint}`)
      .join('\n');

    const deptList =
      orgContext.departments.length > 0
        ? orgContext.departments.map((d) => d.name).join(', ')
        : 'Not specified';

    const processList =
      orgContext.processes.length > 0
        ? orgContext.processes.map((p) => p.name).join(', ')
        : 'Not specified';

    const riskTolerance =
      orgContext.riskToleranceStatements.length > 0
        ? orgContext.riskToleranceStatements
            .map(
              (r) =>
                `${r.domain ?? 'General'}: appetite=${r.appetiteLevel ?? 'N/A'}, tolerance=${r.proposedToleranceLevel}`,
            )
            .join('\n  ')
        : 'Not yet defined';

    return `Generate the ISO 27001:2022 document "${doc.title}" (${doc.documentId}).

Organisation context:
- Name: ${orgContext.org.name}
- Industry: ${orgContext.org.industrySector ?? 'Not specified'}
- Employee count: ${orgContext.org.employeeCount}
- Description: ${orgContext.org.description ?? 'Not provided'}
- Departments: ${deptList}
- Business processes: ${processList}
- Risk tolerance:
  ${riskTolerance}

Document metadata:
- Type: ${doc.documentType}
- ISO clause: ${doc.isoClause ?? 'N/A'}
- Classification: ${doc.classification}
- Approval level: ${doc.approvalLevel}
- Review frequency: ${doc.reviewFrequency}
- Control mappings: ${doc.controlMappings.map((c) => `${c.controlRef} (${c.mappingType}/${c.coverage})`).join(', ') || 'None'}
- Tags: ${doc.tags.join(', ')}

Required sections:
${sectionList}

${isoRef ? `ISO 27001:2022 reference guidance:\n${isoRef}` : ''}

Return valid JSON with "purpose", "scope", and "body" fields.`;
  }

  private parseGeneratedContent(raw: string): {
    purpose: string;
    scope: string;
    body: string;
  } {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    const parsed = JSON.parse(cleaned);
    return {
      purpose: parsed.purpose ?? '',
      scope: parsed.scope ?? '',
      body: parsed.body ?? '',
    };
  }

  private async generateSingleDocument(
    doc: Iso27001DocumentDef,
    orgContext: OrgContext,
  ): Promise<{ purpose: string; scope: string; body: string }> {
    const client = this.getClient();
    const userPrompt = await this.buildUserPrompt(doc, orgContext);
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error(`No text content in Claude response for ${doc.documentId}`);
    }

    return this.parseGeneratedContent(textBlock.text);
  }
}
