// Build examples/sql/sample.db — a tiny SQLite database with some
// realistic-ish e-commerce data for xviz query demos.
import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { unlinkSync, existsSync } from 'node:fs'

const __dir = dirname(fileURLToPath(import.meta.url))
const dbPath = resolve(__dir, 'sample.db')

if (existsSync(dbPath)) unlinkSync(dbPath)
const db = new Database(dbPath)

db.exec(`
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    placed_at TEXT NOT NULL,
    customer_region TEXT NOT NULL,
    product_category TEXT NOT NULL,
    units INTEGER NOT NULL,
    revenue REAL NOT NULL
  );
`)

const regions = ['North America', 'Europe', 'Asia', 'South America']
const categories = ['Electronics', 'Books', 'Home', 'Sports']
const insert = db.prepare(
  'INSERT INTO orders (placed_at, customer_region, product_category, units, revenue) VALUES (?, ?, ?, ?, ?)'
)
const insertMany = db.transaction((rows) => {
  for (const r of rows) insert.run(r.placed_at, r.region, r.category, r.units, r.revenue)
})

// Deterministic generation: 2024-01 through 2024-06, 3 orders per month per region
const rows = []
const monthlyFactor = [1.0, 1.1, 1.25, 1.4, 1.6, 1.85]
for (let m = 0; m < 6; m++) {
  const month = String(m + 1).padStart(2, '0')
  for (const region of regions) {
    for (const category of categories) {
      const base = {
        'North America': 200, 'Europe': 150, 'Asia': 300, 'South America': 80,
      }[region]
      const catMul = {
        Electronics: 2.5, Books: 0.6, Home: 1.2, Sports: 0.9,
      }[category]
      const units = Math.round(base * catMul * monthlyFactor[m] * (0.85 + 0.3 * Math.random()))
      const revenue = Math.round(units * (catMul * 30 + 20) * 100) / 100
      rows.push({
        placed_at: `2024-${month}-15T12:00:00`,
        region, category, units, revenue,
      })
    }
  }
}
insertMany(rows)

console.log(`✓ Wrote ${dbPath} (${rows.length} rows)`)
db.close()
