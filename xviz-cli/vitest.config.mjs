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
      // The bin/ scripts run in spawned subprocesses — V8 coverage in this
      // parent process won't capture them. We still measure: csv parser
      // (used in tests indirectly is fine), the test/util/ helpers, and
      // anything imported synchronously. Coverage % will be modest by
      // design — real correctness lives in the E2E tests.
      include: ['bin/**/*.mjs', 'test/util/**/*.mjs'],
      exclude: ['test/**/*.test.mjs', 'test/csv-compat.test.mjs', 'test/mcp-client.mjs'],
      reportsDirectory: 'coverage',
    },
  },
})
