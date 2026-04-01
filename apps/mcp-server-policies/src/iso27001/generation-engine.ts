import Anthropic from '@anthropic-ai/sdk';
import {
  createPendingAction,
  getDocumentsByWave,
  getIsoReference,
} from '#mcp-shared';
import type { GenerationResult, Iso27001DocumentDef } from '#mcp-shared';
import { prisma } from '#src/prisma.js';

// ---------------------------------------------------------------------------
// In-flight concurrency guard — one generation per wave at a time
// ---------------------------------------------------------------------------
const inFlight = new Map<number, boolean>();

// ---------------------------------------------------------------------------
// Claude client (lazy singleton)
// ---------------------------------------------------------------------------
let _client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

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
// Build the user prompt for a single document
// ---------------------------------------------------------------------------
function buildUserPrompt(
  doc: Iso27001DocumentDef,
  orgContext: OrgContext,
): string {
  const isoRef = getIsoReference(doc.documentId);
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

// ---------------------------------------------------------------------------
// Load org context from DB
// ---------------------------------------------------------------------------
async function loadOrgContext(organisationId: string): Promise<OrgContext> {
  const [org, departments, processes, riskToleranceStatements] =
    await Promise.all([
      prisma.organisationProfile.findUniqueOrThrow({
        where: { id: organisationId },
        select: {
          name: true,
          industrySector: true,
          employeeCount: true,
          description: true,
        },
      }),
      prisma.department.findMany({
        where: { organisationId },
        select: { name: true },
      }),
      prisma.businessProcess.findMany({
        where: { organisationId },
        select: { name: true },
      }),
      prisma.riskToleranceStatement.findMany({
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

// ---------------------------------------------------------------------------
// Determine which docs to skip (already exist or have pending actions)
// ---------------------------------------------------------------------------
async function getSkippedDocIds(
  wave: number,
  organisationId: string,
  docs: Iso27001DocumentDef[],
): Promise<Map<string, string>> {
  const docIds = docs.map((d) => d.documentId);
  const skipMap = new Map<string, string>();

  // 1. Already-existing PolicyDocuments
  const existing = await prisma.policyDocument.findMany({
    where: {
      organisationId,
      documentId: { in: docIds },
    },
    select: { documentId: true },
  });
  for (const e of existing) {
    skipMap.set(e.documentId, 'Already exists in database');
  }

  // 2. Pending CREATE_POLICY actions whose payload contains one of these docIds
  const pending = await prisma.mcpPendingAction.findMany({
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
      const pid = payload.documentId as string;
      if (docIds.includes(pid) && !skipMap.has(pid)) {
        skipMap.set(pid, 'Pending action already exists');
      }
    }
  }

  return skipMap;
}

// ---------------------------------------------------------------------------
// Parse JSON from Claude response (may be wrapped in code fences)
// ---------------------------------------------------------------------------
function parseGeneratedContent(raw: string): {
  purpose: string;
  scope: string;
  body: string;
} {
  // Strip optional ```json ... ``` wrapper
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

// ---------------------------------------------------------------------------
// Generate content for a single document via Claude
// ---------------------------------------------------------------------------
async function generateSingleDocument(
  doc: Iso27001DocumentDef,
  orgContext: OrgContext,
): Promise<{ purpose: string; scope: string; body: string }> {
  const client = getClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(doc, orgContext),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`No text content in Claude response for ${doc.documentId}`);
  }

  return parseGeneratedContent(textBlock.text);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export async function generateIso27001Documents(
  wave: 1 | 2 | 3,
  organisationId: string,
  mcpSessionId?: string,
): Promise<GenerationResult> {
  // Concurrency guard
  if (inFlight.get(wave)) {
    throw new Error(
      `Generation for wave ${wave} is already in progress. Please wait for it to complete.`,
    );
  }
  inFlight.set(wave, true);

  try {
    const docs = getDocumentsByWave(wave);
    if (docs.length === 0) {
      return {
        wave,
        generated: [],
        skipped: [],
        summary: `No documents defined for wave ${wave}.`,
      };
    }

    const orgContext = await loadOrgContext(organisationId);
    const skipMap = await getSkippedDocIds(wave, organisationId, docs);

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

      const content = await generateSingleDocument(doc, orgContext);

      const result = await createPendingAction({
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
        },
        mcpSessionId,
        mcpToolName: 'propose_generate_iso27001_documents',
        organisationId,
        source: 'iso27001-generation-engine',
      });

      // Extract actionId from the MCP response format
      const actionId = JSON.parse(result.content[0]!.text).actionId as string;

      generated.push({
        documentId: doc.documentId,
        title: doc.title,
        pendingActionId: actionId,
      });
    }

    const summary = `Wave ${wave}: generated ${generated.length} document(s), skipped ${skipped.length}.`;

    return { wave, generated, skipped, summary };
  } finally {
    inFlight.delete(wave);
  }
}
