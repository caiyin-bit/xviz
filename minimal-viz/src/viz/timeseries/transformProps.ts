// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/transformProps.ts
// Shared transform for timeseries-bar + timeseries-line.
// Reuses transformCartesianProps and rewires the x-axis to ECharts' `time` type.

import type { ChartProps, TimeseriesFormData, CartesianFormData } from '../types'
import {
  transformCartesianProps,
  type TransformedCartesianProps,
} from '../cartesian/transformProps'

export type TransformedTimeseriesProps = TransformedCartesianProps

/** Parse an x-axis label to a Unix epoch (ms). Returns NaN for unparseable values. */
function parseTime(label: string): number {
  if (/^\d+$/.test(label)) {
    const n = Number(label)
    return n < 1e12 ? n * 1000 : n
  }
  return Date.parse(label)
}

export function transformTimeseriesProps(
  chartProps: ChartProps<TimeseriesFormData>,
): TransformedTimeseriesProps {
  const { formData } = chartProps
  const isBar = formData.vizType === 'timeseries-bar'

  const cartesianFormData: CartesianFormData = {
    vizType: isBar ? 'bar' : 'line',
    xAxis: formData.xAxis,
    metrics: formData.metrics,
    seriesColumn: formData.seriesColumn,
    colorScheme: formData.colorScheme,
    stacked: formData.stacked,
    smooth: !isBar ? formData.smooth : undefined,
    area: !isBar ? formData.area : undefined,
    showDots: !isBar ? formData.showDots : undefined,
    showValues: isBar ? formData.showValues : undefined,
    showLegend: formData.showLegend,
    legendOrientation: formData.legendOrientation,
    numberFormat: formData.numberFormat,
    xAxisLabel: formData.xAxisLabel,
    yAxisLabel: formData.yAxisLabel,
  }

  const result = transformCartesianProps({
    ...chartProps,
    formData: cartesianFormData,
  })

  const opts = result.echartOptions as {
    xAxis: { type: string; data?: string[]; name?: string; nameLocation?: string; nameGap?: number }
    yAxis: unknown
    series: { data: number[] | [number, number][] }[]
  }

  const labels = opts.xAxis.data ?? []
  const timestamps = labels.map(parseTime)

  for (const s of opts.series) {
    const numericData = s.data as number[]
    s.data = numericData.map((v, i) => [timestamps[i], v]) as [number, number][]
  }

  const newXAxis = {
    type: 'time' as const,
    name: opts.xAxis.name,
    nameLocation: opts.xAxis.nameLocation,
    nameGap: opts.xAxis.nameGap,
  }
  ;(result.echartOptions as { xAxis: unknown }).xAxis = newXAxis

  return result
}
