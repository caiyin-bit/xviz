// Shared transform for Bar + Line charts.
// Input: tabular rows + x-axis column + list of metrics (+ optional breakdown).
// Output: ECharts cartesian option.

import type { EChartsCoreOption } from 'echarts/core'
import type { ChartProps, CartesianFormData } from '../types'
import { getNumberFormatter, makeColorScale, DEFAULT_PALETTE } from '../utils'

export interface TransformedCartesianProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

export function transformCartesianProps(
  chartProps: ChartProps<CartesianFormData>,
): TransformedCartesianProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    vizType,
    xAxis,
    metrics,
    seriesColumn,
    colorScheme,
    stacked = false,
    horizontal = false,
    smooth = false,
    area = false,
    showDots = true,
    showValues = false,
    showLegend = true,
    legendOrientation = 'top',
    numberFormat = 'smart',
    xAxisLabel,
    yAxisLabel,
  } = formData

  const isBar = vizType === 'bar'
  const rows = queriesData[0]?.data ?? []
  const fmt = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length
    ? colorScheme
    : chartProps.theme?.palette ?? DEFAULT_PALETTE
  const colorOf = makeColorScale(palette)

  // Distinct x values (preserve data order).
  const xValues: string[] = []
  const xSeen = new Set<string>()
  for (const r of rows) {
    const x = String(r[xAxis] ?? '')
    if (!xSeen.has(x)) {
      xValues.push(x)
      xSeen.add(x)
    }
  }

  // Build series. Each metric × optional breakdown value becomes one series.
  interface Series {
    name: string
    dataByX: Record<string, number>
  }
  const seriesMap = new Map<string, Series>()
  for (const r of rows) {
    const x = String(r[xAxis] ?? '')
    const breakdown = seriesColumn ? String(r[seriesColumn] ?? '') : undefined
    for (const m of metrics) {
      const name = breakdown !== undefined
        ? (metrics.length > 1 ? `${breakdown} · ${m}` : breakdown)
        : m
      let s = seriesMap.get(name)
      if (!s) {
        s = { name, dataByX: {} }
        seriesMap.set(name, s)
      }
      const v = Number(r[m] ?? 0)
      s.dataByX[x] = (s.dataByX[x] ?? 0) + v
    }
  }

  const series = Array.from(seriesMap.values()).map((s) => ({
    name: s.name,
    type: isBar ? 'bar' : 'line',
    stack: stacked ? 'total' : undefined,
    smooth: !isBar && smooth,
    showSymbol: !isBar && showDots,
    symbolSize: 6,
    areaStyle: !isBar && area ? { opacity: 0.25 } : undefined,
    itemStyle: { color: colorOf(s.name) },
    label: isBar && showValues
      ? { show: true, position: horizontal ? 'right' : 'top', formatter: (p: { value: unknown }) => fmt(Number(p.value ?? 0)) }
      : { show: false },
    data: xValues.map((x) => s.dataByX[x] ?? 0),
  }))

  const categoryAxis = {
    type: 'category',
    data: xValues,
    name: xAxisLabel,
    nameLocation: 'middle',
    nameGap: 28,
  } as const
  const valueAxis = {
    type: 'value',
    name: yAxisLabel,
    nameLocation: 'middle',
    nameGap: 40,
    axisLabel: { formatter: (v: number) => fmt(v) },
  } as const

  const echartOptions: EChartsCoreOption = {
    tooltip: {
      trigger: isBar ? 'axis' : 'axis',
      axisPointer: { type: isBar ? 'shadow' : 'line' },
      valueFormatter: (v: unknown) => fmt(Number(v ?? 0)),
    },
    legend: {
      show: showLegend,
      orient: legendOrientation === 'left' || legendOrientation === 'right' ? 'vertical' : 'horizontal',
      [legendOrientation]: 8,
    },
    grid: { left: 56, right: 24, top: showLegend && (legendOrientation === 'top') ? 48 : 24, bottom: 48 },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series,
  }

  return { echartOptions, width, height }
}
