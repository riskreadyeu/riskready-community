import { describe, expect, it } from 'vitest';
import type { FullToolSchema } from '../agent/tool-schema-loader.js';

const FULL_NAME_PATTERN = /^mcp__[a-z][a-z0-9-]*__[a-z][a-z0-9_]*$/;

describe('FullToolSchema', () => {
  it('has expected fields', () => {
    const schema: FullToolSchema = {
      name: 'list_risks',
      fullName: 'mcp__riskready-risks__list_risks',
      description: 'List all risks',
      inputSchema: { type: 'object', properties: {} },
      serverName: 'riskready-risks',
    };

    expect(schema.name).toBe('list_risks');
    expect(schema.fullName).toBe('mcp__riskready-risks__list_risks');
    expect(schema.description).toBe('List all risks');
    expect(schema.inputSchema).toEqual({ type: 'object', properties: {} });
    expect(schema.serverName).toBe('riskready-risks');
  });

  it('fullName follows mcp__serverName__toolName pattern', () => {
    const validExamples: FullToolSchema[] = [
      {
        name: 'list_risks',
        fullName: 'mcp__riskready-risks__list_risks',
        description: '',
        inputSchema: {},
        serverName: 'riskready-risks',
      },
      {
        name: 'get_control',
        fullName: 'mcp__riskready-controls__get_control',
        description: '',
        inputSchema: {},
        serverName: 'riskready-controls',
      },
      {
        name: 'propose_create_incident',
        fullName: 'mcp__riskready-incidents__propose_create_incident',
        description: '',
        inputSchema: {},
        serverName: 'riskready-incidents',
      },
      {
        name: 'list_agent_tasks',
        fullName: 'mcp__riskready-agent-ops__list_agent_tasks',
        description: '',
        inputSchema: {},
        serverName: 'riskready-agent-ops',
      },
    ];

    for (const schema of validExamples) {
      expect(schema.fullName).toMatch(FULL_NAME_PATTERN);
    }
  });

  it('fullName is derived from serverName and name', () => {
    const serverName = 'riskready-organisation';
    const toolName = 'get_department';
    const fullName = `mcp__${serverName}__${toolName}`;

    expect(fullName).toBe('mcp__riskready-organisation__get_department');
    expect(fullName).toMatch(FULL_NAME_PATTERN);
  });

  it('rejects invalid fullName patterns', () => {
    const invalidFullNames = [
      'riskready-risks__list_risks',       // missing mcp__ prefix
      'mcp__riskready-risks',              // missing tool name segment
      'mcp____list_risks',                 // empty server name
      'mcp__riskready-risks__',            // empty tool name
    ];

    for (const name of invalidFullNames) {
      expect(name).not.toMatch(FULL_NAME_PATTERN);
    }
  });

  it('inputSchema can hold complex JSON schema objects', () => {
    const schema: FullToolSchema = {
      name: 'create_risk',
      fullName: 'mcp__riskready-risks__create_risk',
      description: 'Create a new risk',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Risk title' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          departmentId: { type: 'string', format: 'uuid' },
        },
        required: ['title', 'severity'],
      },
      serverName: 'riskready-risks',
    };

    expect(schema.inputSchema).toHaveProperty('type', 'object');
    expect(schema.inputSchema).toHaveProperty('properties');
    expect((schema.inputSchema as { required: string[] }).required).toContain('title');
  });
});
