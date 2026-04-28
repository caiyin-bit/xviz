#!/usr/bin/env node
import { Command } from 'commander'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { createServer } from 'node:http'
import { Engine, normalizeData } from './renderer.mjs'
import { parseCsv } from './csv.mjs'
import { runQuery } from './query.mjs'

async function loadData(path) {
  const text = await readFile(path, 'utf-8')
  if (extname(path).toLowerCase() === '.csv') return parseCsv(text)
  return JSON.parse(text)
}

async function cmdRender(opts) {
  let config
  if (opts.config) {
    const raw = await readFile(opts.config, 'utf-8')
    const obj = JSON.parse(raw)
    config = {
      type: obj.type ?? obj.formData?.vizType,
      width: Number(obj.width ?? opts.width ?? 800),
      height: Number(obj.height ?? opts.height ?? 500),
      formData: obj.formData,
      queriesData: obj.queriesData ?? normalizeData(obj.data),
      ...(obj.theme ? { theme: obj.theme } : opts.theme ? { theme: opts.theme } : {}),
    }
  } else {
    if (!opts.data) throw new Error('--data <file> is required')
    if (!opts.form) throw new Error('--form <file> is required')
    const data = await loadData(opts.data)
    const formRaw = await readFile(opts.form, 'utf-8')
    const form = JSON.parse(formRaw)
    config = {
      type: opts.type ?? form.vizType,
      width: Number(opts.width ?? 800),
      height: Number(opts.height ?? 500),
      formData: form,
      queriesData: normalizeData(data),
      ...(opts.theme ? { theme: opts.theme } : {}),
    }
  }
  if (!config.type) throw new Error('Chart type missing (provide --type or form.vizType)')

  const out = resolve(opts.out)
  const ext = extname(out).slice(1).toLowerCase()
  const format = ext === 'jpeg' ? 'jpg' : ext
  if (!['png', 'jpg', 'pdf', 'html'].includes(format)) {
    throw new Error(`Unsupported output extension: ${out} (use .png, .jpg, .pdf, or .html)`)
  }

  const engine = new Engine()
  await engine.launch()
  try {
    const { buffer } = await engine.render({
      ...config,
      format,
      scale: Number(opts.scale ?? 2),
      delay: Number(opts.delay ?? 400),
      verbose: !!opts.verbose,
    })
    await writeFile(out, buffer)
    console.log(`✓ Wrote ${out} (${config.width}×${config.height} ${config.type})`)
  } finally {
    await engine.dispose()
  }
}

async function cmdServe(opts) {
  const port = Number(opts.port ?? 3737)
  const host = opts.host ?? '127.0.0.1'
  const maxBodyBytes = 8 * 1024 * 1024 // 8 MiB JSON cap

  const engine = new Engine()
  await engine.launch()

  const server = createServer((req, res) => {
    const started = Date.now()
    const log = (status, extra = '') =>
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} → ${status} ${Date.now() - started}ms ${extra}`)

    // Simple CORS (handy for browser demos). Restrict in production if needed.
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        status: 'ok', service: 'xviz', version: '0.1.0',
        endpoints: ['POST /render'],
        supported: ['pie', 'bar', 'line', 'table', 'big-number',
                    'scatter', 'heatmap', 'sankey', 'funnel', 'gauge', 'boxplot', 'histogram', 'treemap'],
      }))
      log(200)
      return
    }

    if (req.method === 'POST' && req.url === '/render') {
      let size = 0
      const chunks = []
      req.on('data', (c) => {
        size += c.length
        if (size > maxBodyBytes) {
          res.statusCode = 413
          res.end('body too large'); req.destroy(); return
        }
        chunks.push(c)
      })
      req.on('end', async () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'))
          const payload = {
            type: body.type ?? body.formData?.vizType,
            width: Number(body.width ?? 800),
            height: Number(body.height ?? 500),
            formData: body.formData,
            queriesData: normalizeData(body.data ?? body.queriesData),
            format: body.format ?? 'png',
            scale: body.scale ?? 2,
            delay: body.delay ?? 400,
          }
          if (!payload.type || !payload.formData || !payload.queriesData) {
            res.statusCode = 400
            res.end('Missing required fields: type, formData, data (or queriesData)')
            log(400); return
          }
          const { buffer, mime } = await engine.render(payload)
          res.setHeader('Content-Type', mime)
          res.setHeader('Content-Length', String(buffer.length))
          res.end(buffer)
          log(200, `${payload.type} ${mime} ${buffer.length}B`)
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e.message }))
          log(500, e.message)
        }
      })
      return
    }

    res.statusCode = 404
    res.end('Not found')
    log(404)
  })

  server.listen(port, host, () => {
    console.log(`✓ xviz server listening on http://${host}:${port}`)
    console.log(`  POST /render  {type, formData, data|queriesData, width?, height?, format?}`)
  })

  const shutdown = async () => {
    console.log('\nShutting down...')
    server.close()
    await engine.dispose()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

const program = new Command()
program.name('xviz').description('Headless chart renderer').version('0.1.0')

program
  .command('render')
  .description('Render a single chart to PNG/JPG/PDF/HTML')
  .option('-t, --type <type>', 'chart type: pie|bar|line|table|big-number')
  .option('-d, --data <file>', 'path to JSON or CSV data file')
  .option('-f, --form <file>', 'path to JSON formData file')
  .option('-c, --config <file>', 'single JSON with {type,width,height,formData,queriesData}')
  .option('-o, --out <file>', 'output path (.png, .jpg, .pdf, .html)', 'chart.png')
  .option('-w, --width <px>', 'width in px', '800')
  .option('-h, --height <px>', 'height in px', '500')
  .option('--scale <n>', 'device scale factor for PNG (retina=2)', '2')
  .option('--delay <ms>', 'extra wait after render before capture', '400')
  .option('--theme <name>', 'theme: light | dark', 'light')
  .option('--verbose', 'stream browser console to stderr')
  .action(async (opts) => {
    try { await cmdRender(opts) } catch (e) {
      console.error(`✗ ${e.message}`)
      process.exit(1)
    }
  })

async function cmdQuery(opts) {
  if (!opts.db) throw new Error('--db <url> is required')
  if (!opts.sql && !opts.sqlFile) throw new Error('--sql or --sql-file is required')
  if (!opts.form) throw new Error('--form <file> is required')

  const sql = opts.sqlFile
    ? await readFile(opts.sqlFile, 'utf-8')
    : opts.sql

  console.error(`→ Running SQL against ${opts.db.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1***$2')}`)
  const rows = await runQuery(opts.db, sql, { maxRows: Number(opts.limit ?? 10000) })
  console.error(`← ${rows.length} rows returned`)

  const formRaw = await readFile(opts.form, 'utf-8')
  const form = JSON.parse(formRaw)

  const config = {
    type: opts.type ?? form.vizType,
    width: Number(opts.width ?? 800),
    height: Number(opts.height ?? 500),
    formData: form,
    queriesData: [{ data: rows }],
    ...(opts.theme ? { theme: opts.theme } : {}),
  }
  if (!config.type) throw new Error('Chart type missing (provide --type or form.vizType)')

  const out = resolve(opts.out)
  const ext = extname(out).slice(1).toLowerCase()
  const format = ext === 'jpeg' ? 'jpg' : ext
  if (!['png', 'jpg', 'pdf', 'html'].includes(format)) {
    throw new Error(`Unsupported output extension: ${out} (use .png, .jpg, .pdf, or .html)`)
  }

  const engine = new Engine()
  await engine.launch()
  try {
    const { buffer } = await engine.render({
      ...config, format,
      scale: Number(opts.scale ?? 2),
      delay: Number(opts.delay ?? 400),
      verbose: !!opts.verbose,
    })
    await writeFile(out, buffer)
    console.log(`✓ Wrote ${out} (${config.width}×${config.height} ${config.type})`)
  } finally {
    await engine.dispose()
  }
}

program
  .command('query')
  .description('Query a database, render the result as a chart')
  .requiredOption('--db <url>', 'connection URL: sqlite:/path, postgres://..., mysql://...')
  .option('--sql <sql>', 'SQL query (inline)')
  .option('--sql-file <file>', 'path to file containing the SQL query')
  .requiredOption('-f, --form <file>', 'path to JSON formData file (includes vizType)')
  .option('-t, --type <type>', 'override chart type (default: formData.vizType)')
  .option('-o, --out <file>', 'output path (.png/.jpg/.pdf/.html)', 'chart.png')
  .option('-w, --width <px>', 'width in px', '800')
  .option('-h, --height <px>', 'height in px', '500')
  .option('--scale <n>', 'device scale factor', '2')
  .option('--delay <ms>', 'extra wait after render', '400')
  .option('--theme <name>', 'light | dark', 'light')
  .option('--limit <n>', 'max rows to accept from SQL (safety rail)', '10000')
  .option('--verbose', 'stream browser console to stderr')
  .action(async (opts) => {
    try { await cmdQuery(opts) } catch (e) {
      console.error(`✗ ${e.message}`)
      process.exit(1)
    }
  })

program
  .command('mcp')
  .description('Run as an MCP server (stdio transport) for LLM tool-use integration')
  .action(async () => {
    // Delegate to the MCP server module — it owns the stdio transport.
    await import('./mcp.mjs')
  })

program
  .command('serve')
  .description('Start HTTP server for on-demand rendering (POST /render)')
  .option('--port <port>', 'port to listen on', '3737')
  .option('--host <host>', 'host to bind', '127.0.0.1')
  .action(async (opts) => {
    try { await cmdServe(opts) } catch (e) {
      console.error(`✗ ${e.message}`)
      process.exit(1)
    }
  })

program.parseAsync(process.argv)
