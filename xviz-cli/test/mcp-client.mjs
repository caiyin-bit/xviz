// Smoke test: spawn the MCP server and send list_tools + render_chart via stdio.
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'

const proc = spawn('node', ['bin/mcp.mjs'], { stdio: ['pipe', 'pipe', 'pipe'] })

let nextId = 1
const pending = new Map()
let buf = ''

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
    } catch (_) { /* not json */ }
  }
})
proc.stderr.on('data', (c) => process.stderr.write(`[mcp] ${c}`))

function call(method, params) {
  return new Promise((resolve) => {
    const id = nextId++
    pending.set(id, resolve)
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
}

// MCP handshake
await call('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'smoke-test', version: '1.0' },
})
proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')

// List tools
const listed = await call('tools/list', {})
console.log('\n=== Tools advertised ===')
for (const t of listed.result.tools) {
  console.log(`- ${t.name}: ${t.description.slice(0, 80)}...`)
}

// Render a pie chart
console.log('\n=== Calling render_chart (pie) ===')
const rendered = await call('tools/call', {
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
      innerRadius: 40,
      outerRadius: 75,
      labelType: 'key_percent',
      showLegend: true,
      legendOrientation: 'top',
      showTotal: true,
    },
    width: 500,
    height: 350,
  },
})

const result = rendered.result
if (result?.isError) {
  console.log('✗ Error:', result.content?.[0]?.text)
  process.exit(1)
}
const img = result.content.find((c) => c.type === 'image')
const txt = result.content.find((c) => c.type === 'text')
if (img) {
  const bytes = Buffer.from(img.data, 'base64')
  await writeFile('/tmp/xviz-out/mcp-pie.png', bytes)
  console.log(`✓ Image returned: ${bytes.length} bytes → /tmp/xviz-out/mcp-pie.png`)
}
if (txt) console.log(`✓ Text: ${txt.text}`)

proc.kill('SIGTERM')
await new Promise((r) => proc.on('exit', r))
console.log('\n✓ MCP smoke test passed')
