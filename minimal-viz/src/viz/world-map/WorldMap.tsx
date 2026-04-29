import { useMemo } from 'react'
import type { ChartProps, WorldMapFormData } from '../types'
import { transformWorldMapProps } from './transformProps'
import { Echart } from '../Echart'

export function WorldMap(props: ChartProps<WorldMapFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformWorldMapProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
