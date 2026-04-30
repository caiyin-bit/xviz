#!/usr/bin/env node
// Perf baseline benchmark for xviz-cli render path.
//
// Renders each fixture in --fixtures-dir N times (default 3) through the
// shared Engine, measuring wall-clock per render. Reports min / p50 / max /
// mean per fixture and an overall summary line. Output is human-readable
// markdown so it can be pasted into the README's perf table.
//
// Cold-start time (puppeteer launch) is reported separately since it
// dominates a single render but amortizes for repeated calls. Warm renders
// are what matters for a long-lived `xviz serve` process.
//
// Usage:
//   node bench/render-bench.mjs                         # uses bench/fixtures/
//   node bench/render-bench.mjs --runs 5
//   node bench/render-bench.mjs --fixtures-dir other/

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, basename, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Engine, normalizeData } from '../bin/renderer.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dir, '..')

function parseArgs(argv) {
  const args = { runs: 3, fixturesDir: resolve(__dir, 'fixtures'), output: null, json: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--runs') args.runs = Number(argv[++i])
    else if (a === '--fixtures-dir') args.fixturesDir = resolve(argv[++i])
    else if (a === '--output') args.output = resolve(argv[++i])
    else if (a === '--json') args.json = true
    else if (a === '--help' || a === '-h') {
      console.log('Usage: render-bench [--runs N] [--fixtures-dir DIR] [--output FILE] [--json]')
      process.exit(0)
    }
  }
  return args
}

async function loadFixture(path) {
  const obj = JSON.parse(await readFile(path, 'utf-8'))
  return {
    name: basename(path, extname(path)),
    type: obj.type ?? obj.formData?.vizType,
    width: Number(obj.width ?? 800),
    height: Number(obj.height ?? 500),
    formData: obj.formData,
    queriesData: obj.queriesData ?? normalizeData(obj.data ?? []),
  }
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b)
  const n = sorted.length
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  const mean = samples.reduce((a, b) => a + b, 0) / n
  return {
    min: sorted[0],
    p50: median,
    max: sorted[n - 1],
    mean,
  }
}

function fmtMs(n) {
  return `${n.toFixed(1)} ms`
}

async function main() {
  const args = parseArgs(process.argv)
  if (!existsSync(args.fixturesDir)) {
    console.error(`Fixtures directory not found: ${args.fixturesDir}`)
    process.exit(1)
  }
  const files = (await readdir(args.fixturesDir))
    .filter((f) => f.endsWith('.json'))
    .sort()
  if (files.length === 0) {
    console.error(`No fixture JSON files in ${args.fixturesDir}`)
    process.exit(1)
  }
  const fixtures = await Promise.all(
    files.map((f) => loadFixture(resolve(args.fixturesDir, f))),
  )

  console.error(`# xviz render-bench`)
  console.error(`fixtures: ${fixtures.length}, runs each: ${args.runs}`)
  console.error(`fixtures-dir: ${args.fixturesDir}`)
  console.error('')

  const engine = new Engine()
  const launchStart = performance.now()
  await engine.launch()
  const launchMs = performance.now() - launchStart
  console.error(`engine.launch(): ${fmtMs(launchMs)} (cold-start, one-time)`)
  console.error('')

  const report = []
  try {
    for (const f of fixtures) {
      const samples = []
      for (let i = 0; i < args.runs; i++) {
        const start = performance.now()
        await engine.render({ ...f, format: 'png', scale: 2, delay: 200 })
        samples.push(performance.now() - start)
      }
      const s = summarize(samples)
      report.push({ name: f.name, type: f.type, width: f.width, height: f.height, samples, ...s })
    }
  } finally {
    await engine.dispose()
  }

  const overall = summarize(report.flatMap((r) => r.samples))

  if (args.json) {
    const out = JSON.stringify({
      runs: args.runs,
      cold_start_ms: launchMs,
      fixtures: report,
      overall,
    }, null, 2)
    if (args.output) await writeFile(args.output, out)
    else console.log(out)
    return
  }

  // Markdown report (default).
  const lines = [
    `# xviz Render Performance Baseline`,
    ``,
    `- Cold start (puppeteer launch + bundle parse): **${fmtMs(launchMs)}**`,
    `- Runs per fixture: **${args.runs}**`,
    `- Format: PNG · scale: 2× · post-render delay: 200 ms`,
    ``,
    `| Fixture | Type | Size | min | p50 | max | mean |`,
    `|---|---|---|---|---|---|---|`,
    ...report.map((r) => `| \`${r.name}\` | ${r.type} | ${r.width}×${r.height} | ${fmtMs(r.min)} | ${fmtMs(r.p50)} | ${fmtMs(r.max)} | ${fmtMs(r.mean)} |`),
    ``,
    `**Overall** (warm renders, all fixtures pooled): min ${fmtMs(overall.min)} · p50 ${fmtMs(overall.p50)} · max ${fmtMs(overall.max)} · mean ${fmtMs(overall.mean)}`,
    ``,
    `Hardware / runtime: \`${process.platform}\` \`${process.arch}\` Node ${process.version}`,
    ``,
  ]
  const md = lines.join('\n')
  if (args.output) {
    await writeFile(args.output, md)
    console.error(`Report written to ${args.output}`)
  } else {
    console.log(md)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
