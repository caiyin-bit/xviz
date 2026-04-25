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

let tmp

beforeAll(async () => {
  const html = resolve(repoRoot, 'dist/renderer/index.html')
  if (!existsSync(html)) {
    throw new Error(
      `Renderer bundle missing — run 'npm run build' first (expected ${html})`,
    )
  }
  tmp = await mkdtemp(join(tmpdir(), 'xviz-render-'))
})

afterAll(async () => {
  if (tmp) await rm(tmp, { recursive: true, force: true })
})

function runCli(args) {
  return new Promise((resolveProc, rejectProc) => {
    const proc = spawn('node', [cli, ...args], {
      cwd: repoRoot,
      env: { ...process.env },
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

describe('xviz render (CLI smoke)', () => {
  it('renders pie example to PNG with requested dimensions', async () => {
    const out = join(tmp, 'pie.png')

    const { code, stderr } = await runCli([
      'render',
      '-d', 'examples/pie-data.json',
      '-f', 'examples/pie-form.json',
      '-o', out,
      '--width', '600',
      '--height', '400',
    ])

    expect(code, `CLI failed: ${stderr}`).toBe(0)

    const file = await stat(out)
    expect(file.size).toBeGreaterThan(1000) // any real PNG will exceed 1KB

    const buf = await readFile(out)
    const { width, height } = readPngSize(buf)
    // Puppeteer's element screenshot ≈ requested size (subject to scale factor
    // and CSS rounding). Allow a small fuzz; the renderer also defaults to
    // deviceScaleFactor 2, so a 600×400 element commonly comes out 1200×800.
    // The actual element is wrapped with 20px padding on each side per
    // bin/xviz.mjs:60 — so we just sanity-check non-zero and roughly correct
    // aspect ratio (within 30%).
    // After deviceScaleFactor: 2 + 20px padding on each side, a 600×400
    // request typically renders at ~1240×840. Sanity-check minimum size
    // and a tighter aspect window (within ±15% of 1.5).
    expect(width).toBeGreaterThan(800)
    expect(height).toBeGreaterThan(500)
    const aspect = width / height
    expect(aspect).toBeGreaterThan(600 / 400 * 0.85)
    expect(aspect).toBeLessThan(600 / 400 * 1.15)
  })
})
