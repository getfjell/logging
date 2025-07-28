import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    include: ['./tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'src/index.ts',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 100,
          lines: 98,
          statements: 98,
        },
      },
      reportsDirectory: './coverage',
    },
  },
});
