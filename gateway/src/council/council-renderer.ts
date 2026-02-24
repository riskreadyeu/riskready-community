// gateway/src/council/council-renderer.ts

import type { CouncilDeliberation, CouncilOpinionData, CouncilMemberRole } from './council-types.js';

const ROLE_LABELS: Record<CouncilMemberRole, string> = {
  'risk-analyst': 'Risk Analyst',
  'controls-auditor': 'Controls Auditor',
  'compliance-officer': 'Compliance Officer',
  'incident-commander': 'Incident Commander',
  'evidence-auditor': 'Evidence & Audit Specialist',
  'ciso-strategist': 'CISO Strategist',
};

/**
 * Render a council deliberation into structured markdown for display.
 */
export function renderDeliberation(deliberation: CouncilDeliberation): string {
  const lines: string[] = [];

  lines.push('# AI Agents Council Deliberation\n');
  lines.push(`> **Confidence Level**: ${deliberation.confidenceLevel}\n`);

  // Consensus Summary
  lines.push('## Consensus Summary\n');
  lines.push(deliberation.consensusSummary);
  lines.push('');

  // Cross-Domain Correlations
  if (deliberation.crossDomainCorrelations.length > 0) {
    lines.push('## Cross-Domain Correlations\n');
    for (const correlation of deliberation.crossDomainCorrelations) {
      lines.push(`- **${correlation.domains.join(' / ')}**: ${correlation.description}`);
      if (correlation.recordIds.length > 0) {
        lines.push(`  - Records: ${correlation.recordIds.join(', ')}`);
      }
    }
    lines.push('');
  }

  // Consolidated Recommendations
  if (deliberation.consolidatedRecommendations.length > 0) {
    lines.push('## Recommendations\n');
    lines.push('| Priority | Recommendation | Supporting Agents |');
    lines.push('|----------|---------------|-------------------|');
    for (const rec of deliberation.consolidatedRecommendations) {
      const agents = rec.supportingAgents.map((a) => ROLE_LABELS[a as CouncilMemberRole] || a).join(', ');
      lines.push(`| ${formatPriority(rec.priority)} | **${rec.title}**: ${rec.description} | ${agents} |`);
    }
    lines.push('');
  }

  // Proposed Actions
  if (deliberation.proposedActions.length > 0) {
    lines.push('## Proposed Actions\n');
    for (const action of deliberation.proposedActions) {
      lines.push(`- [${action.priority.toUpperCase()}] **${action.domain}**: ${action.action}`);
    }
    lines.push('');
  }

  // Individual Member Findings
  if (deliberation.opinions.length > 0) {
    lines.push('## Individual Agent Analyses\n');
    for (const opinion of deliberation.opinions) {
      const label = ROLE_LABELS[opinion.agentRole] || opinion.agentRole;
      lines.push(`### ${label}\n`);
      lines.push(`**Confidence**: ${opinion.confidence}\n`);

      if (opinion.findings.length > 0) {
        lines.push('**Findings:**');
        for (const finding of opinion.findings) {
          const severityBadge = `[${finding.severity.toUpperCase()}]`;
          lines.push(`- ${severityBadge} **${finding.title}**: ${finding.description}`);
          if (finding.evidence.length > 0) {
            lines.push(`  - Evidence: ${finding.evidence.join(', ')}`);
          }
        }
        lines.push('');
      }

      if (opinion.recommendations.length > 0) {
        lines.push('**Recommendations:**');
        for (const rec of opinion.recommendations) {
          lines.push(`- [${rec.priority}] **${rec.title}**: ${rec.description}`);
        }
        lines.push('');
      }
    }
  }

  // Dissenting Opinions
  if (deliberation.dissentingOpinions.length > 0) {
    lines.push('## Dissenting Opinions\n');
    lines.push('> *Preserved for GRC audit trail*\n');
    for (const dissent of deliberation.dissentingOpinions) {
      const label = ROLE_LABELS[dissent.agentRole as CouncilMemberRole] || dissent.agentRole;
      lines.push(`- **${label}** disagrees on: ${dissent.finding}`);
      lines.push(`  - Reason: ${dissent.reason}`);
    }
    lines.push('');
  }

  // Next Steps
  if (deliberation.nextSteps.length > 0) {
    lines.push('## Next Steps\n');
    for (let i = 0; i < deliberation.nextSteps.length; i++) {
      lines.push(`${i + 1}. ${deliberation.nextSteps[i]}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Council session: ${deliberation.sessionId}*`);

  return lines.join('\n');
}

function formatPriority(priority: string): string {
  const icons: Record<string, string> = {
    immediate: 'IMMEDIATE',
    short_term: 'SHORT-TERM',
    medium_term: 'MEDIUM-TERM',
    long_term: 'LONG-TERM',
  };
  return icons[priority] || priority.toUpperCase();
}
