import { useMemo } from 'react'
import type { ChartProps, ParallelCoordinatesFormData } from '../types'
import { transformParallelCoordinatesProps } from './transformProps'
import { Echart } from '../Echart'

export function ParallelCoordinates(props: ChartProps<ParallelCoordinatesFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformParallelCoordinatesProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
