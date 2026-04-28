// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Waterfall/transformProps.ts
// ECharts has no native waterfall. We emulate it with two stacked bar series:
//   1) "placeholder" — transparent, provides the vertical offset for each step
//   2) "value" — the visible colored delta bar
// Optional terminal "Total" bar shows the cumulative running total on a fresh column.

import type { EChartsCoreOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type { ChartProps, WaterfallFormData } from '../types'
import { getNumberFormatter } from '../utils'

export interface TransformedWaterfallProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

interface BarItem {
  value: number
  itemStyle: { color: string }
  signedValue: number
  isTotal?: boolean
}

export function transformWaterfallProps(
  chartProps: ChartProps<WaterfallFormData>,
): TransformedWaterfallProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    groupby,
    metric,
    showTotal = true,
    totalLabel = 'Total',
    showValues = true,
    positiveColor,
    negativeColor,
    totalColor,
    numberFormat = 'smart',
    xAxisLabel,
    yAxisLabel,
  } = formData

  const palette = chartProps.theme?.palette ?? []
  const posColor = positiveColor ?? palette[2] ?? '#5AC189'
  const negColor = negativeColor ?? palette[5] ?? '#E04355'
  const totColor = totalColor ?? palette[0] ?? '#1FA8C9'

  const formatNumber = getNumberFormatter(numberFormat)
  const rawData = queriesData[0]?.data ?? []

  const labels: string[] = []
  const placeholders: number[] = []
  const visibles: BarItem[] = []
  let running = 0

  for (const row of rawData) {
    const label = String(row[groupby] ?? '')
    const v = Number(row[metric] ?? NaN)
    if (!Number.isFinite(v)) continue

    labels.push(label)
    if (v >= 0) {
      placeholders.push(running)
      visibles.push({ value: v, itemStyle: { color: posColor }, signedValue: v })
      running += v
    } else {
      running += v
      placeholders.push(running)
      visibles.push({ value: -v, itemStyle: { color: negColor }, signedValue: v })
    }
  }

  if (showTotal) {
    labels.push(totalLabel)
    placeholders.push(0)
    visibles.push({
      value: running,
      itemStyle: { color: totColor },
      signedValue: running,
      isTotal: true,
    })
  }

  const placeholderSeries: BarSeriesOption = {
    type: 'bar',
    name: 'placeholder',
    stack: 'total',
    silent: true,
    itemStyle: { color: 'transparent', borderColor: 'transparent' },
    emphasis: { itemStyle: { color: 'transparent', borderColor: 'transparent' } },
    data: placeholders,
  }

  const valueSeries: BarSeriesOption = {
    type: 'bar',
    name: metric,
    stack: 'total',
    data: visibles,
    label: showValues
      ? {
          show: true,
          position: 'top',
          formatter: (p: unknown) => {
            const x = p as { dataIndex?: number }
            const idx = x.dataIndex ?? 0
            const item = visibles[idx]
            return item ? formatNumber(item.signedValue) : ''
          },
        }
      : { show: false },
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { name?: string; dataIndex?: number }
        const idx = x.dataIndex ?? 0
        const item = visibles[idx]
        if (!item) return ''
        const tag = item.isTotal ? 'total' : item.signedValue >= 0 ? 'gain' : 'loss'
        return `<b>${x.name ?? ''}</b><br/>${tag}: ${formatNumber(item.signedValue)}`
      },
    },
  }

  const echartOptions: EChartsCoreOption = {
    animation: true,
    legend: { show: false },
    tooltip: { trigger: 'item' },
    xAxis: {
      type: 'category',
      data: labels,
      name: xAxisLabel ?? '',
      nameLocation: 'middle',
      nameGap: 28,
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel ?? metric,
      nameLocation: 'middle',
      nameGap: 36,
      axisLabel: {
        formatter: (v: number) => formatNumber(v),
      },
    },
    series: [placeholderSeries, valueSeries],
  }

  return { echartOptions, width, height }
}
