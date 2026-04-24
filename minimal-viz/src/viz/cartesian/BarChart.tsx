import { useMemo } from 'react'
import type { ChartProps, CartesianFormData } from '../types'
import { transformCartesianProps } from './transformProps'
import { Echart } from '../Echart'

export function BarChart(props: ChartProps<CartesianFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformCartesianProps({ ...props, formData: { ...props.formData, vizType: 'bar' } }),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
