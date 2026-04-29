import { useMemo } from 'react'
import type { ChartProps, BulletFormData } from '../types'
import { transformBulletProps } from './transformProps'
import { Echart } from '../Echart'

export function Bullet(props: ChartProps<BulletFormData>) {
  const { theme } = props
  const { echartOptions, width, height } = useMemo(
    () => transformBulletProps(props),
    [props],
  )
  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
