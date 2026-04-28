// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/BigNumber/BigNumberPeriodOverPeriod/transformProps.ts
// Headline current-period value with previous-period value and delta (absolute + %).
//
// Two input shapes supported:
//   1) Single-column time series (last row = current, first row = previous).
//      Use this when you have a single `metric` and the rows are sorted in time.
//   2) Two-column wide format (current + previousMetric on the same row).
//      Pass `previousMetric` to opt in.

import { useMemo } from 'react'
import type { ChartProps, BigNumberPeriodOverPeriodFormData } from '../types'
import { getNumberFormatter, percentFormatter } from '../utils'
import { DEFAULT_THEME } from '../theme'

export function BigNumberPeriodOverPeriod(
  props: ChartProps<BigNumberPeriodOverPeriodFormData>,
) {
  const { formData, queriesData, width, height } = props
  const theme = props.theme ?? DEFAULT_THEME
  const {
    metric,
    previousMetric,
    subheader,
    numberFormat = 'smart',
    color,
    compareLabel = 'vs previous',
  } = formData

  const rows = useMemo(() => queriesData[0]?.data ?? [], [queriesData])
  const fmt = getNumberFormatter(numberFormat)

  // Resolve current and previous values.
  const { current, previous } = useMemo(() => {
    if (rows.length === 0) return { current: 0, previous: 0 }
    if (previousMetric) {
      // Wide format: pull both columns from the (last) row.
      const r = rows[rows.length - 1]
      return {
        current: Number(r[metric] ?? 0),
        previous: Number(r[previousMetric] ?? 0),
      }
    }
    // Long format: last row is current, first row is previous.
    if (rows.length === 1) {
      return { current: Number(rows[0][metric] ?? 0), previous: 0 }
    }
    return {
      current: Number(rows[rows.length - 1][metric] ?? 0),
      previous: Number(rows[0][metric] ?? 0),
    }
  }, [rows, metric, previousMetric])

  const deltaAbs = current - previous
  const deltaPct = previous === 0 ? null : deltaAbs / Math.abs(previous)
  const deltaColor = deltaAbs >= 0 ? '#3ea04a' : '#e04355'
  const deltaSymbol = deltaAbs >= 0 ? '▲' : '▼'

  return (
    <div
      style={{
        width,
        height,
        padding: 16,
        fontFamily: theme.fontFamily,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
        background: theme.colorBg,
      }}
    >
      {subheader && (
        <div style={{ color: theme.colorTextSecondary, fontSize: 14, marginBottom: 4 }}>
          {subheader}
        </div>
      )}
      <div
        style={{
          fontSize: Math.min(64, height * 0.4),
          fontWeight: 700,
          lineHeight: 1,
          color: color ?? theme.colorText,
        }}
      >
        {fmt(current)}
      </div>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          color: theme.colorTextSecondary,
          fontSize: 14,
        }}
      >
        <span>previous: <b style={{ color: theme.colorText }}>{fmt(previous)}</b></span>
        <span style={{ color: deltaColor, fontWeight: 600 }}>
          {deltaSymbol} {fmt(Math.abs(deltaAbs))}
          {deltaPct !== null && <> ({percentFormatter(Math.abs(deltaPct))})</>}
        </span>
        <span style={{ fontStyle: 'italic' }}>{compareLabel}</span>
      </div>
    </div>
  )
}
