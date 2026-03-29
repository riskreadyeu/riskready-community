import { describe, it, expect } from 'vitest';
import { scanAndRedactCredentials } from '../credential-scanner.js';

describe('scanAndRedactCredentials', () => {
  it('redacts GitHub tokens', () => {
    const { text, credentialsFound } = scanAndRedactCredentials('Token: ghp_ABCDEFghijklmnop1234567890abcdef12');
    expect(credentialsFound).toBe(true);
    expect(text).toContain('[REDACTED_GITHUB_TOKEN]');
  });

  it('redacts GCP API keys', () => {
    const { text, credentialsFound } = scanAndRedactCredentials('Key: AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe');
    expect(credentialsFound).toBe(true);
    expect(text).toContain('[REDACTED_GCP_KEY]');
  });

  it('redacts PEM private keys', () => {
    const { text, credentialsFound } = scanAndRedactCredentials('-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----');
    expect(credentialsFound).toBe(true);
    expect(text).toContain('[REDACTED_PRIVATE_KEY]');
  });

  it('redacts RSA PEM private keys', () => {
    const { text, credentialsFound } = scanAndRedactCredentials('-----BEGIN RSA PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END RSA PRIVATE KEY-----');
    expect(credentialsFound).toBe(true);
    expect(text).toContain('[REDACTED_PRIVATE_KEY]');
  });

  it('redacts Slack tokens', () => {
    const { text, credentialsFound } = scanAndRedactCredentials('Token: xoxb-1234567890-abcdefghijklmnop');
    expect(credentialsFound).toBe(true);
    expect(text).toContain('[REDACTED_SLACK_TOKEN]');
  });

  it('redacts existing patterns (Anthropic keys)', () => {
    const { text, credentialsFound } = scanAndRedactCredentials('Key: sk-ant-abcdefghijklmnopqrstuvwxyz');
    expect(credentialsFound).toBe(true);
    expect(text).toContain('[REDACTED_ANTHROPIC_KEY]');
  });

  it('redacts existing patterns (AWS keys)', () => {
    const { text, credentialsFound } = scanAndRedactCredentials('Key: AKIAIOSFODNN7EXAMPLE');
    expect(credentialsFound).toBe(true);
    expect(text).toContain('[REDACTED_AWS_KEY]');
  });

  it('does not redact normal text', () => {
    const { text, credentialsFound } = scanAndRedactCredentials('Risk R-01 is above tolerance');
    expect(credentialsFound).toBe(false);
    expect(text).toBe('Risk R-01 is above tolerance');
  });
});
