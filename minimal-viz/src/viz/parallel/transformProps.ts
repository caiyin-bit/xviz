// Adapted from superset-frontend/plugins/legacy-plugin-chart-parallel-coordinates
// Each row of input data becomes one polyline traversing the parallel axes,
// one axis per dimension column. Optional seriesColumn groups lines by category
// for color coding.

import type { EChartsCoreOption } from 'echarts/core'
import type { ParallelSeriesOption } from 'echarts/charts'
import type { ChartProps, ParallelCoordinatesFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

export interface TransformedParallelCoordinatesProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

export function transformParallelCoordinatesProps(
  chartProps: ChartProps<ParallelCoordinatesFormData>,
): TransformedParallelCoordinatesProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    dimensions,
    seriesColumn,
    colorScheme,
    showLegend = !!seriesColumn,
    legendOrientation = 'top',
    numberFormat = 'smart',
    lineOpacity = 0.5,
  } = formData

  const fmt = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)
  const rawData = queriesData[0]?.data ?? []

  // Parallel axes: one per dimension. dim index = position in the array.
  const parallelAxis = dimensions.map((d, i) => ({
    dim: i,
    name: d,
    nameLocation: 'middle' as const,
    nameGap: 14,
  }))

  // Build series data. Each row → one [v0, v1, ...] tuple keyed by series name.
  // If seriesColumn set, group rows; otherwise each row is its own anonymous line.
  type Line = { name: string; value: (number | null)[] }
  const seriesByName = new Map<string, Line[]>()

  for (const row of rawData) {
    const value = dimensions.map((d) => {
      const v = Number(row[d] ?? NaN)
      return Number.isFinite(v) ? v : null
    })
    const name = seriesColumn ? String(row[seriesColumn] ?? '') : '__all__'
    const arr = seriesByName.get(name) ?? []
    arr.push({ name, value })
    seriesByName.set(name, arr)
  }

  const seriesList: ParallelSeriesOption[] = Array.from(seriesByName.entries()).map(
    ([name, lines]) => ({
      type: 'parallel',
      name: name === '__all__' ? '' : name,
      data: lines.map((l) => l.value as number[]),
      lineStyle: {
        color: name === '__all__' ? colorOf(dimensions[0]) : colorOf(name),
        opacity: lineOpacity,
        width: 1.5,
      },
      smooth: false,
      tooltip: {
        formatter: (p: unknown) => {
          const x = p as { value?: number[]; seriesName?: string }
          const v = x.value ?? []
          const lines = dimensions.map((d, i) => `${d}: ${fmt(Number(v[i] ?? 0))}`)
          const head = x.seriesName ? `<b>${x.seriesName}</b><br/>` : ''
          return head + lines.join('<br/>')
        },
      },
    }),
  )

  const echartOptions: EChartsCoreOption = {
    animation: true,
    legend: showLegend
      ? {
          show: true,
          orient: legendOrientation === 'left' || legendOrientation === 'right' ? 'vertical' : 'horizontal',
          [legendOrientation]: 8,
        }
      : { show: false },
    parallelAxis,
    parallel: {
      left: 64,
      right: 32,
      top: showLegend && legendOrientation === 'top' ? 48 : 24,
      bottom: 32,
      parallelAxisDefault: {
        type: 'value',
        nameTextStyle: { fontSize: 11 },
        axisLabel: { formatter: (v: number) => fmt(v), fontSize: 10 },
      },
    },
    series: seriesList,
  }

  return { echartOptions, width, height }
}
