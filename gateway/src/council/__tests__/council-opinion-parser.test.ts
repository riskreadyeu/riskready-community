// gateway/src/council/__tests__/council-opinion-parser.test.ts

import { describe, it, expect } from 'vitest';
import {
  parseCouncilOpinion,
  parseLegacyMarkdown,
  extractJsonBlock,
} from '../council-opinion-parser.js';

describe('council-opinion-parser', () => {
  describe('parseCouncilOpinion', () => {
    it('parses valid JSON block from markdown', () => {
      const text = `Here is my analysis of the current risk landscape.

The organisation has several areas of concern that need attention.

\`\`\`json
{
  "findings": [
    {
      "title": "Overdue risk treatments",
      "severity": "high",
      "description": "3 risk treatment plans are past their due date",
      "evidence": ["TP-001", "TP-002", "TP-003"]
    },
    {
      "title": "KRI threshold breach",
      "severity": "critical",
      "description": "Key risk indicator KRI-05 has breached its red threshold",
      "evidence": ["KRI-05"]
    }
  ],
  "recommendations": [
    {
      "title": "Expedite treatment plans",
      "priority": "immediate",
      "description": "Review and update overdue treatment plans",
      "rationale": "Overdue treatments indicate unmanaged risk exposure"
    }
  ],
  "dissents": [],
  "dataSources": ["list_risks", "list_treatment_plans", "list_kris"],
  "confidence": "high"
}
\`\`\``;

      const result = parseCouncilOpinion('risk-analyst', text);

      expect(result.agentRole).toBe('risk-analyst');
      expect(result.findings).toHaveLength(2);
      expect(result.findings[0]!.title).toBe('Overdue risk treatments');
      expect(result.findings[0]!.severity).toBe('high');
      expect(result.findings[0]!.evidence).toEqual(['TP-001', 'TP-002', 'TP-003']);
      expect(result.findings[1]!.severity).toBe('critical');
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0]!.priority).toBe('immediate');
      expect(result.recommendations[0]!.rationale).toBe('Overdue treatments indicate unmanaged risk exposure');
      expect(result.dataSources).toEqual(['list_risks', 'list_treatment_plans', 'list_kris']);
      expect(result.confidence).toBe('high');
    });

    it('falls back to legacy markdown parsing', () => {
      const text = `## Findings
- [HIGH] **Expired SSL certificates**: Two production servers have expired certificates
- [MEDIUM] **Missing access reviews**: Quarterly access reviews not completed

## Recommendations
- [immediate] **Renew certificates**: Replace expired SSL certificates on production servers
- [short_term] **Schedule reviews**: Set up automated reminders for quarterly access reviews

## Confidence
High confidence based on comprehensive tool data.

## Data Sources
- list_controls
- get_gap_analysis`;

      const result = parseCouncilOpinion('controls-auditor', text);

      expect(result.agentRole).toBe('controls-auditor');
      expect(result.findings).toHaveLength(2);
      expect(result.findings[0]!.title).toBe('Expired SSL certificates');
      expect(result.findings[0]!.severity).toBe('high');
      expect(result.findings[0]!.description).toBe('Two production servers have expired certificates');
      expect(result.findings[1]!.severity).toBe('medium');
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0]!.priority).toBe('immediate');
      expect(result.recommendations[1]!.priority).toBe('short_term');
      expect(result.confidence).toBe('high');
      expect(result.dataSources).toEqual(['list_controls', 'get_gap_analysis']);
    });

    it('handles malformed JSON gracefully', () => {
      const text = `Some analysis text here.

\`\`\`json
{ "findings": [ { "title": "broken", "severity": "high", INVALID_JSON_HERE }] }
\`\`\`

More text after the broken JSON block that is long enough to trigger the fallback finding behavior.`;

      const result = parseCouncilOpinion('compliance-officer', text);

      // Should fall back to legacy markdown, which will create a single info finding
      // since there are no ## Findings sections but text is > 50 chars
      expect(result.agentRole).toBe('compliance-officer');
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]!.severity).toBe('info');
      expect(result.findings[0]!.title).toBe('compliance-officer Analysis');
    });

    it('handles empty text', () => {
      const result = parseCouncilOpinion('risk-analyst', '');

      expect(result.agentRole).toBe('risk-analyst');
      expect(result.findings).toEqual([]);
      expect(result.recommendations).toEqual([]);
      expect(result.dissents).toEqual([]);
      expect(result.dataSources).toEqual([]);
      expect(result.confidence).toBe('medium');
    });

    it('validates severity values', () => {
      const text = `Analysis results.

\`\`\`json
{
  "findings": [
    {
      "title": "Test finding",
      "severity": "ULTRA",
      "description": "Invalid severity should default to info",
      "evidence": []
    },
    {
      "title": "Valid finding",
      "severity": "critical",
      "description": "This one is valid",
      "evidence": []
    }
  ],
  "recommendations": [],
  "dissents": [],
  "dataSources": [],
  "confidence": "high"
}
\`\`\``;

      const result = parseCouncilOpinion('incident-commander', text);

      expect(result.findings).toHaveLength(2);
      expect(result.findings[0]!.severity).toBe('info'); // "ULTRA" defaults to info
      expect(result.findings[1]!.severity).toBe('critical');
    });

    it('extracts dissents from JSON', () => {
      const text = `I disagree with some findings.

\`\`\`json
{
  "findings": [
    {
      "title": "Asset coverage adequate",
      "severity": "low",
      "description": "Asset inventory coverage is actually at 95%",
      "evidence": ["AST-001", "get_asset_stats"]
    }
  ],
  "recommendations": [],
  "dissents": [
    {
      "againstAgent": "controls-auditor",
      "finding": "Claims asset inventory is incomplete",
      "reason": "The controls-auditor only checked physical assets. When including virtual assets, coverage is 95% per get_asset_stats."
    },
    {
      "againstAgent": "risk-analyst",
      "finding": "Risk score overestimated",
      "reason": "The residual risk was calculated without considering the new firewall controls deployed last month."
    }
  ],
  "dataSources": ["list_assets", "get_asset_stats"],
  "confidence": "high"
}
\`\`\``;

      const result = parseCouncilOpinion('evidence-auditor', text);

      expect(result.dissents).toHaveLength(2);
      expect(result.dissents[0]!.againstAgent).toBe('controls-auditor');
      expect(result.dissents[0]!.finding).toBe('Claims asset inventory is incomplete');
      expect(result.dissents[0]!.reason).toContain('virtual assets');
      expect(result.dissents[1]!.againstAgent).toBe('risk-analyst');
      expect(result.dissents[1]!.reason).toContain('firewall controls');
    });
  });

  describe('extractJsonBlock', () => {
    it('extracts JSON from fenced code block', () => {
      const text = 'Some text\n```json\n{"key": "value"}\n```\nMore text';
      expect(extractJsonBlock(text)).toBe('{"key": "value"}');
    });

    it('returns null when no JSON block exists', () => {
      expect(extractJsonBlock('No JSON here')).toBeNull();
    });

    it('extracts only the first JSON block', () => {
      const text = '```json\n{"first": true}\n```\n\n```json\n{"second": true}\n```';
      expect(extractJsonBlock(text)).toBe('{"first": true}');
    });
  });

  describe('parseLegacyMarkdown', () => {
    it('parses findings with bracket severity format', () => {
      const text = `## Findings
- [CRITICAL] **Data breach risk**: Unencrypted PII in database
- [LOW] **Minor config issue**: Debug logging enabled

## Confidence
Low confidence due to limited data.`;

      const result = parseLegacyMarkdown('risk-analyst', text);

      expect(result.findings).toHaveLength(2);
      expect(result.findings[0]!.severity).toBe('critical');
      expect(result.findings[0]!.title).toBe('Data breach risk');
      expect(result.findings[1]!.severity).toBe('low');
      expect(result.confidence).toBe('low');
    });

    it('creates fallback finding for long unstructured text', () => {
      const longText = 'A'.repeat(100);
      const result = parseLegacyMarkdown('incident-commander', longText);

      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]!.title).toBe('incident-commander Analysis');
      expect(result.findings[0]!.severity).toBe('info');
    });

    it('returns empty findings for short unstructured text', () => {
      const result = parseLegacyMarkdown('risk-analyst', 'Short');

      expect(result.findings).toEqual([]);
    });
  });
});
