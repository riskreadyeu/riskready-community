/** Fields whose values should be replaced with [REDACTED] in audit logs. */
export const SENSITIVE_FIELDS = new Set([
  'passwordHash',
  'password',
  'apiKey',
  'apiSecret',
  'secretKey',
  'accessToken',
  'refreshToken',
  'token',
  'encryptedApiKey',
  'encryptedSecret',
  'privateKey',
  'clientSecret',
]);

/** Models that should NOT be audit-logged (prevent recursion, reduce noise). */
export const EXCLUDED_MODELS = new Set([
  'AuditLog',
  'AuditEvent',
  'RefreshSession',
  'RiskScoreHistory',
  'RiskCalculationHistory',
  'KRIHistory',
  'CapacityRecord',
  'ScenarioStateHistory',
  'RiskEventLog',
  'AssessmentSnapshot',
  'BIAAssessmentHistory',
  'PolicyDocumentAuditLog',
  'VendorHistory',
  'TreatmentPlanHistory',
  'ChangeHistory',
]);

export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELDS.has(fieldName);
}

export function isExcludedModel(modelName: string): boolean {
  return EXCLUDED_MODELS.has(modelName);
}

/** Returns a shallow copy with sensitive field values replaced by [REDACTED]. */
export function maskSensitiveData(data: Record<string, any> | null): Record<string, any> | null {
  if (!data) return null;
  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    masked[key] = SENSITIVE_FIELDS.has(key) ? '[REDACTED]' : value;
  }
  return masked;
}
