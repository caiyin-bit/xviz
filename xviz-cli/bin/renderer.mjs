// Shared rendering engine used by both `xviz render` (one-shot) and `xviz serve` (HTTP).
// Holds a single long-lived puppeteer browser instance for reuse.

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const RENDERER_HTML = resolve(__dirname, '..', 'dist', 'renderer', 'index.html')

const CHROME_CANDIDATES = [
  process.env.XVIZ_CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

export function findChrome() {
  for (const p of CHROME_CANDIDATES) if (existsSync(p)) return p
  throw new Error(
    'Chrome/Chromium not found. Set XVIZ_CHROME=/path/to/chrome or install one of: ' +
    CHROME_CANDIDATES.join(', ')
  )
}

/**
 * Engine: owns a pooled puppeteer browser. Call `launch()` once at startup
 * and `dispose()` at shutdown.
 */
export class Engine {
  /** @type {import('puppeteer-core').Browser | null} */
  browser = null
  /** @type {string | null} */
  html = null

  async launch() {
    if (!existsSync(RENDERER_HTML)) {
      throw new Error(`Renderer not built. Run: npm run build (expected ${RENDERER_HTML})`)
    }
    this.html = await readFile(RENDERER_HTML, 'utf-8')
    this.browser = await puppeteer.launch({
      executablePath: findChrome(),
      headless: 'new',
      args: ['--no-sandbox'],
    })
  }

  async dispose() {
    await this.browser?.close()
    this.browser = null
  }

  /**
   * Render one chart to bytes.
   * @param {{
   *   type: string, width: number, height: number,
   *   formData: object, queriesData: object[],
   *   format?: 'png'|'jpg'|'jpeg'|'pdf'|'html',
   *   scale?: number, delay?: number, verbose?: boolean,
   * }} req
   * @returns {Promise<{ buffer: Buffer, mime: string }>}
   */
  async render(req) {
    if (!this.browser || !this.html) throw new Error('Engine not launched')
    const format = (req.format ?? 'png').toLowerCase()
    const scale = Number(req.scale ?? 2)
    const delay = Number(req.delay ?? 400)

    const config = {
      type: req.type,
      width: Number(req.width),
      height: Number(req.height),
      formData: req.formData,
      queriesData: req.queriesData,
      ...(req.theme ? { theme: req.theme } : {}),
    }
    const injected = this.html.replace(
      '<head>',
      `<head>\n<script>window.__CHART__ = ${JSON.stringify(config)};</script>`,
    )

    const page = await this.browser.newPage()
    try {
      if (req.verbose) {
        page.on('console', (m) => console.error(`[page ${m.type()}] ${m.text()}`))
        page.on('pageerror', (e) => console.error(`[page ERROR] ${e.message}`))
      }
      await page.setViewport({
        width: config.width + 40,
        height: config.height + 40,
        deviceScaleFactor: scale,
      })
      await page.setContent(injected, { waitUntil: 'networkidle0' })
      await page.waitForFunction(() => !!document.querySelector('#root > *'), { timeout: 10_000 })
      await new Promise((r) => setTimeout(r, delay))

      if (format === 'html') {
        const content = await page.content()
        return { buffer: Buffer.from(content, 'utf-8'), mime: 'text/html' }
      }
      if (format === 'pdf') {
        const buf = await page.pdf({
          width: config.width + 40,
          height: config.height + 40,
          printBackground: true,
        })
        return { buffer: Buffer.from(buf), mime: 'application/pdf' }
      }
      // png / jpg
      const el = await page.$('#root')
      const screenshotOpts = format === 'jpg' || format === 'jpeg'
        ? { type: 'jpeg', quality: 92 }
        : { type: 'png' }
      const buf = await el.screenshot(screenshotOpts)
      const mime = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png'
      return { buffer: Buffer.from(buf), mime }
    } finally {
      await page.close()
    }
  }
}

/** Normalize user-supplied data into QueryData[]. */
export function normalizeData(data) {
  if (Array.isArray(data)) {
    return data.length && data[0] && Array.isArray(data[0].data)
      ? data
      : [{ data }]
  }
  return [data]
}
