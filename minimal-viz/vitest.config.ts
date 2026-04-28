import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // transformProps tests are pure functions; React component tests use SSR
    // (renderToStaticMarkup), both happy with Node env.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      // lcov → Codecov; html → human-friendly report; text → console summary.
      reporter: ['text', 'lcov', 'html'],
      // We measure the library code only, not its tests, demos, or build configs.
      include: ['src/viz/**/*.ts', 'src/viz/**/*.tsx'],
      exclude: ['src/viz/**/*.test.ts', 'src/viz/**/*.test.tsx'],
      reportsDirectory: 'coverage',
    },
  },
})
