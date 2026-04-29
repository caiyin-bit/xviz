import { useMemo } from 'react'
import type { ChartProps, CalendarFormData } from '../types'
import { transformCalendarProps } from './transformProps'
import { Echart } from '../Echart'

export function Calendar(props: ChartProps<CalendarFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformCalendarProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
