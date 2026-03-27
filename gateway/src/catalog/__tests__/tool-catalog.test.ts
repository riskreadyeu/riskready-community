import { describe, it, expect, beforeEach } from 'vitest';
import { ToolCatalog } from '../tool-catalog';

describe('ToolCatalog', () => {
  let catalog: ToolCatalog;

  beforeEach(() => {
    catalog = new ToolCatalog([
      {
        serverName: 'riskready-risks',
        tools: [
          { name: 'list_risks', description: 'List all risks in the risk register', args: ['organisationId', 'status', 'tier'] },
          { name: 'propose_create_risk', description: 'Propose creating a new risk entry', args: ['title', 'description', 'tier', 'likelihood', 'impact'] },
        ],
      },
      {
        serverName: 'riskready-controls',
        tools: [
          { name: 'list_controls', description: 'List security controls', args: ['framework', 'status'] },
          { name: 'propose_create_control', description: 'Propose creating a new control', args: ['title', 'description', 'framework'] },
        ],
      },
      {
        serverName: 'riskready-audits',
        tools: [
          { name: 'list_nonconformities', description: 'List audit nonconformities and findings', args: ['status', 'severity'] },
        ],
      },
    ]);
  });

  it('should search by keyword and return matching tools', () => {
    const results = catalog.search('risk');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.toolName === 'list_risks')).toBe(true);
  });

  it('should return the server names for matched tools', () => {
    const results = catalog.search('risk');
    const servers = catalog.getServersForTools(results);
    expect(servers).toContain('riskready-risks');
  });

  it('should match on description content', () => {
    const results = catalog.search('register');
    expect(results.some(r => r.toolName === 'list_risks')).toBe(true);
  });

  it('should match on argument names', () => {
    const results = catalog.search('framework');
    const servers = catalog.getServersForTools(results);
    expect(servers).toContain('riskready-controls');
  });

  it('should return empty for no matches', () => {
    const results = catalog.search('xyznonexistent');
    expect(results).toHaveLength(0);
  });

  it('should always include agent-ops server', () => {
    const results = catalog.search('risk');
    const servers = catalog.getServersForTools(results);
    expect(servers).toContain('riskready-agent-ops');
  });

  it('should rank rare terms higher (IDF)', () => {
    const results = catalog.search('nonconformities');
    expect(results[0].serverName).toBe('riskready-audits');
  });

  it('should rank name matches higher than description-only', () => {
    const results = catalog.search('risk');
    const nameMatchIdx = results.findIndex(r => r.toolName.includes('risk'));
    expect(nameMatchIdx).toBe(0);
  });

  it('should handle empty query', () => {
    const results = catalog.search('');
    expect(results).toHaveLength(0);
  });

  it('should handle multi-word queries', () => {
    const results = catalog.search('create risk');
    expect(results.some(r => r.toolName === 'propose_create_risk')).toBe(true);
  });
});
