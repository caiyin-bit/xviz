// Minimal RFC-4180-ish CSV parser — no deps.
// Handles quoted fields with embedded commas, quotes ("") and newlines.
// Auto-coerces numeric-looking cells to numbers.

export function parseCsv(text) {
  // Strip UTF-8 BOM — Superset's CSV exports use encoding="utf-8-sig".
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  const rows = splitRows(text)
  if (rows.length === 0) return []
  const header = rows[0].map((h) => h.trim())
  const out = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length === 1 && row[0] === '') continue // blank line
    const obj = {}
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = coerce(row[j])
    }
    out.push(obj)
  }
  return out
}

function coerce(v) {
  if (v == null) return null
  const s = String(v).trim()
  if (s === '') return null
  if (s === 'true') return true
  if (s === 'false') return false

  // Defuse Superset's CSV-injection guard (values prefixed with ' before -@+|=%).
  // We keep it as a string but strip the leading ' so it doesn't break typing below.
  const unguarded = /^'(?=[\-@+|=%])/.test(s) ? s.slice(1) : s

  // Plain integer/float: "1234", "-1.5", "1.23e+05".
  if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(unguarded)) {
    if (/^-?0\d/.test(unguarded)) return unguarded // preserve "007" as string
    const n = Number(unguarded)
    return Number.isFinite(n) ? n : unguarded
  }

  // Thousands-separated number: "9,823,456" or "1,234.56" (Superset uses these
  // when exporting with a number format, especially for aggregated metrics).
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(unguarded)) {
    const n = Number(unguarded.replace(/,/g, ''))
    return Number.isFinite(n) ? n : unguarded
  }

  return unguarded
}

function splitRows(text) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else {
      if (c === '"') { inQuotes = true }
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else { field += c }
    }
  }
  // Last field/row (no trailing newline)
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}
