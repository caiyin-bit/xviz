import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

// Build the renderer as a single self-contained HTML file (all JS+CSS inlined).
// The CLI loads it via puppeteer page.setContent() - no servers, no network.
//
// XVIZ_ENABLE_MAPS=1 swaps the maps registry alias from the empty stub to the
// real @minimal-viz/maps integration. Default builds stay light (no deck.gl /
// maplibre-gl). Maps-enabled builds add the 13 deck.gl chart types.
const ENABLE_MAPS = process.env.XVIZ_ENABLE_MAPS === '1'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@xviz-renderer/maps': path.resolve(
        __dirname,
        ENABLE_MAPS ? 'renderer/maps-registry.real.tsx' : 'renderer/maps-registry.stub.ts',
      ),
    },
  },
  define: {
    __XVIZ_ENABLE_MAPS__: JSON.stringify(ENABLE_MAPS),
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
