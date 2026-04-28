import { useMemo } from 'react'
import type { ChartProps, MixedTimeseriesFormData } from '../types'
import { transformMixedTimeseriesProps } from './transformProps'
import { Echart } from '../Echart'

export function MixedTimeseries(props: ChartProps<MixedTimeseriesFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformMixedTimeseriesProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
