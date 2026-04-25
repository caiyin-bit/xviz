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
  tmp = await mkdtemp(join(tmpdir(), 'xviz-query-'))
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

describe('xviz query (SQL → PNG smoke)', () => {
  it('runs a SQL aggregation against sample.db and renders a pie', async () => {
    const out = join(tmp, 'regions.png')

    const { code, stderr } = await runCli([
      'query',
      '--db', 'sqlite:examples/sql/sample.db',
      '--sql', 'SELECT customer_region AS region, SUM(revenue) AS sales FROM orders GROUP BY 1',
      '-f', 'examples/sql/region-pie-form.json',
      '-o', out,
      '--width', '600',
      '--height', '400',
    ])

    expect(code, `CLI failed: ${stderr}`).toBe(0)

    const file = await stat(out)
    expect(file.size).toBeGreaterThan(1000)

    const { width, height } = readPngSize(await readFile(out))
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })
})
