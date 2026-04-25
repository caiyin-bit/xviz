import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Tests spawn the CLI which boots Puppeteer + Chrome. 30s headroom.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Each test file gets its own process so a hung Puppeteer doesn't
    // poison sibling tests.
    pool: 'forks',
    poolOptions: { forks: { singleFork: false } },
    include: ['test/**/*.test.mjs'],
    // Existing csv-compat is a plain Node script, leave it out of Vitest
    // (still runnable via `npm run test:csv`).
    exclude: ['node_modules', 'dist', 'test/csv-compat.test.mjs'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // CLI binaries under bin/ run in spawned subprocesses (Puppeteer +
      // child JSON-RPC), so V8 coverage in this parent process can't see
      // them. We instrument only what the parent actually imports —
      // currently just the test utilities. Real CLI behavior is verified
      // by the E2E tests, not by this percentage.
      include: ['test/util/**/*.mjs'],
      exclude: ['test/**/*.test.mjs', 'test/csv-compat.test.mjs'],
      reportsDirectory: 'coverage',
    },
  },
})
