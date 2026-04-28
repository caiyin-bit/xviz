import { useMemo } from 'react'
import type { ChartProps, WaterfallFormData } from '../types'
import { transformWaterfallProps } from './transformProps'
import { Echart } from '../Echart'

export function Waterfall(props: ChartProps<WaterfallFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformWaterfallProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
