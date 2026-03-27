import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

vi.mock('#src/prisma.js', () => {
  const m = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  });
  return {
    prisma: {
      mcpPendingAction: m(),
      organisationProfile: m(),
      assessment: m(),
      controlRecord: m(),
      statementOfApplicability: m(),
      sOAEntry: m(),
      soaEntry: m(),
      scopeItem: m(),
      assessmentTest: m(),
      controlMetric: m(),
      control: m(),
    },
  };
});

import { registerMutationTools } from './mutation-tools.js';

describe('controls — registerMutationTools', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test-controls', version: '0.1.0' });
  });

  it('is a function', () => {
    expect(typeof registerMutationTools).toBe('function');
  });

  it('registers without throwing', () => {
    expect(() => registerMutationTools(server)).not.toThrow();
  });

  it('registers all expected mutation tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);

    const registeredNames = toolSpy.mock.calls.map((call) => call[0]);

    // Assessment mutations
    expect(registeredNames).toContain('propose_assessment');
    expect(registeredNames).toContain('propose_update_assessment');
    expect(registeredNames).toContain('propose_delete_assessment');
    expect(registeredNames).toContain('propose_start_assessment');
    expect(registeredNames).toContain('propose_submit_assessment_review');
    expect(registeredNames).toContain('propose_complete_assessment');
    expect(registeredNames).toContain('propose_cancel_assessment');
    expect(registeredNames).toContain('propose_add_assessment_controls');
    expect(registeredNames).toContain('propose_remove_assessment_control');
    expect(registeredNames).toContain('propose_add_assessment_scope_items');
    expect(registeredNames).toContain('propose_remove_assessment_scope_item');
    expect(registeredNames).toContain('propose_populate_tests');
    expect(registeredNames).toContain('propose_bulk_assign_tests');

    // SOA mutations
    expect(registeredNames).toContain('propose_soa_entry_update');
    expect(registeredNames).toContain('propose_create_soa');
    expect(registeredNames).toContain('propose_create_soa_from_controls');
    expect(registeredNames).toContain('propose_create_soa_version');
    expect(registeredNames).toContain('propose_update_soa');
    expect(registeredNames).toContain('propose_submit_soa_review');
    expect(registeredNames).toContain('propose_approve_soa');
    expect(registeredNames).toContain('propose_delete_soa');

    // Scope item mutations
    expect(registeredNames).toContain('propose_scope_item');
    expect(registeredNames).toContain('propose_update_scope_item');
    expect(registeredNames).toContain('propose_delete_scope_item');

    // Test mutations
    expect(registeredNames).toContain('propose_test_result');
    expect(registeredNames).toContain('propose_remediation');
    expect(registeredNames).toContain('propose_update_test');
    expect(registeredNames).toContain('propose_assign_tester');
    expect(registeredNames).toContain('propose_update_root_cause');
    expect(registeredNames).toContain('propose_skip_test');

    // Control mutations
    expect(registeredNames).toContain('propose_control_status');
    expect(registeredNames).toContain('propose_create_control');
    expect(registeredNames).toContain('propose_update_control');
    expect(registeredNames).toContain('propose_disable_control');
    expect(registeredNames).toContain('propose_enable_control');

    // Metric mutations
    expect(registeredNames).toContain('propose_metric_value');
  });

  it('registers the correct total number of tools', () => {
    const toolSpy = vi.spyOn(server, 'tool');
    registerMutationTools(server);
    // 13 assessment + 8 SOA + 3 scope + 6 test + 5 control + 1 metric = 36
    expect(toolSpy).toHaveBeenCalledTimes(36);
  });
});
