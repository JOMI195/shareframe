import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@tests': path.resolve(import.meta.dirname, 'tests/support'),
      // Vite resolves the node build here, whose multipart serialization uses the
      // form-data package and cannot handle a jsdom File. The app ships this one.
      axios: 'axios/dist/browser/axios.cjs',
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./tests/support/setup/vitest.setup.ts'],
    include: ['tests/{unit,integration}/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'build/**'],
    restoreMocks: true,
    clearMocks: true,
    // Rendering a whole route tree under coverage instrumentation outruns the 5s default.
    testTimeout: 15_000,
    // The root .env files are gitignored; committed tests must not depend on them.
    env: {
      TZ: 'UTC',
      VITE_API_BASE_URL: 'http://localhost:8000/api',
      VITE_API_MEDIA_BASE_URL: 'http://localhost:8000',
      VITE_APP_PRODUCTION: 'False',
      VITE_APP_BUILD_VERSION: 'test-build',
      VITE_APP_COOKIE_CONSENT_LIFETIME: '30',
      VITE_APP_IMAGES_AUTO_DELETE_INTERVAL_HOURS: '3',
      VITE_APP_UPLOADED_FILES_FILE_FORMATS: 'jpg jpeg png',
      VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE: '15',
      VITE_APP_UPLOADED_FILES_MAX_FILES_TOTAL: '100',
      VITE_APP_UPLOADED_FILES_MAX_SIZE_MB: '20',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: ['src/types/**', 'src/assets/**', 'src/**/*.d.ts'],
      // The measured baseline, rounded down. Raise it, never lower it.
      thresholds: { statements: 80, branches: 66, functions: 72, lines: 80 },
    },
  },
});
