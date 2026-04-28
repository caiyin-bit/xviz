import { useMemo } from 'react'
import type { ChartProps, StepFormData } from '../types'
import { transformStepProps } from './transformProps'
import { Echart } from '../Echart'

export function Step(props: ChartProps<StepFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformStepProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
