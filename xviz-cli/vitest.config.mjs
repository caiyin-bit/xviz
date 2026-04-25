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
  },
})
