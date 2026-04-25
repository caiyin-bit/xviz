import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPngSize } from './util/png.mjs'

const __dir = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = resolve(__dir, '..')
const cli = resolve(repoRoot, 'bin/xviz.mjs')

let proc
const pending = new Map()
let nextId = 1
let buf = ''

function call(method, params) {
  return new Promise((resolveCall) => {
    const id = nextId++
    pending.set(id, resolveCall)
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
}

beforeAll(async () => {
  // Fail fast if the renderer bundle is missing — same precondition as
  // render-cli and query-sql tests.
  const html = resolve(repoRoot, 'dist/renderer/index.html')
  if (!existsSync(html)) {
    throw new Error(
      `Renderer bundle missing — run 'npm run build' first (expected ${html})`,
    )
  }

  proc = spawn('node', [cli, 'mcp'], {
    cwd: repoRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  })
  proc.stdout.on('data', (chunk) => {
    buf += chunk.toString()
    let idx
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim()
      buf = buf.slice(idx + 1)
      if (!line) continue
      try {
        const msg = JSON.parse(line)
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg)
          pending.delete(msg.id)
        }
      } catch { /* not JSON, ignore */ }
    }
  })
  // Don't proxy stderr to console in normal runs — Vitest captures it
  // automatically and surfaces it on failure.

  // MCP handshake
  await call('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'vitest-smoke', version: '1.0' },
  })
  proc.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  }) + '\n')
})

afterAll(async () => {
  if (proc) {
    proc.kill('SIGTERM')
    await new Promise((r) => proc.on('exit', r))
  }
})

describe('xviz mcp (MCP smoke)', () => {
  it('advertises render_chart and list_chart_types tools', async () => {
    const res = await call('tools/list', {})
    const names = res.result.tools.map((t) => t.name).sort()
    expect(names).toContain('render_chart')
    expect(names).toContain('list_chart_types')
  })

  it('renders a pie chart and returns a valid PNG payload', async () => {
    const res = await call('tools/call', {
      name: 'render_chart',
      arguments: {
        type: 'pie',
        data: [
          { region: 'NA', sales: 1200 },
          { region: 'EU', sales: 900 },
          { region: 'AS', sales: 1500 },
        ],
        formData: {
          groupby: ['region'],
          metric: 'sales',
          donut: true,
        },
        width: 500,
        height: 350,
      },
    })

    expect(res.result, JSON.stringify(res)).toBeDefined()
    expect(res.result.isError).toBeFalsy()

    const img = res.result.content.find((c) => c.type === 'image')
    expect(img, 'no image content returned').toBeDefined()

    const bytes = Buffer.from(img.data, 'base64')
    expect(bytes.length).toBeGreaterThan(1000)

    const { width, height } = readPngSize(bytes)
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })
})
