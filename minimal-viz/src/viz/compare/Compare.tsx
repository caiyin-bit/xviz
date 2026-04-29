// Year-over-year multi-line comparison plot. Same data contract as
// TimeseriesLine — series are typically the comparison periods (last
// year vs this year etc, via seriesColumn). xviz reuses the existing
// TimeseriesLine renderer with `area: false` and standard line settings.

import { useMemo } from 'react'
import type { ChartProps, CompareFormData, TimeseriesFormData } from '../types'
import { transformTimeseriesProps } from '../timeseries/transformProps'
import { Echart } from '../Echart'

export function Compare(props: ChartProps<CompareFormData>) {
  const { theme, formData, queriesData, width, height } = props
  const tsFormData: TimeseriesFormData = {
    vizType: 'timeseries-line',
    xAxis: formData.xAxis,
    metrics: formData.metrics,
    seriesColumn: formData.seriesColumn,
    smooth: formData.smooth ?? false,
    area: false,
    showDots: formData.showDots ?? true,
    showLegend: formData.showLegend ?? true,
    legendOrientation: formData.legendOrientation,
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
