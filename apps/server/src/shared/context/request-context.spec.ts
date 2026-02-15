import { RequestContext, requestContextStorage } from './request-context';

describe('RequestContext', () => {
  it('should return undefined when no context is set', () => {
    const ctx = RequestContext.current();
    expect(ctx).toBeUndefined();
  });

  it('should store and retrieve context within a run', (done) => {
    const testCtx = {
      userId: 'user-123',
      userEmail: 'test@example.com',
      organisationId: 'org-456',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      requestId: 'req-789',
    };

    requestContextStorage.run(testCtx, () => {
      const ctx = RequestContext.current();
      expect(ctx).toEqual(testCtx);
      expect(RequestContext.userId()).toBe('user-123');
      expect(RequestContext.userEmail()).toBe('test@example.com');
      expect(RequestContext.organisationId()).toBe('org-456');
      expect(RequestContext.requestId()).toBe('req-789');
      done();
    });
  });

  it('should isolate context between concurrent runs', (done) => {
    let finished = 0;
    const checkDone = () => {
      if (++finished === 2) done();
    };

    requestContextStorage.run({ userId: 'user-A' } as any, () => {
      setTimeout(() => {
        expect(RequestContext.userId()).toBe('user-A');
        checkDone();
      }, 10);
    });

    requestContextStorage.run({ userId: 'user-B' } as any, () => {
      setTimeout(() => {
        expect(RequestContext.userId()).toBe('user-B');
        checkDone();
      }, 10);
    });
  });
});
