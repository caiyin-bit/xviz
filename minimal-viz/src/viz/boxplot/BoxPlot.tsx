import { useMemo } from 'react'
import type { ChartProps, BoxPlotFormData } from '../types'
import { transformBoxPlotProps } from './transformProps'
import { Echart } from '../Echart'

export function BoxPlot(props: ChartProps<BoxPlotFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformBoxPlotProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
