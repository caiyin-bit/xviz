import { useMemo } from 'react'
import type { ChartProps, TreemapFormData } from '../types'
import { transformTreemapProps } from './transformProps'
import { Echart } from '../Echart'

export function Treemap(props: ChartProps<TreemapFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformTreemapProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
