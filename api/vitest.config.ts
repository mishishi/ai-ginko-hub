import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    env: {
      JWT_SECRET: 'test-secret-for-unit-tests-only',
      CLERK_SECRET_KEY: 'test-clerk-secret-key',
    },
  },
});
