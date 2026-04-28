// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Radar/transformProps.ts
// Multi-axis radar — indicator per metric, series per group (or single series if no groupby).
// Aggregation: sums metric values per (group × metric) cell.

import type { EChartsCoreOption } from 'echarts/core'
import type { RadarSeriesOption } from 'echarts/charts'
import type { ChartProps, RadarFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

const LEGEND_GAP = 24

export interface TransformedRadarProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

export function transformRadarProps(
  chartProps: ChartProps<RadarFormData>,
): TransformedRadarProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    metrics,
    groupby,
    shape = 'polygon',
    fill = true,
    showLegend = true,
    legendOrientation = 'top',
    axisMax,
    numberFormat = 'smart',
    colorScheme,
  } = formData

  const rawData = queriesData[0]?.data ?? []
  const formatNumber = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)

  // Aggregate: { groupName -> { metric -> sum } }.
  // No-groupby case uses the single bucket key '__all__'.
  const buckets = new Map<string, Record<string, number>>()
  const noGroup = '__all__'

  for (const row of rawData) {
    const key = groupby ? String(row[groupby] ?? '') : noGroup
    const cell = buckets.get(key) ?? Object.fromEntries(metrics.map((m) => [m, 0]))
    for (const m of metrics) {
      const v = Number(row[m] ?? NaN)
      if (Number.isFinite(v)) cell[m] += v
    }
    buckets.set(key, cell)
  }

  // Compute per-metric max for indicator scale (or honor caller-provided axisMax).
  const perMetricMax: Record<string, number> = Object.fromEntries(metrics.map((m) => [m, 0]))
  for (const cell of buckets.values()) {
    for (const m of metrics) {
      if (cell[m] > perMetricMax[m]) perMetricMax[m] = cell[m]
    }
  }

  const indicator = metrics.map((m) => ({
    name: m,
    max: axisMax ?? (perMetricMax[m] > 0 ? perMetricMax[m] : 1),
  }))

  const seriesData = Array.from(buckets.entries()).map(([name, cell]) => {
    const value = metrics.map((m) => cell[m])
    const displayName = name === noGroup ? (metrics.length === 1 ? metrics[0] : 'series') : name
    return {
      name: displayName,
      value,
      itemStyle: { color: colorOf(displayName) },
      lineStyle: { color: colorOf(displayName) },
      areaStyle: fill ? { opacity: 0.25 } : undefined,
    }
  })

  const radarSeries: RadarSeriesOption = {
    type: 'radar',
    data: seriesData,
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { name?: string; value?: number[] }
        const v = x.value ?? []
        const lines = metrics.map(
          (m, i) => `${m}: ${formatNumber(Number(v[i] ?? 0))}`,
        )
        return [`<b>${x.name ?? ''}</b>`, ...lines].join('<br/>')
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
    radar: {
      indicator,
      shape,
      splitNumber: 4,
    },
    tooltip: { trigger: 'item' },
    series: [radarSeries],
  }

  return { echartOptions, width, height }
}
