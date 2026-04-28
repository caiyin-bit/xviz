import { useMemo } from 'react'
import type { ChartProps, TimeseriesFormData } from '../types'
import { transformTimeseriesProps } from './transformProps'
import { Echart } from '../Echart'

export function TimeseriesBar(props: ChartProps<TimeseriesFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformTimeseriesProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
