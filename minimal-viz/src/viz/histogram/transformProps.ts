// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Histogram/transformProps.ts
// ECharts has no histogram series — we bin client-side and emit a bar series.
// Equal-width bins, optional density normalization, optional cumulative.

import type { EChartsCoreOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { ChartProps, HistogramFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

const LEGEND_GAP = 24

export interface TransformedHistogramProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

export function transformHistogramProps(
  chartProps: ChartProps<HistogramFormData>,
): TransformedHistogramProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    metric,
    bins: binsRaw = 20,
    binStart,
    binEnd,
    density = false,
    cumulative = false,
    showLegend = false,
    legendOrientation = 'top',
    numberFormat = 'smart',
    xAxisLabel,
    yAxisLabel,
    colorScheme,
  } = formData

  const bins = Math.max(1, Math.floor(binsRaw))
  const rawData = queriesData[0]?.data ?? []
  const formatNumber = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)

  const values: number[] = []
  for (const row of rawData) {
    const v = Number(row[metric] ?? NaN)
    if (Number.isFinite(v)) values.push(v)
  }

  if (values.length === 0) {
    return {
      echartOptions: {
        animation: true,
        legend: { show: false },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: [] }],
      },
      width,
      height,
    }
  }

  const minV = binStart ?? Math.min(...values)
  const maxV = binEnd ?? Math.max(...values)
  const span = maxV - minV
  const binWidth = span > 0 ? span / bins : 1
  const effectiveBins = span > 0 ? bins : 1

  const counts: number[] = new Array(effectiveBins).fill(0)
  const labels: string[] = []
  for (let i = 0; i < effectiveBins; i += 1) {
    const lo = minV + i * binWidth
    const hi = minV + (i + 1) * binWidth
    const isLast = i === effectiveBins - 1
    labels.push(`${formatNumber(lo)}–${formatNumber(hi)}${isLast ? ']' : ')'}`)
  }

  for (const v of values) {
    if (v < minV || v > maxV) continue
    let idx = Math.floor((v - minV) / binWidth)
    if (idx >= effectiveBins) idx = effectiveBins - 1
    if (idx < 0) idx = 0
    counts[idx] += 1
  }

  let series: number[] = counts
  if (density && binWidth > 0) {
    const n = values.length
    series = counts.map((c) => c / (n * binWidth))
  }

  if (cumulative) {
    const acc: number[] = []
    let running = 0
    for (const v of series) {
      running += v
      acc.push(running)
    }
    series = acc
  }

  const seriesName = density ? `density(${metric})` : `count(${metric})`
  const barSeries: BarSeriesOption = {
    type: 'bar',
    name: seriesName,
    data: series,
    barCategoryGap: '5%',
    itemStyle: { color: colorOf(metric) },
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { name?: string; value?: number }
        return `<b>${x.name ?? ''}</b><br/>${seriesName}: ${formatNumber(Number(x.value ?? 0))}`
      },
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
    xAxis: {
      type: 'category',
      data: labels,
      name: xAxisLabel ?? metric,
      nameLocation: 'middle',
      nameGap: 28,
      axisLabel: { rotate: labels.length > 8 ? 30 : 0 },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel ?? (density ? 'density' : 'count'),
      nameLocation: 'middle',
      nameGap: 36,
      axisLabel: {
        formatter: (v: number) => formatNumber(v),
      },
    },
    series: [barSeries],
  }

  return { echartOptions, width, height }
}
