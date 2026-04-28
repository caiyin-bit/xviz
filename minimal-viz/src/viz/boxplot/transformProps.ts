// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/BoxPlot/transformProps.ts
// Pure data → ECharts option transform.
// - Aggregates raw rows by groupby column into 5-number summaries.
// - Tukey whiskers + outlier scatter series; optional min-max whiskers.
// - Horizontal/vertical orientation; categorical group axis.

import type { EChartsCoreOption } from 'echarts/core'
import type { BoxplotSeriesOption, ScatterSeriesOption } from 'echarts/charts'
import type { ChartProps, BoxPlotFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

const LEGEND_GAP = 24

export interface TransformedBoxPlotProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

interface BoxStats {
  group: string
  lo: number      // lower whisker
  q1: number
  median: number
  q3: number
  hi: number      // upper whisker
  outliers: number[]
}

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  if (sorted.length === 1) return sorted[0]
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function summarize(
  values: number[],
  whiskerType: 'tukey' | 'min-max',
): Omit<BoxStats, 'group'> {
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)

  if (whiskerType === 'min-max') {
    return { lo: min, q1, median, q3, hi: max, outliers: [] }
  }
  // Tukey
  const iqr = q3 - q1
  const fenceLo = q1 - 1.5 * iqr
  const fenceHi = q3 + 1.5 * iqr
  const inFence = sorted.filter((v) => v >= fenceLo && v <= fenceHi)
  const outliers = sorted.filter((v) => v < fenceLo || v > fenceHi)
  return {
    lo: inFence.length ? inFence[0] : q1,
    q1,
    median,
    q3,
    hi: inFence.length ? inFence[inFence.length - 1] : q3,
    outliers,
  }
}

export function transformBoxPlotProps(
  chartProps: ChartProps<BoxPlotFormData>,
): TransformedBoxPlotProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    groupby,
    metric,
    whiskerType = 'tukey',
    showOutliers = true,
    horizontal = false,
    showLegend = false,
    legendOrientation = 'top',
    numberFormat = 'smart',
    xAxisLabel,
    yAxisLabel,
    colorScheme,
  } = formData

  const rawData = queriesData[0]?.data ?? []
  const formatNumber = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)

  // Bucket rows by groupby value.
  const buckets = new Map<string, number[]>()
  for (const row of rawData) {
    const key = String(row[groupby] ?? '')
    const v = Number(row[metric] ?? NaN)
    if (Number.isFinite(v)) {
      const arr = buckets.get(key) ?? []
      arr.push(v)
      buckets.set(key, arr)
    }
  }

  const groups = Array.from(buckets.keys())
  const stats: BoxStats[] = groups.map((g) => ({
    group: g,
    ...summarize(buckets.get(g) ?? [], whiskerType),
  }))

  const boxData = stats.map((s) => [s.lo, s.q1, s.median, s.q3, s.hi])
  const outlierPoints: [number, number][] = []
  if (showOutliers && whiskerType === 'tukey') {
    stats.forEach((s, i) => {
      for (const v of s.outliers) outlierPoints.push([i, v])
    })
  }

  const boxSeries: BoxplotSeriesOption = {
    type: 'boxplot',
    name: metric,
    data: boxData,
    itemStyle: {
      color: colorOf(metric),
      borderColor: chartProps.theme?.colorText ?? '#333',
    },
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { name?: string; value?: number[] }
        const v = x.value ?? []
        const numeric = v.filter((n) => typeof n === 'number') as number[]
        const [lo, q1, m, q3, hi] = numeric
        return [
          `<b>${x.name ?? ''}</b>`,
          `max: ${formatNumber(hi)}`,
          `Q3: ${formatNumber(q3)}`,
          `median: ${formatNumber(m)}`,
          `Q1: ${formatNumber(q1)}`,
          `min: ${formatNumber(lo)}`,
        ].join('<br/>')
      },
    },
  }

  const outlierSeries: ScatterSeriesOption = {
    type: 'scatter',
    name: 'outliers',
    data: outlierPoints,
    symbolSize: 6,
    itemStyle: { color: chartProps.theme?.colorHighlight ?? '#d9534f' },
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { value?: [number, number] }
        const v = x.value ?? [0, 0]
        return `outlier: ${formatNumber(v[1])}`
      },
    },
  }

  const categoryAxis = {
    type: 'category' as const,
    data: groups,
    name: xAxisLabel ?? (horizontal ? yAxisLabel : ''),
    nameLocation: 'middle' as const,
    nameGap: 28,
  }
  const valueAxis = {
    type: 'value' as const,
    name: yAxisLabel ?? (horizontal ? xAxisLabel : ''),
    nameLocation: 'middle' as const,
    nameGap: 36,
    axisLabel: {
      formatter: (v: number) => formatNumber(v),
    },
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    legend: showLegend
      ? {
          show: true,
          orient:
            legendOrientation === 'left' || legendOrientation === 'right'
              ? 'vertical'
              : 'horizontal',
          [legendOrientation]: LEGEND_GAP,
        }
      : { show: false },
    tooltip: { trigger: 'item' },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: outlierPoints.length > 0 ? [boxSeries, outlierSeries] : [boxSeries],
  }

  return { echartOptions, width, height }
}
