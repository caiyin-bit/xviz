import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', 'renderer/**']),
  {
    files: ['bin/**/*.mjs', 'test/**/*.mjs', 'vite.config.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
])
