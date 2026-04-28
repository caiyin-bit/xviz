// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/MixedTimeseries/transformProps.ts
// Bar + line metrics on the same time axis, with optional dual-Y-axis support.
// Bar metrics live on the left (default) axis; line metrics on the right axis
// when dualAxis=true (typical for mixing absolute counts with rate / ratio
// metrics that have very different scales).

import type { EChartsCoreOption } from 'echarts/core'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import type { ChartProps, MixedTimeseriesFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

export interface TransformedMixedTimeseriesProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

function parseTime(label: string): number {
  if (/^\d+$/.test(label)) {
    const n = Number(label)
    return n < 1e12 ? n * 1000 : n
  }
  return Date.parse(label)
}

export function transformMixedTimeseriesProps(
  chartProps: ChartProps<MixedTimeseriesFormData>,
): TransformedMixedTimeseriesProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    xAxis,
    barMetrics,
    lineMetrics,
    dualAxis = false,
    stacked = false,
    smooth = false,
    showDots = true,
    showLegend = true,
    legendOrientation = 'top',
    colorScheme,
    numberFormat = 'smart',
    xAxisLabel,
    leftYAxisLabel,
    rightYAxisLabel,
  } = formData

  const fmt = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)
  const rows = queriesData[0]?.data ?? []

  // Aggregate metric values keyed by xValue (sum if duplicate timestamps).
  const xValues: string[] = []
  const xSeen = new Set<string>()
  const allMetrics = [...barMetrics, ...lineMetrics]
  const valueMap: Record<string, Record<string, number>> = {}
  for (const m of allMetrics) valueMap[m] = {}

  for (const r of rows) {
    const x = String(r[xAxis] ?? '')
    if (!xSeen.has(x)) {
      xValues.push(x)
      xSeen.add(x)
    }
    for (const m of allMetrics) {
      const v = Number(r[m] ?? NaN)
      if (Number.isFinite(v)) {
        valueMap[m][x] = (valueMap[m][x] ?? 0) + v
      }
    }
  }

  // Sort by parsed timestamp for time-axis correctness.
  xValues.sort((a, b) => parseTime(a) - parseTime(b))
  const tsMap = xValues.map(parseTime)

  const buildSeries = (metric: string, type: 'bar' | 'line'): BarSeriesOption | LineSeriesOption => {
    const data = xValues.map((x, i) => [tsMap[i], valueMap[metric][x] ?? 0] as [number, number])
    const baseProps = {
      name: metric,
      data,
      itemStyle: { color: colorOf(metric) },
    } as const
    if (type === 'bar') {
      return {
        ...baseProps,
        type: 'bar',
        stack: stacked ? 'total' : undefined,
        yAxisIndex: 0,
      }
    }
    return {
      ...baseProps,
      type: 'line',
      smooth,
      showSymbol: showDots,
      symbolSize: 6,
      yAxisIndex: dualAxis ? 1 : 0,
      lineStyle: { color: colorOf(metric), width: 2 },
    }
  }

  const series = [
    ...barMetrics.map((m) => buildSeries(m, 'bar')),
    ...lineMetrics.map((m) => buildSeries(m, 'line')),
  ]

  const yAxisLeft = {
    type: 'value' as const,
    name: leftYAxisLabel ?? '',
    nameLocation: 'middle' as const,
    nameGap: 40,
    axisLabel: { formatter: (v: number) => fmt(v) },
  }
  const yAxisRight = {
    type: 'value' as const,
    name: rightYAxisLabel ?? '',
    nameLocation: 'middle' as const,
    nameGap: 40,
    axisLabel: { formatter: (v: number) => fmt(v) },
    splitLine: { show: false },
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v: unknown) => fmt(Number(v ?? 0)),
    },
    legend: {
      show: showLegend,
      orient: legendOrientation === 'left' || legendOrientation === 'right' ? 'vertical' : 'horizontal',
      [legendOrientation]: 8,
    },
    grid: {
      left: 56,
      right: dualAxis ? 56 : 24,
      top: showLegend && legendOrientation === 'top' ? 48 : 24,
      bottom: 48,
    },
    xAxis: {
      type: 'time',
      name: xAxisLabel ?? '',
      nameLocation: 'middle',
      nameGap: 28,
    },
    yAxis: dualAxis ? [yAxisLeft, yAxisRight] : yAxisLeft,
    series,
  }

  return { echartOptions, width, height }
}
