// Adapted from superset-frontend/plugins/legacy-preset-chart-nvd3/src/Bullet/transformProps.ts
// Bullet chart: a horizontal bar (the "actual" value) overlaid on graded
// background ranges (poor / good / excellent), with an optional target tick.
// ECharts has no native bullet — we layer:
//   1) a stacked bar series for the qualitative ranges
//   2) a slim bar series for the actual metric value
//   3) markLine for the target tick

import type { EChartsCoreOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { ChartProps, BulletFormData } from '../types'
import { getNumberFormatter } from '../utils'

export interface TransformedBulletProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

export function transformBulletProps(
  chartProps: ChartProps<BulletFormData>,
): TransformedBulletProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    groupby,
    metric,
    targetColumn,
    rangeColumns = [],
    rangeColors,
    metricColor,
    numberFormat = 'smart',
    xAxisLabel,
  } = formData

  const fmt = getNumberFormatter(numberFormat)
  const rawData = queriesData[0]?.data ?? []
  const palette = chartProps.theme?.palette ?? []
  const accent = metricColor ?? palette[0] ?? '#1FA8C9'

  // Default greyscale ramp from light to dark for ranges.
  const defaultRangeColors = ['#e5e5e5', '#bdbdbd', '#8c8c8c', '#595959']
  const colors = rangeColors ?? defaultRangeColors

  // Each row → one horizontal bullet. y-axis is the category list.
  type RowOut = {
    name: string
    value: number
    target: number | null
    ranges: number[]   // sorted ascending; cumulative differences for stacking
  }
  const rows: RowOut[] = []
  for (const r of rawData) {
    const name = String(r[groupby] ?? '')
    const v = Number(r[metric] ?? NaN)
    if (!name || !Number.isFinite(v)) continue
    const target = targetColumn ? Number(r[targetColumn] ?? NaN) : NaN
    // Resolve range thresholds → sort ascending
    const rawRanges = rangeColumns
      .map((c) => Number(r[c] ?? NaN))
      .filter((x) => Number.isFinite(x))
      .sort((a, b) => a - b)
    rows.push({
      name,
      value: v,
      target: Number.isFinite(target) ? target : null,
      ranges: rawRanges,
    })
  }

  const yCategories = rows.map((r) => r.name)

  // Build N range series — each series contributes the delta between
  // successive thresholds, so they stack to form full bands.
  const numRanges = rangeColumns.length
  const rangeSeries: BarSeriesOption[] = []
  for (let i = 0; i < numRanges; i += 1) {
    rangeSeries.push({
      type: 'bar',
      name: rangeColumns[i],
      stack: 'ranges',
      barWidth: '60%',
      itemStyle: { color: colors[i] ?? defaultRangeColors[i % defaultRangeColors.length] },
      data: rows.map((r) => {
        if (i === 0) return r.ranges[0] ?? 0
        return Math.max(0, (r.ranges[i] ?? 0) - (r.ranges[i - 1] ?? 0))
      }),
      silent: true,
    })
  }

  // Actual-value bar — narrower, drawn on top in its own stack so it overlays.
  const valueSeries: BarSeriesOption = {
    type: 'bar',
    name: metric,
    barGap: '-100%',                     // overlay on top of the range bands
    barWidth: '25%',
    itemStyle: { color: accent },
    data: rows.map((r) => r.value),
    z: 10,
    label: {
      show: true,
      position: 'right',
      formatter: (p: unknown) => {
        const x = p as { value?: number }
        return fmt(Number(x.value ?? 0))
      },
    },
  }

  // Target tick: per-row markLine at the target x value. Encoded by attaching
  // a markLine to the value series; ECharts draws each row's vertical tick.
  const targetTicks = rows
    .map((r, i) => (r.target == null ? null : { xAxis: r.target, yAxis: i }))
    .filter((x): x is { xAxis: number; yAxis: number } => x !== null)

  if (targetTicks.length > 0) {
    valueSeries.markLine = {
      symbol: 'none',
      lineStyle: { color: '#222', width: 2 },
      label: { show: false },
      data: targetTicks.map((t) => [
        { coord: [t.xAxis, t.yAxis], symbol: 'none' },
        // ECharts markLine 'min/max'-style needs paired endpoints; we draw
        // a tiny vertical mark by giving both ends the same xAxis value.
        { coord: [t.xAxis, t.yAxis], symbol: 'none' },
      ]),
    }
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v: unknown) => fmt(Number(v ?? 0)),
    },
    legend: { show: false },
    grid: { left: 96, right: 64, top: 16, bottom: 32 },
    xAxis: {
      type: 'value',
      name: xAxisLabel ?? '',
      nameLocation: 'middle',
      nameGap: 24,
      axisLabel: { formatter: (v: number) => fmt(v) },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      inverse: true,
      axisTick: { show: false },
    },
    series: [...rangeSeries, valueSeries],
  }

  return { echartOptions, width, height }
}
