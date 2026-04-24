// CSV compatibility tests — exercise the real-world edge cases that Apache
// Superset's "Export to CSV" feature produces (encoding="utf-8-sig",
// QUOTE_MINIMAL, CSV-injection guard, thousands-separated aggregates).
//
// Run: `node test/csv-compat.test.mjs`
// Exits 0 on success, 1 on first failure.

import { parseCsv } from '../bin/csv.mjs'
import assert from 'node:assert/strict'

let passed = 0, failed = 0
function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (e) {
    console.log(`  ✗ ${name}`)
    console.log(`    ${e.message}`)
    failed++
  }
}

console.log('\nCSV compatibility with Superset exports\n')

test('strips UTF-8 BOM (encoding=utf-8-sig)', () => {
  const bom = '﻿'
  const rows = parseCsv(`${bom}a,b\n1,2\n`)
  assert.deepEqual(rows, [{ a: 1, b: 2 }], 'BOM should be stripped from first header')
})

test('thousands-separated integer: "9,823,456"', () => {
  const rows = parseCsv('state,confirmed\nCalifornia,"9,823,456"\n')
  assert.equal(rows[0].confirmed, 9823456)
})

test('thousands-separated float: "24,800.00"', () => {
  const rows = parseCsv('product,revenue\nWidget,"24,800.00"\n')
  assert.equal(rows[0].revenue, 24800)
})

test('CSV-injection guard: "\'+12V" → "+12V"', () => {
  const rows = parseCsv(`product\n"'+12V Power Supply"\n`)
  assert.equal(rows[0].product, '+12V Power Supply')
})

test('CSV-injection guard: "\'@formula" → "@formula"', () => {
  const rows = parseCsv(`formula\n"'@SUM(A:A)"\n`)
  assert.equal(rows[0].formula, '@SUM(A:A)')
})

test('nested double quotes: "\\"Pro\\" Kit"', () => {
  const rows = parseCsv('name\n"""Pro"" Kit"\n')
  assert.equal(rows[0].name, '"Pro" Kit')
})

test('commas inside quoted values preserved', () => {
  const rows = parseCsv('name\n"Thompson, Jr."\n')
  assert.equal(rows[0].name, 'Thompson, Jr.')
})

test('aggregate column names like SUM(col) survive', () => {
  const rows = parseCsv('state,SUM(confirmed)\nCA,100\n')
  assert.equal(rows[0]['SUM(confirmed)'], 100)
})

test('__timestamp column preserved as string (not coerced to date)', () => {
  const rows = parseCsv('__timestamp,count\n2024-01-01 00:00:00,42\n')
  assert.equal(rows[0].__timestamp, '2024-01-01 00:00:00')
  assert.equal(rows[0].count, 42)
})

test('scientific notation parsed as number', () => {
  const rows = parseCsv('x\n1.23e+05\n')
  assert.equal(rows[0].x, 123000)
})

test('negative numbers preserved as numbers', () => {
  const rows = parseCsv('delta\n-42.5\n')
  assert.equal(rows[0].delta, -42.5)
})

test('leading zero preserved as string (e.g. ZIP code)', () => {
  const rows = parseCsv('zip\n"07302"\n')
  assert.equal(rows[0].zip, '07302')
})

test('empty cell becomes null', () => {
  const rows = parseCsv('a,b\n1,\n')
  assert.equal(rows[0].a, 1)
  assert.equal(rows[0].b, null)
})

test('true/false literals coerced to boolean', () => {
  const rows = parseCsv('active\ntrue\nfalse\n')
  assert.equal(rows[0].active, true)
  assert.equal(rows[1].active, false)
})

test('blank trailing lines skipped', () => {
  const rows = parseCsv('a\n1\n\n')
  assert.equal(rows.length, 1)
})

test('full row count from Superset covid_states.csv', async () => {
  const { readFile } = await import('node:fs/promises')
  const text = await readFile(new URL('../examples/superset-exports/covid_states.csv', import.meta.url), 'utf-8')
  const rows = parseCsv(text)
  assert.equal(rows.length, 10, 'expected 10 rows')
  assert.equal(rows[0].state, 'California')
  assert.equal(rows[0]['SUM(confirmed)'], 9823456)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
