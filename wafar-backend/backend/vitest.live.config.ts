// Live tests call real external APIs (Claude, etc.) and cost money.
// Run with `npm run test:live`. Never part of `npm run check` or CI.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.live.test.ts', 'test/**/*.live.test.ts'],
    environment: 'node',
    env: { LIVE_AI: '1' },
    passWithNoTests: true,
    testTimeout: 120_000,
  },
});
