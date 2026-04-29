// Live smoke test for the maps satellite path. Skipped by default because
// it (1) requires a maps-enabled bundle and (2) needs puppeteer's headless
// Chrome to do a real WebGL render of deck.gl + maplibre-gl.
//
// Activate with:
//   XVIZ_TEST_MAPS=1 XVIZ_ENABLE_MAPS=1 npm test
// The test asserts the renderer produces a non-trivial PNG, validating the
// full WebGL path end-to-end.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPngSize } from './util/png.mjs'

const __dir = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = resolve(__dir, '..')
const cli = resolve(repoRoot, 'bin/xviz.mjs')

const mapsTestEnabled = process.env.XVIZ_TEST_MAPS === '1'
const describeMaps = mapsTestEnabled ? describe : describe.skip

let tmp

beforeAll(async () => {
  if (!mapsTestEnabled) return
  const html = resolve(repoRoot, 'dist/renderer/index.html')
  if (!existsSync(html)) {
    throw new Error(
      `Renderer bundle missing — run 'XVIZ_ENABLE_MAPS=1 npm run build:maps' first (expected ${html})`,
    )
  }
  tmp = await mkdtemp(join(tmpdir(), 'xviz-maps-'))
})

afterAll(async () => {
  if (tmp) await rm(tmp, { recursive: true, force: true })
})

function runCli(args) {
  return new Promise((resolveProc, rejectProc) => {
    const proc = spawn('node', [cli, ...args], {
      cwd: repoRoot,
      env: { ...process.env, XVIZ_ENABLE_MAPS: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (b) => (stdout += b.toString()))
    proc.stderr.on('data', (b) => (stderr += b.toString()))
    proc.on('exit', (code) => resolveProc({ code, stdout, stderr }))
    proc.on('error', rejectProc)
  })
}

describeMaps('xviz render — maps satellite (WebGL smoke)', () => {
  it('renders deck-scatter cities to PNG via puppeteer + WebGL', async () => {
    const out = join(tmp, 'cities.png')
    const { code, stderr } = await runCli([
      'render',
      '-d', 'examples/deck-scatter-cities/data.json',
      '-f', 'examples/deck-scatter-cities/form.json',
      '-o', out,
      '--width', '900',
      '--height', '540',
      // deck.gl + tile loads need extra wait beyond the 400ms default.
      '--delay', '2500',
    ])

    expect(code, `CLI failed: ${stderr}`).toBe(0)

    const file = await stat(out)
    expect(file.size).toBeGreaterThan(5_000) // a real WebGL PNG dwarfs an empty canvas

    const buf = await readFile(out)
    const { width, height } = readPngSize(buf)
    // 900×540 request + 20px padding × 2 deviceScaleFactor → ~1880×1160.
    expect(width).toBeGreaterThan(1000)
    expect(height).toBeGreaterThan(600)
    const aspect = width / height
    expect(aspect).toBeGreaterThan((900 / 540) * 0.85)
    expect(aspect).toBeLessThan((900 / 540) * 1.15)
  }, 60_000)
})
