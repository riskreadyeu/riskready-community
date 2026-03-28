// gateway/src/council/council-opinion-parser.ts

import { z } from 'zod';
import { logger } from '../logger.js';
import type { CouncilOpinionData, CouncilMemberRole } from './council-types.js';

// --- Zod schema for structured JSON extraction ---

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;
const VALID_PRIORITIES = ['immediate', 'short_term', 'medium_term', 'long_term'] as const;
const VALID_CONFIDENCES = ['high', 'medium', 'low'] as const;

const FindingSchema = z.object({
  title: z.string(),
  severity: z.preprocess(
    (val) => {
      const s = String(val).toLowerCase();
      return (VALID_SEVERITIES as readonly string[]).includes(s) ? s : 'info';
    },
    z.enum(VALID_SEVERITIES),
  ),
  description: z.string(),
  evidence: z.array(z.string()).default([]),
});

const RecommendationSchema = z.object({
  title: z.string(),
  priority: z.preprocess(
    (val) => {
      const s = String(val).toLowerCase().replace(/[ -]/g, '_');
      return (VALID_PRIORITIES as readonly string[]).includes(s) ? s : 'medium_term';
    },
    z.enum(VALID_PRIORITIES),
  ),
  description: z.string(),
  rationale: z.string().default(''),
});

const DissentSchema = z.object({
  againstAgent: z.string(),
  finding: z.string(),
  reason: z.string(),
});

export const OpinionSchema = z.object({
  findings: z.array(FindingSchema).default([]),
  recommendations: z.array(RecommendationSchema).default([]),
  dissents: z.array(DissentSchema).default([]),
  dataSources: z.array(z.string()).default([]),
  confidence: z.preprocess(
    (val) => {
      const s = String(val).toLowerCase();
      return (VALID_CONFIDENCES as readonly string[]).includes(s) ? s : 'medium';
    },
    z.enum(VALID_CONFIDENCES),
  ),
});

// --- JSON block extraction ---

export function extractJsonBlock(text: string): string | null {
  const match = text.match(/```json\s*\n([\s\S]*?)\n\s*```/);
  return match ? match[1]! : null;
}

// --- Legacy markdown parsing (preserved from council-orchestrator.ts) ---

export function parseLegacyMarkdown(role: CouncilMemberRole, text: string): CouncilOpinionData {
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

// --- Main parser: tries JSON first, falls back to legacy markdown ---

export function parseCouncilOpinion(role: CouncilMemberRole, text: string): CouncilOpinionData {
  // Try to extract and parse a JSON block first
  const jsonBlock = extractJsonBlock(text);
  if (jsonBlock) {
    try {
      const raw = JSON.parse(jsonBlock);
      const parsed = OpinionSchema.parse(raw);
      logger.info({ role, parseMethod: 'json' }, 'Council opinion parsed via JSON extraction');
      return {
        agentRole: role,
        ...parsed,
      };
    } catch (err) {
      logger.warn(
        { role, err, parseMethod: 'json_fallback' },
        'Failed to parse JSON block from council opinion, falling back to legacy markdown',
      );
    }
  }

  // Fall back to legacy markdown parsing
  logger.info({ role, parseMethod: 'legacy_markdown' }, 'Council opinion parsed via legacy markdown');
  return parseLegacyMarkdown(role, text);
}
