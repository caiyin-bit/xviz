import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // transformProps tests are pure functions — Node env is sufficient.
    environment: 'node',
    include: ['src/**/*.test.ts'],
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
