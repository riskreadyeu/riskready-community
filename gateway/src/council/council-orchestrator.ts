// gateway/src/council/council-orchestrator.ts

import Anthropic from '@anthropic-ai/sdk';
import { wrapCouncilQuestion, wrapCouncilFindings } from '../shared/prompt-helpers.js';
import { prisma } from '../prisma.js';
import { logger } from '../logger.js';
import type { ChatEvent } from '../channels/types.js';
import type {
  CouncilDecision,
  CouncilDeliberation,
  CouncilOpinionData,
  CouncilMemberRole,
  CouncilConfig,
} from './council-types.js';
import { DEFAULT_COUNCIL_CONFIG } from './council-types.js';
import { getCouncilMemberPrompt, getOrchestratorPrompt } from './council-prompts.js';
import { filterMcpServersForMember } from './council-members.js';
import { renderDeliberation } from './council-renderer.js';
import { CouncilClassifier } from './council-classifier.js';
import type { Router } from '../router/router.js';
import { resolveConversationModel } from '../model-resolution.js';
import { runMessageLoop } from '../agent/message-loop.js';
import { McpToolExecutor } from '../agent/mcp-tool-executor.js';
import { buildToolDefinitions } from '../agent/tool-builder.js';
import type { FullToolSchema } from '../agent/tool-schema-loader.js';
import type { SkillRegistry } from '../agent/skill-registry.js';

interface CouncilOrchestratorDeps {
  router: Router;
  config?: Partial<CouncilConfig>;
  toolSchemas?: FullToolSchema[];
  skillRegistry?: SkillRegistry;
  databaseUrl?: string;
  basePath?: string;
}

export class CouncilOrchestrator {
  private classifier: CouncilClassifier;
  private config: CouncilConfig;
  private toolSchemas: FullToolSchema[];
  private skillRegistry?: SkillRegistry;
  private databaseUrl?: string;
  private basePath?: string;

  constructor(deps: CouncilOrchestratorDeps) {
    this.config = { ...DEFAULT_COUNCIL_CONFIG, ...deps.config };
    this.classifier = new CouncilClassifier(deps.router, this.config);
    this.toolSchemas = deps.toolSchemas ?? [];
    this.skillRegistry = deps.skillRegistry;
    this.databaseUrl = deps.databaseUrl;
    this.basePath = deps.basePath;
  }

  updateToolSchemas(schemas: FullToolSchema[]): void {
    this.toolSchemas = schemas;
  }

  shouldConvene(message: string): boolean {
    const decision = this.classifier.classify(message);
    if (decision.convene) {
      logger.info({ reason: decision.reason, members: decision.memberRoles }, 'Council convened');
    }
    return decision.convene;
  }

  async deliberate(
    question: string,
    organisationId: string,
    conversationId: string,
    signal: AbortSignal,
    emit: (event: ChatEvent) => void,
    allMcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>,
    getDbConfig?: (organisationId: string) => Promise<{ anthropicApiKey?: string; agentModel: string; maxAgentTurns: number } | null>,
  ): Promise<{ text: string; sessionId: string }> {
    const decision = this.classifier.classify(question);

    if (!decision.convene) {
      throw new Error('Council should not be convened for this message');
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      select: { model: true },
    });
    const conversationModel = conversation?.model ?? null;

    // Create council session in DB
    const session = await prisma.councilSession.create({
      data: {
        conversationId,
        question,
        pattern: decision.deliberationPattern,
        participatingAgents: decision.memberRoles,
        organisationId,
      },
    });

    emit({
      type: 'council_start',
      members: decision.memberRoles,
      sessionId: session.id,
      message: `Convening council: ${decision.memberRoles.join(', ')}`,
    });

    try {
      // Run member analyses based on the deliberation pattern
      const opinions = await this.runMembers(
        question,
        decision,
        organisationId,
        conversationModel,
        signal,
        emit,
        allMcpServers,
        getDbConfig,
      );

      // Save individual opinions
      for (const opinion of opinions) {
        await prisma.councilOpinion.create({
          data: {
            sessionId: session.id,
            agentRole: opinion.agentRole,
            findings: opinion.findings as any,
            recommendations: opinion.recommendations as any,
            dissents: opinion.dissents as any,
            dataSources: opinion.dataSources as any,
            confidence: opinion.confidence,
          },
        });
      }

      // Synthesis phase
      emit({ type: 'council_synthesis', message: 'Synthesizing council findings...' });

      const deliberation = await this.synthesize(
        question,
        opinions,
        decision,
        session.id,
        organisationId,
        conversationModel,
        signal,
        allMcpServers,
        getDbConfig,
      );

      // Update session with results
      await prisma.councilSession.update({
        where: { id: session.id },
        data: {
          consensusSummary: deliberation.consensusSummary,
          deliberation: deliberation as any,
          confidenceLevel: deliberation.confidenceLevel,
          completedAt: new Date(),
        },
      });

      const renderedText = renderDeliberation(deliberation);

      return { text: renderedText, sessionId: session.id };
    } catch (err) {
      logger.error({ err, sessionId: session.id }, 'Council deliberation failed');

      await prisma.councilSession.update({
        where: { id: session.id },
        data: {
          completedAt: new Date(),
          confidenceLevel: 'low',
          consensusSummary: `Council deliberation failed: ${err instanceof Error ? err.message : String(err)}`,
        },
      });

      throw err;
    }
  }

  private async runMembers(
    question: string,
    decision: CouncilDecision,
    organisationId: string,
    conversationModel: string | null,
    signal: AbortSignal,
    emit: (event: ChatEvent) => void,
    allMcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>,
    getDbConfig?: (organisationId: string) => Promise<{ anthropicApiKey?: string; agentModel: string; maxAgentTurns: number } | null>,
  ): Promise<CouncilOpinionData[]> {
    // Exclude ciso-strategist from member analysis (they do synthesis)
    const analysisMembers = decision.memberRoles.filter((r) => r !== 'ciso-strategist');
    const opinions: CouncilOpinionData[] = [];

    if (decision.deliberationPattern === 'parallel_then_synthesis') {
      // Run members in batches of 2 to limit concurrent MCP server spawns and memory usage
      const BATCH_SIZE = 2;
      for (let i = 0; i < analysisMembers.length; i += BATCH_SIZE) {
        if (signal.aborted) break;
        const batch = analysisMembers.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((role) =>
            this.runSingleMember(role, question, '', organisationId, conversationModel, signal, emit, allMcpServers, getDbConfig),
          ),
        );
        for (const result of results) {
          if (result.status === 'fulfilled') {
            opinions.push(result.value);
          } else {
            logger.error({ err: result.reason }, 'Council member failed');
          }
        }
      }
    } else if (decision.deliberationPattern === 'sequential_buildup') {
      // Run members sequentially, passing previous findings as context
      let context = '';
      for (const role of analysisMembers) {
        const opinion = await this.runSingleMember(
          role, question, context, organisationId, conversationModel, signal, emit, allMcpServers, getDbConfig,
        );
        opinions.push(opinion);
        context += `\n\n--- ${role} findings ---\n${this.summarizeOpinion(opinion)}`;
      }
    } else if (decision.deliberationPattern === 'challenge_response') {
      // First member proposes, second challenges, first responds
      if (analysisMembers.length >= 2) {
        const proposer = analysisMembers[0]!;
        const challenger = analysisMembers[1]!;

        const proposal = await this.runSingleMember(
          proposer, question, '', organisationId, conversationModel, signal, emit, allMcpServers, getDbConfig,
        );
        opinions.push(proposal);

        const challenge = await this.runSingleMember(
          challenger,
          `Review and challenge these findings:\n${wrapCouncilFindings(this.summarizeOpinion(proposal))}\n\n${wrapCouncilQuestion(question)}`,
          '', organisationId, conversationModel, signal, emit, allMcpServers, getDbConfig,
        );
        opinions.push(challenge);

        // Remaining members get both contexts
        const context = `Proposal by ${proposer}:\n${this.summarizeOpinion(proposal)}\n\nChallenge by ${challenger}:\n${this.summarizeOpinion(challenge)}`;
        for (const role of analysisMembers.slice(2)) {
          const opinion = await this.runSingleMember(
            role, question, context, organisationId, conversationModel, signal, emit, allMcpServers, getDbConfig,
          );
          opinions.push(opinion);
        }
      }
    }

    return opinions;
  }

  private async runSingleMember(
    role: CouncilMemberRole,
    question: string,
    previousContext: string,
    organisationId: string,
    conversationModel: string | null,
    signal: AbortSignal,
    emit: (event: ChatEvent) => void,
    allMcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>,
    getDbConfig?: (organisationId: string) => Promise<{ anthropicApiKey?: string; agentModel: string; maxAgentTurns: number } | null>,
  ): Promise<CouncilOpinionData> {
    emit({ type: 'council_member_start', agentRole: role, message: `${role} analyzing...` });

    const systemPrompt = getCouncilMemberPrompt(role);

    const userMessage = previousContext
      ? `Organisation ID: ${organisationId}\n\n${wrapCouncilFindings(previousContext)}\n\n${wrapCouncilQuestion(question)}`
      : `Organisation ID: ${organisationId}\n\n${wrapCouncilQuestion(question)}`;

    let apiKey = process.env.ANTHROPIC_API_KEY;
    let dbModel: string | undefined;
    if (getDbConfig) {
      const dbConfig = await getDbConfig(organisationId);
      if (dbConfig) {
        dbModel = dbConfig.agentModel || undefined;
        if (dbConfig.anthropicApiKey) apiKey = dbConfig.anthropicApiKey;
      }
    }

    if (!apiKey) {
      throw new Error('No Anthropic API key configured for council member');
    }

    const model = this.config.memberModel
      || resolveConversationModel({
        envModel: process.env.AGENT_MODEL,
        dbModel,
        conversationModel,
      });

    const client = new Anthropic({ apiKey });

    // Filter tool schemas to only those belonging to the member's servers
    const memberServers = filterMcpServersForMember(role, allMcpServers);
    const memberServerNames = Object.keys(memberServers);
    const memberToolSchemas = this.toolSchemas.filter((s) => memberServerNames.includes(s.serverName));

    // Build tool definitions — council members don't need code execution
    const tools = buildToolDefinitions(memberToolSchemas, { allowCodeExecution: false });

    // Build executor scoped to this member's servers
    const executor = new McpToolExecutor({
      organisationId,
      getServerConfig: (serverName: string) => memberServers[serverName],
    });

    let fullText = '';
    try {
      const result = await runMessageLoop({
        client,
        model,
        systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        tools,
        maxTurns: this.config.maxTurnsPerMember,
        signal,
        onEvent: () => {}, // council members don't stream to the user
        executeTool: (name, input) => executor.execute(name, input),
      });

      fullText = result.text;
      logger.info({
        councilMember: role,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.inputTokens + result.usage.outputTokens,
        toolCallCount: result.toolCalls.length,
      }, 'Council member token usage');
    } finally {
      await executor.shutdown();
    }

    emit({ type: 'council_member_done', agentRole: role, message: `${role} complete` });

    // Parse the member's output into structured opinion
    return this.parseOpinion(role, fullText);
  }

  /**
   * Parse a council member's text output into a structured CouncilOpinionData.
   * Uses a best-effort approach to extract structured data from markdown.
   */
  private parseOpinion(role: CouncilMemberRole, text: string): CouncilOpinionData {
    const findings: CouncilOpinionData['findings'] = [];
    const recommendations: CouncilOpinionData['recommendations'] = [];
    const dissents: CouncilOpinionData['dissents'] = [];
    const dataSources: string[] = [];

    // Extract findings section
    const findingsMatch = text.match(/## Findings\n([\s\S]*?)(?=\n## |$)/);
    if (findingsMatch) {
      const findingItems = findingsMatch[1].match(/- \[?(CRITICAL|HIGH|MEDIUM|LOW|INFO)\]?\s*\*\*([^*]+)\*\*:?\s*([^\n]+)/gi) || [];
      for (const item of findingItems) {
        const match = item.match(/\[?(CRITICAL|HIGH|MEDIUM|LOW|INFO)\]?\s*\*\*([^*]+)\*\*:?\s*(.+)/i);
        if (match) {
          findings.push({
            title: match[2].trim(),
            severity: match[1].toLowerCase() as any,
            description: match[3].trim(),
            evidence: [],
          });
        }
      }
    }

    // If no structured findings found, treat the whole text as a single finding
    if (findings.length === 0 && text.length > 50) {
      findings.push({
        title: `${role} Analysis`,
        severity: 'info',
        description: text.slice(0, 2000),
        evidence: [],
      });
    }

    // Extract recommendations section
    const recsMatch = text.match(/## Recommendations\n([\s\S]*?)(?=\n## |$)/);
    if (recsMatch) {
      const recItems = recsMatch[1].match(/- \[?(immediate|short_term|medium_term|long_term)\]?\s*\*\*([^*]+)\*\*:?\s*([^\n]+)/gi) || [];
      for (const item of recItems) {
        const match = item.match(/\[?(immediate|short_term|medium_term|long_term)\]?\s*\*\*([^*]+)\*\*:?\s*(.+)/i);
        if (match) {
          recommendations.push({
            title: match[2].trim(),
            priority: match[1].toLowerCase().replace(/[ -]/g, '_') as any,
            description: match[3].trim(),
            rationale: '',
          });
        }
      }
    }

    // Extract confidence
    const confidenceMatch = text.match(/## Confidence\n([\s\S]*?)(?=\n## |$)/i)
      || text.match(/\*\*Confidence\*\*:?\s*(high|medium|low)/i);
    const confidence = confidenceMatch?.[1]?.toLowerCase().includes('high') ? 'high'
      : confidenceMatch?.[1]?.toLowerCase().includes('low') ? 'low'
        : 'medium';

    // Extract data sources
    const sourcesMatch = text.match(/## Data Sources\n([\s\S]*?)(?=\n## |$)/);
    if (sourcesMatch) {
      const sourceLines = sourcesMatch[1].split('\n').filter((l) => l.trim().startsWith('-'));
      for (const line of sourceLines) {
        dataSources.push(line.replace(/^-\s*/, '').trim());
      }
    }

    return {
      agentRole: role,
      findings,
      recommendations,
      dissents,
      dataSources,
      confidence,
    };
  }

  private async synthesize(
    question: string,
    opinions: CouncilOpinionData[],
    decision: CouncilDecision,
    sessionId: string,
    organisationId: string,
    conversationModel: string | null,
    signal: AbortSignal,
    allMcpServers: Record<string, { command: string; args: string[]; env?: Record<string, string> }>,
    getDbConfig?: (organisationId: string) => Promise<{ anthropicApiKey?: string; agentModel: string; maxAgentTurns: number } | null>,
  ): Promise<CouncilDeliberation> {
    // Build synthesis prompt with all opinions
    const opinionSummaries = opinions.map((o) => this.summarizeOpinion(o)).join('\n\n---\n\n');

    const synthesisPrompt = `Organisation ID: ${organisationId}

You are synthesizing findings from the AI Agents Council.

**Original Question**:
${wrapCouncilQuestion(question)}

**Council Member Analyses**:
${wrapCouncilFindings(opinionSummaries)}

Please produce a comprehensive synthesis that includes:
1. **Consensus Summary**: What the council agrees on
2. **Cross-Domain Correlations**: Links between findings across domains (cite record IDs)
3. **Consolidated Recommendations**: Prioritized (immediate, short_term, medium_term, long_term)
4. **Dissenting Opinions**: Where members disagree
5. **Proposed Actions**: Concrete next steps with domain and priority
6. **Confidence Level**: Overall assessment confidence (high/medium/low)
7. **Next Steps**: What should happen next

Format your response using the structured output format from your instructions.`;

    const cisoPrompt = getCouncilMemberPrompt('ciso-strategist');
    const cisoServers = filterMcpServersForMember('ciso-strategist', allMcpServers);

    let apiKey = process.env.ANTHROPIC_API_KEY;
    let dbModel: string | undefined;
    if (getDbConfig) {
      const dbConfig = await getDbConfig(organisationId);
      if (dbConfig) {
        dbModel = dbConfig.agentModel || undefined;
        if (dbConfig.anthropicApiKey) apiKey = dbConfig.anthropicApiKey;
      }
    }

    if (!apiKey) {
      throw new Error('No Anthropic API key configured for council synthesis');
    }

    const model = resolveConversationModel({
      envModel: process.env.AGENT_MODEL,
      dbModel,
      conversationModel,
    });

    const client = new Anthropic({ apiKey });

    // Filter tool schemas to CISO's servers
    const cisoServerNames = Object.keys(cisoServers);
    const cisoToolSchemas = this.toolSchemas.filter((s) => cisoServerNames.includes(s.serverName));
    const tools = buildToolDefinitions(cisoToolSchemas, { allowCodeExecution: false });

    const executor = new McpToolExecutor({
      organisationId,
      getServerConfig: (serverName: string) => cisoServers[serverName],
    });

    let fullText = '';
    try {
      const result = await runMessageLoop({
        client,
        model,
        systemPrompt: cisoPrompt,
        messages: [{ role: 'user', content: synthesisPrompt }],
        tools,
        maxTurns: this.config.maxTurnsPerMember,
        signal,
        onEvent: () => {}, // synthesis doesn't stream to the user
        executeTool: (name, input) => executor.execute(name, input),
      });

      fullText = result.text;
      logger.info({
        councilMember: 'ciso-strategist-synthesis',
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.inputTokens + result.usage.outputTokens,
        toolCallCount: result.toolCalls.length,
      }, 'Council synthesis token usage');
    } finally {
      await executor.shutdown();
    }

    // Build the deliberation from synthesis + individual opinions
    return this.buildDeliberation(sessionId, fullText, opinions, decision);
  }

  private buildDeliberation(
    sessionId: string,
    synthesisText: string,
    opinions: CouncilOpinionData[],
    decision: CouncilDecision,
  ): CouncilDeliberation {
    // Extract consensus summary from synthesis
    const consensusMatch = synthesisText.match(/## Consensus Summary\n([\s\S]*?)(?=\n## |$)/);
    const consensusSummary = consensusMatch?.[1]?.trim() || synthesisText.slice(0, 2000);

    // Extract cross-domain correlations
    const correlations: CouncilDeliberation['crossDomainCorrelations'] = [];
    const correlationMatch = synthesisText.match(/## Cross-Domain Correlations\n([\s\S]*?)(?=\n## |$)/);
    if (correlationMatch) {
      const items = correlationMatch[1].match(/- \*\*([^*]+)\*\*:?\s*([^\n]+)/g) || [];
      for (const item of items) {
        const match = item.match(/- \*\*([^*]+)\*\*:?\s*(.+)/);
        if (match) {
          correlations.push({
            description: match[2].trim(),
            domains: match[1].split(/[\/,]/).map((d) => d.trim()),
            recordIds: [],
          });
        }
      }
    }

    // Consolidate recommendations from all opinions
    const allRecs: CouncilDeliberation['consolidatedRecommendations'] = [];
    for (const opinion of opinions) {
      for (const rec of opinion.recommendations) {
        allRecs.push({
          title: rec.title,
          priority: rec.priority,
          description: rec.description,
          supportingAgents: [opinion.agentRole],
        });
      }
    }

    // Consolidate dissents
    const allDissents: CouncilDeliberation['dissentingOpinions'] = [];
    for (const opinion of opinions) {
      for (const dissent of opinion.dissents) {
        allDissents.push({
          agentRole: opinion.agentRole,
          finding: dissent.finding,
          reason: dissent.reason,
        });
      }
    }

    // Extract proposed actions from synthesis
    const proposedActions: CouncilDeliberation['proposedActions'] = [];
    const actionsMatch = synthesisText.match(/## Proposed Actions\n([\s\S]*?)(?=\n## |$)/);
    if (actionsMatch) {
      const items = actionsMatch[1].match(/- \[([^\]]+)\]\s*\*\*([^*]+)\*\*:?\s*([^\n]+)/g) || [];
      for (const item of items) {
        const match = item.match(/- \[([^\]]+)\]\s*\*\*([^*]+)\*\*:?\s*(.+)/);
        if (match) {
          proposedActions.push({
            priority: match[1].toLowerCase(),
            domain: match[2].trim(),
            action: match[3].trim(),
          });
        }
      }
    }

    // Extract next steps from synthesis
    const nextSteps: string[] = [];
    const nextMatch = synthesisText.match(/## Next Steps\n([\s\S]*?)(?=\n## |$)/);
    if (nextMatch) {
      const items = nextMatch[1].split('\n').filter((l) => l.match(/^\d+\.|^-/));
      for (const item of items) {
        nextSteps.push(item.replace(/^\d+\.\s*|^-\s*/, '').trim());
      }
    }

    // Determine overall confidence
    const confidences = opinions.map((o) => o.confidence);
    const highCount = confidences.filter((c) => c === 'high').length;
    const lowCount = confidences.filter((c) => c === 'low').length;
    const overallConfidence: 'high' | 'medium' | 'low' =
      lowCount > highCount ? 'low' : highCount > confidences.length / 2 ? 'high' : 'medium';

    return {
      sessionId,
      consensusSummary,
      consolidatedRecommendations: allRecs,
      dissentingOpinions: allDissents,
      crossDomainCorrelations: correlations,
      proposedActions,
      confidenceLevel: overallConfidence,
      nextSteps,
      opinions,
    };
  }

  private summarizeOpinion(opinion: CouncilOpinionData): string {
    const lines: string[] = [];
    lines.push(`### ${opinion.agentRole} (Confidence: ${opinion.confidence})`);

    if (opinion.findings.length > 0) {
      lines.push('\n**Findings:**');
      for (const f of opinion.findings) {
        lines.push(`- [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`);
      }
    }

    if (opinion.recommendations.length > 0) {
      lines.push('\n**Recommendations:**');
      for (const r of opinion.recommendations) {
        lines.push(`- [${r.priority}] ${r.title}: ${r.description}`);
      }
    }

    if (opinion.dissents.length > 0) {
      lines.push('\n**Dissents:**');
      for (const d of opinion.dissents) {
        lines.push(`- Against ${d.againstAgent}: ${d.finding} — ${d.reason}`);
      }
    }

    return lines.join('\n');
  }
}
