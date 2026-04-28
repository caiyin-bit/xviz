// Adapted from superset-frontend/src/visualizations/TimeTable/index.tsx
// Time-pivoted table: rows are metrics, columns are sorted time points.
// Renders as plain HTML — no ECharts. Sparkline / period-deltas are
// intentionally out of scope (the existing BigNumber + trendColumn already
// covers single-metric trend; multi-metric sparkline is a future M5+ task).

import { useMemo } from 'react'
import type { ChartProps, TimeTableFormData } from '../types'
import { getNumberFormatter } from '../utils'
import { DEFAULT_THEME } from '../theme'

function parseTime(label: string): number {
  if (/^\d+$/.test(label)) {
    const n = Number(label)
    return n < 1e12 ? n * 1000 : n
  }
  return Date.parse(label)
}

function formatTimeLabel(label: string, mode: 'iso' | 'short'): string {
  if (mode === 'iso') return label
  const ts = parseTime(label)
  if (!Number.isFinite(ts)) return label
  const d = new Date(ts)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}

export function TimeTable(props: ChartProps<TimeTableFormData>) {
  const { formData, queriesData, width, height } = props
  const theme = props.theme ?? DEFAULT_THEME
  const {
    timeColumn,
    metrics,
    metricLabels = {},
    numberFormat = 'smart',
    timeFormat = 'iso',
    stripes = true,
  } = formData

  const rows = useMemo(() => queriesData[0]?.data ?? [], [queriesData])
  const fmt = getNumberFormatter(numberFormat)

  // Collect distinct time labels and sort chronologically.
  const timeLabels = useMemo(() => {
    const seen = new Set<string>()
    const labels: string[] = []
    for (const r of rows) {
      const t = String(r[timeColumn] ?? '')
      if (t && !seen.has(t)) {
        seen.add(t)
        labels.push(t)
      }
    }
    return labels.sort((a, b) => parseTime(a) - parseTime(b))
  }, [rows, timeColumn])

  // Pivot: { metric -> { timeLabel -> sum-of-values } }
  const pivot = useMemo(() => {
    const out: Record<string, Record<string, number>> = {}
    for (const m of metrics) out[m] = {}
    for (const r of rows) {
      const t = String(r[timeColumn] ?? '')
      if (!t) continue
      for (const m of metrics) {
        const v = Number(r[m] ?? NaN)
        if (Number.isFinite(v)) {
          out[m][t] = (out[m][t] ?? 0) + v
        }
      }
    }
    return out
  }, [rows, timeColumn, metrics])

  const cellPadding = '6px 12px'
  const headerStyle = {
    background: theme.colorBg,
    color: theme.colorTextSecondary,
    borderBottom: `1px solid ${theme.colorBorder}`,
    padding: cellPadding,
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'left' as const,
    position: 'sticky' as const,
    top: 0,
  }
  const cellStyle = {
    padding: cellPadding,
    borderBottom: `1px solid ${theme.colorBorder}`,
    fontSize: 13,
    color: theme.colorText,
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums' as const,
  }

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
            <th style={{ ...headerStyle, textAlign: 'left' }}>Metric</th>
            {timeLabels.map((t) => (
              <th key={t} style={{ ...headerStyle, textAlign: 'right' }}>
                {formatTimeLabel(t, timeFormat)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, i) => (
            <tr
              key={m}
              style={{
                background: stripes && i % 2 === 1 ? theme.colorBg : 'transparent',
              }}
            >
              <td
                style={{
                  ...cellStyle,
                  textAlign: 'left',
                  fontWeight: 500,
                  color: theme.colorText,
                }}
              >
                {metricLabels[m] ?? m}
              </td>
              {timeLabels.map((t) => {
                const v = pivot[m]?.[t]
                return (
                  <td key={t} style={cellStyle}>
                    {v == null ? '—' : fmt(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
