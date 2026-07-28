# Environment-Specific Guidelines for Playwright QA Kit

> **Purpose:** Document differences between local, staging, and production environments  
> **When to use:** When tests fail in non-local environments or during CI/CD setup  
> **Related:** [AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🌍 Environment Comparison Matrix

| Aspect              | Local (default)                  | Staging (`APP_ENV=staging`)   | Production (`APP_ENV=production`) |
| ------------------- | -------------------------------- | ----------------------------- | --------------------------------- |
| **BASE_URL**        | `http://localhost:3000`          | `https://staging.example.com` | `https://app.example.com`         |
| **Node Env**        | Not used for routing             | Not used for routing          | Not used for routing              |
| **Auth Flow**       | OTP via browser (recommended)    | Same + possible rate limits   | Same + stricter timeouts          |
| **SSL/Cert**        | Bypassed (localhost)             | Valid cert required           | Strict validation                 |
| **Network Mocks**   | Full control                     | Some blocked by proxy         | External calls restricted         |
| **HEADLESS**        | Optional (recommended for speed) | Required                      | Required                          |
| **Session Timeout** | 2 hours (configurable)           | 1 hour                        | 30 minutes                        |
| **Rate Limiting**   | Disabled                         | Enabled (100 req/min)         | Aggressive (50 req/min)           |
| **Feature Flags**   | All enabled                      | Partial (A/B testing)         | Controlled release                |
| **CORS Policy**     | Relaxed                          | Standard                      | Strict origin check               |
| **WAF Rules**       | Disabled                         | Basic rules                   | Full protection active            |

---

## 🔑 Auth Setup per Environment

### Directory Structure

```
.auth/
├── local/
│   ├── user.json
│   ├── super-admin.json
│   ├── finance.json
│   ├── hrd.json
│   └── admin.json
├── staging/
│   ├── user.json
│   ├── super-admin.json
│   ├── finance.json
│   ├── hrd.json
│   └── admin.json
└── production/
    ├── user.json
    ├── super-admin.json
    ├── finance.json
    ├── hrd.json
    └── admin.json
```

**Important:** Auth files are **NOT portable** across environments. Each requires fresh login.

### Setup Workflow

#### Option A: Wizard (Recommended)

```bash
npm run setup:wizard
# Interactive prompts:
# 1. Project path
# 2. APP_ENV: local | staging | production
# 3. BASE_URL verification
# 4. AUTH_CHALLENGE_MODE: otp-browser (local) / auto (prod)
```

#### Option B: Manual Auth Setup

```bash
# Staging environment
APP_ENV=staging npx playwright auth.setup

# Production environment (headed mode required for OTP)
APP_ENV=production HEADLESS=false npx playwright auth.setup
```

#### Option C: Headless with OTP via stdin

```bash
# Only for internal trusted environments
AUTH_CHALLENGE_MODE=otp-stdin HEADLESS=true APP_ENV=staging npx playwright auth.setup
# Then enter OTP when prompted in terminal
```

---

## 🚨 Common Environment-Specific Failures

### Local Environment

| Error Pattern                         | Root Cause              | Solution                                    |
| ------------------------------------- | ----------------------- | ------------------------------------------- |
| `FileNotFound: .auth/local/user.json` | No auth setup run       | Run `npx playwright auth.setup --env=local` |
| `ECONNREFUSED localhost:3000`         | Backend not running     | Start backend: `npm run dev:backend`        |
| `NET::ERR_CERT_COMMON_NAME_INVALID`   | Self-signed cert (rare) | Add `--ignore-https-errors` in config       |

### Staging Environment

| Error Pattern             | Root Cause                            | Solution                                          |
| ------------------------- | ------------------------------------- | ------------------------------------------------- |
| `Timeout waiting for OTP` | OTP SMS/email delayed                 | Increase `AUTH_CHALLENGE_TIMEOUT_MS=180000`       |
| `ERR_TOO_MANY_REQUESTS`   | Rate limiting from third-party API    | Use `@network` mock pattern instead of real calls |
| `ERR_CERT_DATE_INVALID`   | Staging cert misconfigured (uncommon) | Report to DevOps; add exception in test if urgent |
| `StorageState mismatch`   | Cookie domain scope changed           | Clear `.auth/staging/` and re-run auth.setup      |
| `302 redirect loop`       | Feature flag inconsistency            | Check FEATURE_FLAG configurations in env file     |

### Production Environment

| Error Pattern                   | Root Cause                    | Solution                                                      |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| `403 Forbidden (WAF)`           | Automation signature detected | Add `navigator.webdriver = false` in fixture                  |
| `Session expired before action` | Shorter timeout than expected | Increase page timeouts: `page.setDefaultTimeout(60000)`       |
| `CORS policy violation`         | Cross-origin API call blocked | Ensure API is on same subdomain or CORS headers set correctly |
| `CAPTCHA challenge`             | Suspicious activity detection | Mark scenario as `(@manual)`; use `test.skip()`               |
| `SSL handshake failed`          | Outdated TLS version          | Update Node.js or adjust `--tls-min-v1.2` flag                |

---

## 🛠️ Environment Configuration

### `.env.local` (Local Development)

```bash
APP_ENV=local
BASE_URL=http://localhost:3000
AUTH_CHALLENGE_MODE=otp-browser
HEADLESS=false  # Set true for faster CI-like runs
SLOW_MO=100     # Slow motion for debugging
AUTH_CHALLENGE_TIMEOUT_MS=120000
```

### `.env.staging` (Staging)

```bash
APP_ENV=staging
BASE_URL=https://staging.example.com
AUTH_CHALLENGE_MODE=otp-browser  # or otp-stdin for CI
HEADLESS=true
SLOW_MO=0
AUTH_CHALLENGE_TIMEOUT_MS=180000  # Longer for OTP delays
```

### `.env.production` (Production)

```bash
APP_ENV=production
BASE_URL=https://app.example.com
AUTH_CHALLENGE_MODE=auto  # Auto-detect CAPTCHA/OTP
HEADLESS=true
SLOW_MO=0
AUTH_CHALLENGE_TIMEOUT_MS=120000
RATE_LIMIT_ENABLED=true
```

**Note:** Never commit `.env.*` files to Git. They are in `.gitignore`.

---

## ⚙️ Environment-Aware Test Adjustments

### Conditional Skip for Environment-Specific Features

```typescript
import { test } from '@/fixtures/base.fixture';

test.describe('Feature X', () => {
  // Skip feature flags that are only available in local
  test.skip(process.env.APP_ENV !== 'local', 'Feature flag only available in local environment');

  test('local-only experiment', async ({ page }) => {
    // This test only runs in local
    await page.goto('/experimental-feature');
  });
});
```

### Dynamic Timeouts Based on Environment

```typescript
import { test } from '@/fixtures/base.fixture';

const ENV_TIMEOUT = {
  local: 30000,
  staging: 45000, // More time for network latency
  production: 60000, // Even more for prod slowdowns
};

test.use({
  timeout: ENV_TIMEOUT[process.env.APP_ENV || 'local'],
});
```

### Mock Third-Party Services

For staging/production where you can't intercept all external calls:

```typescript
import { mockJson, unmockAll } from '@/support/pw';

test('graceful degradation when payment gateway is down', async ({ page }) => {
  // Mock only the specific external service
  await mockJson(page, 'POST', '**/api/payment/gateway/**', 503, {
    error: 'Payment gateway temporarily unavailable',
  });

  // Proceed with test - assert UI shows friendly error message
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByText('Payment gateway unavailable')).toBeVisible();

  // Cleanup mocks
  await unmockAll(page);
});
```

---

## 🔄 Environment Transition Checklist

Before promoting tests from local → staging → production:

### Pre-Staging Checklist

- [ ] Base URL verified in `.env.staging`
- [ ] Auth credentials updated (staging database users)
- [ ] Rate limit headers reviewed in response samples
- [ ] Feature flag consistency confirmed with staging team
- [ ] SSL certificate validity checked
- [ ] HEADLESS mode tested successfully
- [ ] OTP delivery confirmed (SMS/email working)
- [ ] WAF rules don't block automation patterns

### Pre-Production Checklist

- [ ] Auth flow tested with real credentials (not demo accounts)
- [ ] Session timeout validated against production policies
- [ ] CAPTCHA challenges handled gracefully (skip vs break)
- [ ] WAF whitelisting configured for test IPs
- [ ] CORS policies verified for cross-origin APIs
- [ ] Network mocks cover all critical failures
- [ ] Compliance/privacy requirements met (no PII in logs)
- [ ] Disaster recovery tested (what if OTP fails?)

---

## 🧪 Testing Environment Parity

### Best Practices for Realistic Tests

1. **Use Staging Credentails for Production-Like Tests**
   - Don't rely solely on local tests
   - Run subset of critical paths in staging nightly

2. **Mock What You Can Control**
   - Internal APIs: full control
   - Third-party services: mock failures, not success flows

3. **Document Environment Dependencies**

   ```markdown
   ### SC-04: Payment integration (@success @network-assert)

   **Environment:** Requires staging or production
   **Reason:** Payment gateway sandbox not available locally

   **Input Data:**

   - method: POST
   - urlIncludes: /api/payment/process
   - status: [200]
   ```

4. **Fail Fast in Untrusted Environments**
   ```typescript
   test('critical checkout flow', async ({ page }) => {
     // Validate we're on a testable environment first
     const currentUrl = page.url();
     test.expect(
       ['local', 'staging'].includes(currentUrl.split(':')[0]),
       'Test cannot run on unknown environment',
     );

     // Continue with test...
   });
   ```

---

## 🔍 Troubleshooting Environment Issues

### Quick Diagnosis Commands

```bash
# Check which environment we're targeting
echo $APP_ENV

# Verify BASE_URL accessibility
curl -I $BASE_URL

# Check auth state existence
ls -la .auth/$APP_ENV/

# Test network latency to target
ping -c 3 $BASE_URL

# Inspect cookies after auth
node -e "console.log(require('./.auth/$APP_ENV/user.json').cookies.map(c => `${c.name}=${c.value}`))"
```

### Debug Mode Enablement

Add to `playwright.config.ts` temporarily:

```typescript
export default defineConfig({
  // ...
  use: {
    // Slower motion for debugging
    slowMo: process.env.DEBUG_SLOWMO ? 500 : 0,

    // Record video for failures
    recordVideo: process.env.DEBUG_VIDEO ? 'on-failure' : undefined,

    // Keep browser open after failure
    _option_browserClose: 'never',
  },

  // Override for debug runs
  config:
    process.env.DEBUG_MODE === 'true'
      ? {
          timeout: 120000,
          retries: 0,
        }
      : {},
});
```

Usage:

```bash
DEBUG_MODE=true DEBUG_VIDEO=1 APP_ENV=staging npx playwright test
```

---

## 📊 Environment Health Monitoring

### Automated Checks

Create `scripts/check-env-health.ts`:

```typescript
/**
 * Validates environment readiness before test execution
 */
import { readFileSync } from 'fs';
import { existsSync } from 'path';

interface EnvHealthCheck {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function checkEnvHealth(): EnvHealthCheck {
  const env = process.env.APP_ENV || 'local';
  const result: EnvHealthCheck = { ok: true, errors: [], warnings: [] };

  // Check BASE_URL reachability
  try {
    const response = fetch(process.env.BASE_URL || '');
    if (!response.ok) {
      result.errors.push(`BASE_URL ${process.env.BASE_URL} returned ${response.status}`);
      result.ok = false;
    }
  } catch (err) {
    result.errors.push(`Cannot reach BASE_URL: ${(err as Error).message}`);
    result.ok = false;
  }

  // Check auth state files
  const authDir = `.auth/${env}/`;
  if (!existsSync(authDir)) {
    result.warnings.push(`No auth state found in ${authDir}`);
  } else {
    const roles = ['user', 'super-admin', 'finance', 'hrd', 'admin'];
    const missingRoles = roles.filter((role) => !existsSync(`${authDir}${role}.json`));
    if (missingRoles.length > 0) {
      result.warnings.push(`Missing auth states for: ${missingRoles.join(', ')}`);
    }
  }

  return result;
}
```

Call at test start:

```typescript
import { checkEnvHealth } from '../scripts/check-env-health';

test.describe.configure({ mode: 'parallel' });

test.beforeAll(() => {
  const health = checkEnvHealth();
  if (!health.ok) {
    throw new Error(`Environment health check failed:\n${health.errors.join('\n')}`);
  }
  if (health.warnings.length > 0) {
    console.warn('Environment warnings:', health.warnings.join('\n'));
  }
});
```

---

## 🎯 Summary

- ✅ **Separate auth files per environment** - never share across envs
- ✅ **Adjust timeouts for staging/prod** - more network latency expected
- ✅ **Mock external dependencies** - reduce flakiness in non-local envs
- ✅ **Follow transition checklist** - validate each step before promotion
- ✅ **Document environment-specific scenarios** - mark in requirement metadata

---

_Last updated: 2026-07-28_  
_Author: Engineering Team_  
_Related: [AUTH-CONTEXT-CONVENTION.md](AUTH-CONTEXT-CONVENTION.md)_
