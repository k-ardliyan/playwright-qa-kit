// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  // ── Global ignores ────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'reports/',
      '.auth/',
      'mcp-server/dist/',
    ],
  },

  // ── Base: ESLint + TypeScript recommended ─────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ── TypeScript file overrides ─────────────────────────────────────
  {
    files: ['**/*.ts'],
    rules: {
      // Relax rules yang terlalu strict untuk test code
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // ── Playwright test files ─────────────────────────────────────────
  {
    files: ['src/tests/**/*.spec.ts', 'example/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // expect().toBeTruthy() pattern yang kita pakai di smoke test
      'playwright/no-conditional-in-test': 'warn',
      // Disable expect-expect warning since page objects contain assertions
      'playwright/expect-expect': 'off',
    },
  },
);
