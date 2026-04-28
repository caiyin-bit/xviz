import { useMemo } from 'react'
import type { ChartProps, TreeFormData } from '../types'
import { transformTreeProps } from './transformProps'
import { Echart } from '../Echart'

export function Tree(props: ChartProps<TreeFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformTreeProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
