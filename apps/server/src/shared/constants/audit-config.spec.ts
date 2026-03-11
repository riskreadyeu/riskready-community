import { SENSITIVE_FIELDS, EXCLUDED_MODELS, isSensitiveField, isExcludedModel, maskSensitiveData } from './audit-config';

describe('AuditConfig', () => {
  describe('isSensitiveField', () => {
    it('should identify passwordHash as sensitive', () => {
      expect(isSensitiveField('passwordHash')).toBe(true);
    });

    it('should identify apiKey as sensitive', () => {
      expect(isSensitiveField('apiKey')).toBe(true);
    });

    it('should not identify name as sensitive', () => {
      expect(isSensitiveField('name')).toBe(false);
    });
  });

  describe('isExcludedModel', () => {
    it('should exclude AuditLog', () => {
      expect(isExcludedModel('AuditLog')).toBe(true);
    });

    it('should exclude RefreshSession', () => {
      expect(isExcludedModel('RefreshSession')).toBe(true);
    });

    it('should not exclude Control', () => {
      expect(isExcludedModel('Control')).toBe(false);
    });
  });

  describe('maskSensitiveData', () => {
    it('should replace sensitive field values with [REDACTED]', () => {
      const data = {
        id: '123',
        email: 'user@test.com',
        passwordHash: '$2b$12$abc',
        apiKey: 'sk-secret-key',
        name: 'Test User',
      };

      const masked = maskSensitiveData(data)!;

      expect(masked['id']).toBe('123');
      expect(masked['email']).toBe('user@test.com');
      expect(masked['passwordHash']).toBe('[REDACTED]');
      expect(masked['apiKey']).toBe('[REDACTED]');
      expect(masked['name']).toBe('Test User');
    });

    it('should return null for null input', () => {
      expect(maskSensitiveData(null)).toBeNull();
    });

    it('should handle empty objects', () => {
      expect(maskSensitiveData({})).toEqual({});
    });
  });
});
