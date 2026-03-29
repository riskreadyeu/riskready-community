import { stripMcpMeta, prepareCreatePayload } from '../types';

describe('stripMcpMeta', () => {
  it('removes all MCP metadata fields', () => {
    const payload = {
      title: 'Test Risk',
      organisationId: 'org-1',
      reason: 'testing',
      mcpSessionId: 'session-123',
      mcpToolName: 'propose_create_risk',
      description: 'A risk',
    };

    const result = stripMcpMeta(payload);

    expect(result).toEqual({
      title: 'Test Risk',
      description: 'A risk',
    });
    expect(result).not.toHaveProperty('organisationId');
    expect(result).not.toHaveProperty('reason');
    expect(result).not.toHaveProperty('mcpSessionId');
    expect(result).not.toHaveProperty('mcpToolName');
  });

  it('returns payload unchanged when no MCP fields present', () => {
    const payload = { title: 'Clean', status: 'OPEN' };

    const result = stripMcpMeta(payload);

    expect(result).toEqual({ title: 'Clean', status: 'OPEN' });
  });

  it('does not mutate the original payload', () => {
    const payload = { title: 'Test', reason: 'remove me' };
    const original = { ...payload };

    stripMcpMeta(payload);

    expect(payload).toEqual(original);
  });

  it('handles empty payload', () => {
    const result = stripMcpMeta({});
    expect(result).toEqual({});
  });

  it('passes through extra fields not in the strip list', () => {
    const payload = {
      title: 'Risk',
      customField: 'keep',
      organisationId: 'remove',
      nested: { deep: true },
    };

    const result = stripMcpMeta(payload);

    expect(result).toEqual({
      title: 'Risk',
      customField: 'keep',
      nested: { deep: true },
    });
  });
});

describe('prepareCreatePayload', () => {
  it('strips MCP-only fields (reason, mcpSessionId, mcpToolName)', () => {
    const payload = {
      title: 'Risk',
      reason: 'creating a risk',
      mcpSessionId: 'sess-1',
      mcpToolName: 'propose_create_risk',
      organisationId: 'org-1',
    };

    const result = prepareCreatePayload(payload);

    expect(result).not.toHaveProperty('reason');
    expect(result).not.toHaveProperty('mcpSessionId');
    expect(result).not.toHaveProperty('mcpToolName');
    // organisationId is NOT stripped by default (only MCP_ONLY_KEYS)
    expect(result).toHaveProperty('organisationId', 'org-1');
    expect(result).toHaveProperty('title', 'Risk');
  });

  it('converts organisationId to relational connect when relationalOrg is true', () => {
    const payload = {
      title: 'Risk',
      organisationId: 'org-1',
      createdBy: 'user-1',
      createdById: 'user-1',
      reason: 'test',
    };

    const result = prepareCreatePayload(payload, { relationalOrg: true });

    expect(result).not.toHaveProperty('organisationId');
    expect(result).not.toHaveProperty('createdBy');
    expect(result).not.toHaveProperty('createdById');
    expect(result).toHaveProperty('organisation', { connect: { id: 'org-1' } });
    expect(result).toHaveProperty('title', 'Risk');
  });

  it('does not add organisation connect when organisationId is missing', () => {
    const payload = { title: 'Risk', reason: 'test' };

    const result = prepareCreatePayload(payload, { relationalOrg: true });

    expect(result).not.toHaveProperty('organisation');
    expect(result).toHaveProperty('title', 'Risk');
  });

  it('converts relational fields to connect syntax', () => {
    const payload = {
      title: 'Risk',
      departmentId: 'dept-1',
      ownerId: 'user-1',
      reason: 'test',
    };

    const result = prepareCreatePayload(payload, {
      relationalFields: {
        departmentId: 'department',
        ownerId: 'owner',
      },
    });

    expect(result).not.toHaveProperty('departmentId');
    expect(result).not.toHaveProperty('ownerId');
    expect(result).toHaveProperty('department', { connect: { id: 'dept-1' } });
    expect(result).toHaveProperty('owner', { connect: { id: 'user-1' } });
  });

  it('skips relational conversion for null/undefined fields but keeps null value', () => {
    const payload = {
      title: 'Risk',
      departmentId: null,
      reason: 'test',
    };

    const result = prepareCreatePayload(payload, {
      relationalFields: { departmentId: 'department' },
    });

    // null values are not converted to connect syntax
    expect(result).not.toHaveProperty('department');
    // The null value remains since the condition skips null/undefined
    expect(result).toHaveProperty('departmentId', null);
  });

  it('combines relationalOrg and relationalFields', () => {
    const payload = {
      title: 'Risk',
      organisationId: 'org-1',
      categoryId: 'cat-1',
      reason: 'test',
      mcpSessionId: 'sess-1',
      mcpToolName: 'tool',
    };

    const result = prepareCreatePayload(payload, {
      relationalOrg: true,
      relationalFields: { categoryId: 'category' },
    });

    expect(result).toEqual({
      title: 'Risk',
      organisation: { connect: { id: 'org-1' } },
      category: { connect: { id: 'cat-1' } },
    });
  });

  it('does not mutate the original payload', () => {
    const payload = { title: 'Risk', reason: 'test' };
    const original = { ...payload };

    prepareCreatePayload(payload);

    expect(payload).toEqual(original);
  });
});
