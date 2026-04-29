import { useMemo } from 'react'
import type { ChartProps, ChordFormData } from '../types'
import { transformChordProps } from './transformProps'
import { Echart } from '../Echart'

export function Chord(props: ChartProps<ChordFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformChordProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
