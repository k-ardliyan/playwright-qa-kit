import { test, expect } from '@playwright/test';
import { redactSensitiveData } from '../../shared/utils/redaction';
import type { NormalizedNetworkEvidence } from '../../shared/types/network-evidence.types';

test.describe('Network Evidence Redaction (MCP-050)', () => {
  test('redacts Authorization and Cookie headers in network evidence', () => {
    const evidence: NormalizedNetworkEvidence = {
      method: 'POST',
      url: 'https://api.example.com/v1/login?apiKey=super_secret_key_123',
      status: 200,
      durationMs: 145,
      safeHeaders: {
        'content-type': 'application/json',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjQyfQ.secret',
        cookie: 'session_token=secret_session_val_999; path=/',
      },
      bodyExcerpt: '{"token": "jwt_token_abc", "status": "ok"}',
      timestamp: new Date().toISOString(),
    };

    const sanitized = redactSensitiveData(evidence);

    expect(sanitized.safeHeaders?.['content-type']).toBe('application/json');
    expect(sanitized.safeHeaders?.authorization).toBe('[REDACTED]');
    expect(sanitized.safeHeaders?.cookie).toBe('[REDACTED]');
    expect(sanitized.url).not.toContain('super_secret_key_123');
    expect(sanitized.url).toContain('apiKey=[REDACTED]');
    // JSON body excerpts are parsed and their secret keys redacted.
    expect(sanitized.bodyExcerpt).toContain('"token":"[REDACTED]"');
    expect(sanitized.bodyExcerpt).not.toContain('jwt_token_abc');
  });

  test('redacts password and secret keys in request payloads', () => {
    const payload = {
      username: 'qa_user',
      password: 'MyPassword123!',
      otp: '123456',
      metadata: {
        api_key: 'key_xyz_987',
      },
    };

    const sanitized = redactSensitiveData(payload);

    expect(sanitized.username).toBe('qa_user');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.otp).toBe('[REDACTED]');
    expect(sanitized.metadata.api_key).toBe('[REDACTED]');
  });
});
