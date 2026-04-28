import { useMemo } from 'react'
import type { ChartProps, GanttFormData } from '../types'
import { transformGanttProps } from './transformProps'
import { Echart } from '../Echart'

export function Gantt(props: ChartProps<GanttFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformGanttProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
