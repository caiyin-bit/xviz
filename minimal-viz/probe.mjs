import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1400, height: 1600 })

const errors = []
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`PAGE ERROR: ${e.message}`))
page.on('requestfailed', (r) => errors.push(`REQ FAILED: ${r.url()} — ${r.failure()?.errorText}`))

try {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 })
} catch (e) {
  console.log(`NAV ERROR: ${e.message}`)
}
await new Promise((r) => setTimeout(r, 3000))

const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'))
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300))

console.log('--- LOGS ---')
logs.forEach((l) => console.log(l))
console.log('--- ERRORS ---')
errors.forEach((e) => console.log(e))
console.log('--- DOM ---')
console.log('hasCanvas:', hasCanvas)
console.log('bodyText:', JSON.stringify(bodyText))

await page.screenshot({ path: '/tmp/minimal-viz.png', fullPage: true })
console.log('Screenshot: /tmp/minimal-viz.png')
await browser.close()
