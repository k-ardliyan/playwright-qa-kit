import { test, expect } from '@playwright/test';
import { redactSensitiveData, isSensitiveKey } from '../../shared/utils/redaction';

test.describe('Auth Secrets Redaction (MCP-030)', () => {
  test('identifies sensitive key names correctly', () => {
    expect(isSensitiveKey('Authorization')).toBe(true);
    expect(isSensitiveKey('cookie')).toBe(true);
    expect(isSensitiveKey('Set-Cookie')).toBe(true);
    expect(isSensitiveKey('access_token')).toBe(true);
    expect(isSensitiveKey('refresh_token')).toBe(true);
    expect(isSensitiveKey('password')).toBe(true);
    expect(isSensitiveKey('apiKey')).toBe(true);
    expect(isSensitiveKey('otp')).toBe(true);
    expect(isSensitiveKey('userName')).toBe(false);
    expect(isSensitiveKey('status')).toBe(false);
  });

  test('redacts bearer tokens in string messages', () => {
    const raw = 'Failed request with header Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.secret';
    const redacted = redactSensitiveData(raw);
    expect(redacted).toBe('Failed request with header Authorization: Bearer [REDACTED]');
  });

  test('redacts Basic auth credentials in string messages', () => {
    const raw = 'Proxy requires Authorization: Basic dXNlcjpwYXNzMTIz';
    const redacted = redactSensitiveData(raw);
    expect(redacted).toBe('Proxy requires Authorization: Basic [REDACTED]');
  });

  test('redacts otp and token values in query strings', () => {
    const raw = 'api failed with otp=482913&token=abc.def&next=/home';
    const redacted = redactSensitiveData(raw);
    expect(redacted).toBe('api failed with otp=[REDACTED]&token=[REDACTED]&next=/home');
  });

  test('redacts entire Cookie and Set-Cookie header values in strings', () => {
    expect(redactSensitiveData('Cookie: session=abc123; HttpOnly')).toBe('Cookie: [REDACTED]');
    expect(redactSensitiveData('Set-Cookie: sessionId=xyz')).toBe('Set-Cookie: [REDACTED]');
  });

  test('redacts csrf tokens in nested objects', () => {
    const payload = { _csrf: 'token123', userId: 7 };
    const redacted = redactSensitiveData(payload);
    expect(redacted._csrf).toBe('[REDACTED]');
    expect(redacted.userId).toBe(7);
  });

  test('redacts sensitive headers in payload objects', () => {
    const headers = {
      'content-type': 'application/json',
      authorization: 'Bearer secret_token_123',
      cookie: 'session_id=abc123xyz; secure',
    };

    const redacted = redactSensitiveData(headers);
    expect(redacted['content-type']).toBe('application/json');
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.cookie).toBe('[REDACTED]');
  });

  test('redacts nested credentials in auth state objects', () => {
    const state = {
      user: {
        id: 42,
        email: 'admin@example.com',
        password: 'SuperSecretPassword123!',
        tokens: {
          access_token: 'jwt_access_token_xyz',
          refresh_token: 'jwt_refresh_token_abc',
        },
      },
    };

    const redacted = redactSensitiveData(state);
    expect(redacted.user.id).toBe(42);
    expect(redacted.user.email).toBe('admin@example.com');
    expect(redacted.user.password).toBe('[REDACTED]');
    expect(redacted.user.tokens.access_token).toBe('[REDACTED]');
    expect(redacted.user.tokens.refresh_token).toBe('[REDACTED]');
  });
});
