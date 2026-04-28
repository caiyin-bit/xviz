import { useMemo } from 'react'
import type { ChartProps, HistogramFormData } from '../types'
import { transformHistogramProps } from './transformProps'
import { Echart } from '../Echart'

export function Histogram(props: ChartProps<HistogramFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformHistogramProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
