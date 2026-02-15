import { createAuditMiddleware, computeChangedFields } from './prisma-audit.middleware';

describe('PrismaAuditMiddleware', () => {
  describe('computeChangedFields', () => {
    it('should detect changed fields between old and new data', () => {
      const oldData = { name: 'Old', status: 'DRAFT', description: 'Same' };
      const newData = { name: 'New', status: 'ACTIVE', description: 'Same' };
      const changed = computeChangedFields(oldData, newData);
      expect(changed).toEqual(['name', 'status']);
    });

    it('should detect added fields', () => {
      const oldData = { name: 'Test' };
      const newData = { name: 'Test', status: 'ACTIVE' };
      const changed = computeChangedFields(oldData, newData);
      expect(changed).toEqual(['status']);
    });

    it('should return empty array for identical objects', () => {
      const data = { name: 'Same', status: 'DRAFT' };
      const changed = computeChangedFields(data, data);
      expect(changed).toEqual([]);
    });

    it('should handle null old data (create)', () => {
      const changed = computeChangedFields(null, { name: 'New' });
      expect(changed).toEqual([]);
    });
  });

  describe('createAuditMiddleware', () => {
    let mockPrisma: any;
    let middleware: any;

    beforeEach(() => {
      mockPrisma = {
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        },
      };
      middleware = createAuditMiddleware(mockPrisma);
    });

    it('should skip excluded models', async () => {
      const next = jest.fn().mockResolvedValue({ id: '1' });
      const params = { model: 'AuditLog', action: 'create', args: { data: {} } };

      await middleware(params, next);

      expect(next).toHaveBeenCalledWith(params);
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should skip read operations', async () => {
      const next = jest.fn().mockResolvedValue([]);
      const params = { model: 'Control', action: 'findMany', args: {} };

      await middleware(params, next);

      expect(next).toHaveBeenCalledWith(params);
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should log create operations', async () => {
      const next = jest.fn().mockResolvedValue({ id: 'ctrl-1', name: 'Test Control' });
      const params = { model: 'Control', action: 'create', args: { data: { name: 'Test Control' } } };

      await middleware(params, next);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CREATE',
          model: 'Control',
          recordId: 'ctrl-1',
          newData: expect.objectContaining({ name: 'Test Control' }),
        }),
      });
    });

    it('should mask sensitive fields in audit data', async () => {
      const result = { id: 'user-1', email: 'test@test.com', passwordHash: '$2b$12$secret' };
      const next = jest.fn().mockResolvedValue(result);
      const params = { model: 'User', action: 'create', args: { data: result } };

      await middleware(params, next);

      const auditCall = mockPrisma.auditLog.create.mock.calls[0][0];
      expect(auditCall.data.newData.passwordHash).toBe('[REDACTED]');
      expect(auditCall.data.newData.email).toBe('test@test.com');
    });

    it('should not block the main operation if audit logging fails', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('DB error'));
      const next = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });
      const params = { model: 'Control', action: 'create', args: { data: { name: 'Test' } } };

      const result = await middleware(params, next);

      expect(result).toEqual({ id: '1', name: 'Test' });
    });
  });
});
