import { useMemo, useState } from 'react'
import type { ChartProps, TableFormData } from '../types'
import { getNumberFormatter } from '../utils'
import { DEFAULT_THEME } from '../theme'

type SortDir = 'asc' | 'desc' | null

export function Table(props: ChartProps<TableFormData>) {
  const { formData, queriesData, width, height } = props
  const theme = props.theme ?? DEFAULT_THEME
  const headerBg = theme.name === 'dark' ? '#2a2a2a' : '#f5f5f5'
  const stripeBg = theme.name === 'dark' ? '#222222' : '#fafafa'
  const {
    columns: explicit,
    columnLabels = {},
    numericColumns = [],
    numberFormat = 'smart',
    pageSize = 10,
    sortable = true,
    stripes = true,
  } = formData

  const rows = useMemo(() => queriesData[0]?.data ?? [], [queriesData])
  const colnames = queriesData[0]?.colnames
  const columns = useMemo(() => {
    if (explicit?.length) return explicit
    if (colnames?.length) return colnames
    return rows.length ? Object.keys(rows[0]) : []
  }, [explicit, colnames, rows])

  const numericSet = useMemo(() => new Set(numericColumns), [numericColumns])
  const fmt = getNumberFormatter(numberFormat)

  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return rows
    const dir = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir
    })
  }, [rows, sortCol, sortDir])

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const pageRows = pageSize > 0 ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted

  const toggleSort = (col: string) => {
    if (!sortable) return
    if (sortCol !== col) {
      setSortCol(col); setSortDir('asc'); return
    }
    setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
  }

  const cell = (value: unknown, col: string) => {
    if (value == null) return ''
    if (numericSet.has(col) || typeof value === 'number') return fmt(Number(value))
    return String(value)
  }

  return (
    <div style={{
      width, height, overflow: 'auto',
      fontFamily: theme.fontFamily, fontSize: 13,
      background: theme.colorBg, color: theme.colorText,
    }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: headerBg }}>
            {columns.map((c) => (
              <th
                key={c}
                onClick={() => toggleSort(c)}
                style={{
                  textAlign: numericSet.has(c) ? 'right' : 'left',
                  padding: '8px 12px',
                  borderBottom: `1px solid ${theme.colorBorder}`,
                  cursor: sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  fontWeight: 600,
                  color: theme.colorText,
                }}
              >
                {columnLabels[c] ?? c}
                {sortCol === c && sortDir === 'asc' && ' ▲'}
                {sortCol === c && sortDir === 'desc' && ' ▼'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, i) => (
            <tr key={i} style={{ background: stripes && i % 2 ? stripeBg : theme.colorBg }}>
              {columns.map((c) => (
                <td
                  key={c}
                  style={{
                    textAlign: numericSet.has(c) ? 'right' : 'left',
                    padding: '6px 12px',
                    borderBottom: `1px solid ${theme.colorBorder}`,
                    color: theme.colorText,
                  }}
                >
                  {cell(row[c], c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pageSize > 0 && totalPages > 1 && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', padding: 8, fontSize: 12,
          color: theme.colorTextSecondary,
        }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹ Prev</button>
          <span>Page {page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next ›</button>
          <span style={{ marginLeft: 'auto' }}>{sorted.length} rows</span>
        </div>
      )}
    </div>
  )
}
