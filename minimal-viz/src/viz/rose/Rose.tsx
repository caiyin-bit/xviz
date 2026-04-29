import { useMemo } from 'react'
import type { ChartProps, RoseFormData } from '../types'
import { transformRoseProps } from './transformProps'
import { Echart } from '../Echart'

export function Rose(props: ChartProps<RoseFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformRoseProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
