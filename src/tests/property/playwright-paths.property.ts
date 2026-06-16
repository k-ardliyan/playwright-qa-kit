/// <reference types="node" />

// playwright-paths: PLAYWRIGHT_CONFIG, adapter env seam, JSON results path

import assert from 'node:assert/strict';
import {
  getAdapterConfigPath,
  getAdapterFixtureImport,
  getAdapterTestRoot,
  getJsonResultsPath,
  getPlaywrightConfigPath,
  getPlaywrightTestRoot,
  isAdapterSpecPath,
  isUnderAllowedTestRoot,
} from '../../../mcp-server/src/utils/playwright-paths';

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function runCase(label: string, assertFn: () => void): void {
  try {
    assertFn();
    process.stdout.write(`✓ ${label}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`✗ ${label}\n   ${message}\n`);
    process.exitCode = 1;
  }
}

runCase('default config path is playwright.config.ts', () => {
  withEnv({ PLAYWRIGHT_CONFIG: undefined, PLAYWRIGHT_RESULTS_JSON: undefined }, () => {
    assert.equal(getPlaywrightConfigPath(), 'playwright.config.ts');
  });
});

runCase('default JSON path is test-results/results.json', () => {
  withEnv({ PLAYWRIGHT_CONFIG: undefined, PLAYWRIGHT_RESULTS_JSON: undefined }, () => {
    assert.equal(getJsonResultsPath(), 'test-results/results.json');
  });
});

runCase('adapter config maps to erpku-results.json', () => {
  withEnv(
    {
      PLAYWRIGHT_CONFIG: 'example/erpku/playwright.config.ts',
      PLAYWRIGHT_RESULTS_JSON: undefined,
      PLAYWRIGHT_ADAPTER_CONFIG: undefined,
      PLAYWRIGHT_ADAPTER_RESULTS_JSON: undefined,
    },
    () => {
      assert.equal(getJsonResultsPath(), 'test-results/erpku-results.json');
    },
  );
});

runCase('PLAYWRIGHT_RESULTS_JSON override wins over config mapping', () => {
  withEnv(
    {
      PLAYWRIGHT_CONFIG: 'example/erpku/playwright.config.ts',
      PLAYWRIGHT_RESULTS_JSON: 'custom/output.json',
    },
    () => {
      assert.equal(getJsonResultsPath(), 'custom/output.json');
    },
  );
});

runCase('config path normalizes backslashes', () => {
  withEnv(
    {
      PLAYWRIGHT_CONFIG: 'example\\erpku\\playwright.config.ts',
      PLAYWRIGHT_RESULTS_JSON: undefined,
    },
    () => {
      assert.equal(getPlaywrightConfigPath(), 'example/erpku/playwright.config.ts');
    },
  );
});

runCase('default adapter test root is example/erpku/tests', () => {
  withEnv({ PLAYWRIGHT_ADAPTER_TEST_ROOT: undefined }, () => {
    assert.equal(getAdapterTestRoot(), 'example/erpku/tests');
  });
});

runCase('PLAYWRIGHT_ADAPTER_TEST_ROOT override is normalized', () => {
  withEnv({ PLAYWRIGHT_ADAPTER_TEST_ROOT: 'custom\\adapter\\tests\\' }, () => {
    assert.equal(getAdapterTestRoot(), 'custom/adapter/tests');
  });
});

runCase('isUnderAllowedTestRoot accepts adapter override path', () => {
  withEnv({ PLAYWRIGHT_ADAPTER_TEST_ROOT: 'packages/my-adapter/tests' }, () => {
    assert.equal(isUnderAllowedTestRoot('packages/my-adapter/tests/ui/smoke.spec.ts'), true);
    assert.equal(isUnderAllowedTestRoot('example/erpku/tests/ui/smoke.spec.ts'), false);
  });
});

runCase('isUnderAllowedTestRoot rejects out-of-root paths', () => {
  withEnv(
    {
      PLAYWRIGHT_TEST_ROOT: 'src/tests',
      PLAYWRIGHT_ADAPTER_TEST_ROOT: undefined,
    },
    () => {
      assert.equal(isUnderAllowedTestRoot('other/outside.spec.ts'), false);
    },
  );
});

runCase('PLAYWRIGHT_TEST_ROOT override still gates primary root', () => {
  withEnv({ PLAYWRIGHT_TEST_ROOT: 'custom/tests' }, () => {
    assert.equal(getPlaywrightTestRoot(), 'custom/tests');
    assert.equal(isUnderAllowedTestRoot('custom/tests/login.spec.ts'), true);
    assert.equal(isUnderAllowedTestRoot('src/tests/login.spec.ts'), false);
  });
});

runCase('isAdapterSpecPath uses adapter root', () => {
  withEnv({ PLAYWRIGHT_ADAPTER_TEST_ROOT: undefined }, () => {
    assert.equal(isAdapterSpecPath('example/erpku/tests/ui/auth/login.spec.ts'), true);
    assert.equal(isAdapterSpecPath('src/tests/seed.spec.ts'), false);
  });
});

runCase('getAdapterConfigPath defaults to erpku adapter config', () => {
  withEnv({ PLAYWRIGHT_ADAPTER_CONFIG: undefined }, () => {
    assert.equal(getAdapterConfigPath(), 'example/erpku/playwright.config.ts');
  });
});

runCase('getAdapterFixtureImport defaults to @erpku path', () => {
  withEnv({ PLAYWRIGHT_ADAPTER_FIXTURE_IMPORT: undefined }, () => {
    assert.equal(getAdapterFixtureImport(), '@erpku/fixtures/base.fixture');
  });
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

process.stdout.write('✓ Property: playwright-paths config and JSON seam\n');
