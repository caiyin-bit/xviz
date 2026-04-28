// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/BigNumber/BigNumberTotal/transformProps.ts
// Big-number variant without a trendline and without period-over-period delta.
// When the input has multiple rows, sums the metric across all rows
// (the "total" semantic — vs the default BigNumber which displays the
// last row, treating the data as a time series).

import { useMemo } from 'react'
import type { ChartProps, BigNumberTotalFormData } from '../types'
import { getNumberFormatter } from '../utils'
import { DEFAULT_THEME } from '../theme'

export function BigNumberTotal(props: ChartProps<BigNumberTotalFormData>) {
  const { formData, queriesData, width, height } = props
  const theme = props.theme ?? DEFAULT_THEME
  const { metric, subheader, numberFormat = 'smart', color } = formData

  const rows = useMemo(() => queriesData[0]?.data ?? [], [queriesData])
  const fmt = getNumberFormatter(numberFormat)

  // Total semantic: sum metric across all rows. With a single-row input this
  // reduces to that row's value. Non-finite values are skipped.
  const total = useMemo(() => {
    let sum = 0
    for (const r of rows) {
      const v = Number(r[metric] ?? NaN)
      if (Number.isFinite(v)) sum += v
    }
    return sum
  }, [rows, metric])

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
          fontSize: Math.min(72, height * 0.5),
          fontWeight: 700,
          lineHeight: 1,
          color: color ?? theme.colorText,
        }}
      >
        {fmt(total)}
      </div>
    </div>
  )
}
