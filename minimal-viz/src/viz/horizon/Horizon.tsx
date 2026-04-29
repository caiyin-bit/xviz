// Simplified horizon chart — single-band area on a time axis. The classic
// folded multi-band horizon (where positive/negative values are stacked
// into colored bands) is on the backlog as it requires a custom
// renderItem implementation. For most BI use cases — comparing one
// or a few time series with subtle magnitude shifts — the single-band
// area variant is the practical equivalent.
//
// xviz delegates to TimeseriesLine with `area: true` and `smooth: true`
// for the visual feel.

import { useMemo } from 'react'
import type { ChartProps, HorizonFormData, TimeseriesFormData } from '../types'
import { transformTimeseriesProps } from '../timeseries/transformProps'
import { Echart } from '../Echart'

export function Horizon(props: ChartProps<HorizonFormData>) {
  const { theme, formData, queriesData, width, height } = props
  const tsFormData: TimeseriesFormData = {
    vizType: 'timeseries-line',
    xAxis: formData.xAxis,
    metrics: [formData.metric],
    seriesColumn: formData.seriesColumn,
    smooth: true,
    area: true,
    showDots: false,
    showLegend: !!formData.seriesColumn,
    colorScheme: formData.colorScheme,
    numberFormat: formData.numberFormat,
    xAxisLabel: formData.xAxisLabel,
    yAxisLabel: formData.yAxisLabel,
  }
  const { echartOptions, width: w, height: h } = useMemo(
    () => transformTimeseriesProps({
      formData: tsFormData,
      queriesData,
      width,
      height,
      theme,
    }),
    [tsFormData, queriesData, width, height, theme],
  )
  return <Echart width={w} height={h} echartOptions={echartOptions} theme={theme} />
}
