import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['build', 'dist', 'node_modules', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['scripts/**/*.mjs', 'vite/**/*.ts', 'vite.config.ts', 'vitest.config.ts', 'playwright.config.ts', 'tests/e2e/**/*.ts', 'tests/support/e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Playwright's fixture callback is named `use`, which trips the hooks rule.
    files: ['tests/e2e/**/*.ts', 'tests/support/e2e/**/*.ts'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
    },
  },
);
