import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // transformProps tests are pure functions — Node env is sufficient.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
