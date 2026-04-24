import { useMemo } from 'react'
import type { ChartProps, PieFormData } from '../types'
import { transformPieProps } from './transformProps'
import { Echart } from '../Echart'

export function PieChart(props: ChartProps<PieFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformPieProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
