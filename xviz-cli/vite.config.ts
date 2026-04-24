import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

// Build the renderer as a single self-contained HTML file (all JS+CSS inlined).
// The CLI loads it via puppeteer page.setContent() - no servers, no network.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'renderer/index.html'),
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
