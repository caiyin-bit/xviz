// Paired t-test plot — statistical exploration. Practical equivalent
// is a grouped box-and-whisker showing the distribution of paired
// values. xviz delegates to BoxPlot with the pair column as groupby.

import { useMemo } from 'react'
import type { ChartProps, PairedTTestFormData, BoxPlotFormData } from '../types'
import { transformBoxPlotProps } from '../boxplot/transformProps'
import { Echart } from '../Echart'

export function PairedTTest(props: ChartProps<PairedTTestFormData>) {
  const { theme, formData, queriesData, width, height } = props
  const bpFormData: BoxPlotFormData = useMemo(() => ({
    vizType: 'boxplot',
    groupby: formData.pairColumn,
    metric: formData.metric,
    whiskerType: 'tukey',
    showOutliers: formData.showOutliers ?? true,
    horizontal: false,
    showLegend: formData.showLegend ?? false,
    legendOrientation: formData.legendOrientation,
    numberFormat: formData.numberFormat,
    yAxisLabel: formData.yAxisLabel,
  }), [formData])
  const { echartOptions, width: w, height: h } = useMemo(
    () => transformBoxPlotProps({
      formData: bpFormData,
      queriesData,
      width,
      height,
      theme,
    }),
    [bpFormData, queriesData, width, height, theme],
  )
  return <Echart width={w} height={h} echartOptions={echartOptions} theme={theme} />
}
