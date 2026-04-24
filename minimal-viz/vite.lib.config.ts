import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Library build. Emits:
//   dist/index.js   (ESM)
//   dist/index.cjs  (CJS)
//   dist/index.d.ts (types)
//
// Peer deps (react, react-dom, echarts) are externalized — the consumer must
// install them. This keeps the published bundle tiny.
export default defineConfig({
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/viz/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        /^echarts(\/.*)?$/,
      ],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM', echarts: 'echarts' },
      },
    },
  },
})
