import { useMemo } from 'react'
import type { ChartProps, SunburstFormData } from '../types'
import { transformSunburstProps } from './transformProps'
import { Echart } from '../Echart'

export function Sunburst(props: ChartProps<SunburstFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformSunburstProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
