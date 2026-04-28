// Adapted from superset-frontend/plugins/plugin-chart-pivot-table/src/PivotTableChart.tsx
// Minimal pivot: row dims × column dims × single value with one aggregator.
// Multi-level rows / columns are concatenated with ' / ' rather than rendered
// as nested headers — keeps the implementation compact and the output table
// flat enough to consume programmatically. Out of scope: drilldown, sort
// arrows, custom cell renderers, conditional formatting.

import { useMemo } from 'react'
import type { ChartProps, PivotTableFormData } from '../types'
import { getNumberFormatter } from '../utils'
import { DEFAULT_THEME } from '../theme'

type Aggregator = 'sum' | 'avg' | 'count' | 'min' | 'max'

interface CellAcc {
  sum: number
  count: number
  min: number
  max: number
}

function newCell(): CellAcc {
  return { sum: 0, count: 0, min: Infinity, max: -Infinity }
}

function addToCell(c: CellAcc, v: number) {
  c.sum += v
  c.count += 1
  if (v < c.min) c.min = v
  if (v > c.max) c.max = v
}

function aggValue(c: CellAcc | undefined, agg: Aggregator): number | null {
  if (!c || c.count === 0) return null
  switch (agg) {
    case 'sum':   return c.sum
    case 'avg':   return c.sum / c.count
    case 'count': return c.count
    case 'min':   return c.min
    case 'max':   return c.max
    default:      return c.sum
  }
}

function joinKey(row: Record<string, unknown>, cols: string[]): string {
  return cols.map((c) => String(row[c] ?? '')).join(' / ')
}

export function PivotTable(props: ChartProps<PivotTableFormData>) {
  const { formData, queriesData, width, height } = props
  const theme = props.theme ?? DEFAULT_THEME
  const {
    rows: rowDims,
    columns: colDims,
    value,
    aggregator = 'sum',
    showRowTotals = true,
    showColumnTotals = true,
    numberFormat = 'smart',
    stripes = true,
  } = formData

  const rawRows = useMemo(() => queriesData[0]?.data ?? [], [queriesData])
  const fmt = getNumberFormatter(numberFormat)

  // Walk all rows once: collect ordered unique row/col keys + accumulate cells.
  const { rowKeys, colKeys, grid, rowTotals, colTotals, grandTotal } = useMemo(() => {
    const rowKeysList: string[] = []
    const rowKeysSeen = new Set<string>()
    const colKeysList: string[] = []
    const colKeysSeen = new Set<string>()
    const cells = new Map<string, Map<string, CellAcc>>()  // rowKey → colKey → cell
    const rowTotalCells = new Map<string, CellAcc>()
    const colTotalCells = new Map<string, CellAcc>()
    const grandCell = newCell()

    for (const r of rawRows) {
      const v = Number(r[value] ?? NaN)
      if (!Number.isFinite(v)) continue
      const rk = joinKey(r, rowDims)
      const ck = colDims.length > 0 ? joinKey(r, colDims) : value

      if (!rowKeysSeen.has(rk)) {
        rowKeysSeen.add(rk)
        rowKeysList.push(rk)
      }
      if (!colKeysSeen.has(ck)) {
        colKeysSeen.add(ck)
        colKeysList.push(ck)
      }

      let row = cells.get(rk)
      if (!row) {
        row = new Map<string, CellAcc>()
        cells.set(rk, row)
      }
      let cell = row.get(ck)
      if (!cell) {
        cell = newCell()
        row.set(ck, cell)
      }
      addToCell(cell, v)

      let rt = rowTotalCells.get(rk)
      if (!rt) { rt = newCell(); rowTotalCells.set(rk, rt) }
      addToCell(rt, v)

      let ct = colTotalCells.get(ck)
      if (!ct) { ct = newCell(); colTotalCells.set(ck, ct) }
      addToCell(ct, v)

      addToCell(grandCell, v)
    }

    return {
      rowKeys: rowKeysList,
      colKeys: colKeysList,
      grid: cells,
      rowTotals: rowTotalCells,
      colTotals: colTotalCells,
      grandTotal: grandCell,
    }
  }, [rawRows, rowDims, colDims, value])

  // Header label for the leftmost column (the row-dim header).
  const rowHeader = rowDims.join(' / ') || '—'
  // Header label for the lone value column when colDims is empty.
  const valueHeader = value

  const headerStyle = {
    background: theme.colorBg,
    color: theme.colorTextSecondary,
    borderBottom: `1px solid ${theme.colorBorder}`,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'left' as const,
    position: 'sticky' as const,
    top: 0,
  }
  const cellStyle = {
    padding: '6px 12px',
    borderBottom: `1px solid ${theme.colorBorder}`,
    fontSize: 13,
    color: theme.colorText,
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums' as const,
  }
  const totalStyle = { ...cellStyle, fontWeight: 700, background: theme.colorBg }

  const renderValue = (n: number | null) => (n == null ? '—' : fmt(n))

  const colHeaderLabels = colDims.length > 0 ? colKeys : [valueHeader]

  return (
    <div
      style={{
        width,
        height,
        overflow: 'auto',
        fontFamily: theme.fontFamily,
        background: theme.colorBg,
      }}
    >
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, textAlign: 'left' }}>{rowHeader}</th>
            {colHeaderLabels.map((c) => (
              <th key={c} style={{ ...headerStyle, textAlign: 'right' }}>{c}</th>
            ))}
            {showRowTotals && (
              <th style={{ ...headerStyle, textAlign: 'right' }}>Total</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((rk, i) => (
            <tr key={rk} style={{ background: stripes && i % 2 === 1 ? theme.colorBg : 'transparent' }}>
              <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 500 }}>{rk}</td>
              {colHeaderLabels.map((ck) => {
                const cell = grid.get(rk)?.get(ck)
                return (
                  <td key={ck} style={cellStyle}>
                    {renderValue(aggValue(cell, aggregator))}
                  </td>
                )
              })}
              {showRowTotals && (
                <td style={totalStyle}>
                  {renderValue(aggValue(rowTotals.get(rk), aggregator))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {showColumnTotals && rowKeys.length > 0 && (
          <tfoot>
            <tr>
              <td style={{ ...totalStyle, textAlign: 'left' }}>Total</td>
              {colHeaderLabels.map((ck) => (
                <td key={ck} style={totalStyle}>
                  {renderValue(aggValue(colTotals.get(ck), aggregator))}
                </td>
              ))}
              {showRowTotals && (
                <td style={totalStyle}>
                  {renderValue(aggValue(grandTotal, aggregator))}
                </td>
              )}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
