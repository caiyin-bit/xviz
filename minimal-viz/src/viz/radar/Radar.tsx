import { useMemo } from 'react'
import type { ChartProps, RadarFormData } from '../types'
import { transformRadarProps } from './transformProps'
import { Echart } from '../Echart'

export function Radar(props: ChartProps<RadarFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformRadarProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
