import { useMemo } from 'react'
import type { ChartProps, GraphFormData } from '../types'
import { transformGraphProps } from './transformProps'
import { Echart } from '../Echart'

export function Graph(props: ChartProps<GraphFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformGraphProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
