// SQL query runner. Parses a connection URL, dynamically loads the
// appropriate driver, runs one SELECT, returns rows as plain objects.
//
// Drivers are optional deps — install only what you need:
//   sqlite:  npm install better-sqlite3
//   postgres: npm install pg
//   mysql:   npm install mysql2
//
// Supported URL shapes:
//   sqlite:/absolute/path/to.db       (or relative: sqlite:./app.db)
//   file:/absolute/path/to.sqlite     (aliased to sqlite:)
//   ./foo.db  /abs/path/foo.sqlite    (bare paths ending in .db/.sqlite)
//   postgres://user:pass@host:5432/db
//   postgresql://user:pass@host:5432/db
//   mysql://user:pass@host:3306/db

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Row-count guard: keep CLI sensible. Tune via --limit on caller side.
const DEFAULT_MAX_ROWS = 10_000

function parseConnection(dbUrl) {
  const trimmed = dbUrl.trim()

  // sqlite:/path or sqlite:./path or file:/path — check scheme first so
  // bare-path fallback doesn't accidentally swallow "sqlite:foo.db".
  const sqliteMatch = trimmed.match(/^(?:sqlite|file):(.+)$/i)
  if (sqliteMatch) {
    return { kind: 'sqlite', path: resolve(sqliteMatch[1]) }
  }

  // Bare path ending in .db / .sqlite → treat as SQLite file.
  if (/\.(db|sqlite|sqlite3)$/i.test(trimmed) && !trimmed.includes('://')) {
    return { kind: 'sqlite', path: resolve(trimmed) }
  }

  try {
    const u = new URL(trimmed)
    const scheme = u.protocol.replace(':', '').toLowerCase()
    if (scheme === 'postgres' || scheme === 'postgresql') {
      return { kind: 'postgres', url: trimmed }
    }
    if (scheme === 'mysql' || scheme === 'mysql2') {
      return {
        kind: 'mysql',
        host: u.hostname,
        port: u.port ? Number(u.port) : 3306,
        user: decodeURIComponent(u.username || 'root'),
        password: decodeURIComponent(u.password || ''),
        database: u.pathname.replace(/^\//, ''),
      }
    }
  } catch {
    // fall through
  }

  throw new Error(
    `Unrecognized --db value: "${dbUrl}". Supported: ` +
    `sqlite:/path/to.db, postgres://..., mysql://..., or a bare .db/.sqlite path.`
  )
}

async function loadDriver(name) {
  try {
    return await import(name)
  } catch (e) {
    throw new Error(
      `Driver "${name}" is not installed. Run: npm install ${name}\n(Underlying error: ${e.message})`
    )
  }
}

async function runSqlite(conn, sql, maxRows) {
  if (!existsSync(conn.path)) {
    throw new Error(`SQLite database not found: ${conn.path}`)
  }
  const mod = await loadDriver('better-sqlite3')
  const Database = mod.default ?? mod
  const db = new Database(conn.path, { readonly: true, fileMustExist: true })
  try {
    const rows = db.prepare(sql).all()
    if (rows.length > maxRows) {
      throw new Error(
        `Result has ${rows.length} rows (> --limit ${maxRows}). ` +
        `Add LIMIT to your SQL or raise --limit.`
      )
    }
    // better-sqlite3 may return Buffer for BLOBs; best-effort coerce.
    return rows.map((r) => {
      const o = {}
      for (const [k, v] of Object.entries(r)) {
        o[k] = v instanceof Buffer ? v.toString('base64') : v
      }
      return o
    })
  } finally {
    db.close()
  }
}

async function runPostgres(conn, sql, maxRows) {
  const { default: pg } = await loadDriver('pg')
  const client = new pg.Client({ connectionString: conn.url })
  await client.connect()
  try {
    const res = await client.query({ text: sql, rowMode: undefined })
    if (res.rows.length > maxRows) {
      throw new Error(
        `Result has ${res.rows.length} rows (> --limit ${maxRows}). Add LIMIT or raise --limit.`
      )
    }
    return res.rows
  } finally {
    await client.end()
  }
}

async function runMysql(conn, sql, maxRows) {
  const mysqlMod = await loadDriver('mysql2/promise')
  const mysql = mysqlMod.default ?? mysqlMod
  const connection = await mysql.createConnection({
    host: conn.host, port: conn.port, user: conn.user,
    password: conn.password, database: conn.database,
  })
  try {
    const [rows] = await connection.query(sql)
    if (Array.isArray(rows) && rows.length > maxRows) {
      throw new Error(
        `Result has ${rows.length} rows (> --limit ${maxRows}). Add LIMIT or raise --limit.`
      )
    }
    return rows
  } finally {
    await connection.end()
  }
}

/**
 * Execute a SELECT against `dbUrl` and return rows as plain objects.
 * Throws if the result exceeds `maxRows` (safety rail — charts with
 * 100K+ points don't render usefully anyway).
 */
export async function runQuery(dbUrl, sql, { maxRows = DEFAULT_MAX_ROWS } = {}) {
  const conn = parseConnection(dbUrl)
  if (conn.kind === 'sqlite')   return runSqlite(conn, sql, maxRows)
  if (conn.kind === 'postgres') return runPostgres(conn, sql, maxRows)
  if (conn.kind === 'mysql')    return runMysql(conn, sql, maxRows)
  throw new Error(`Unsupported connection kind: ${conn.kind}`)
}
