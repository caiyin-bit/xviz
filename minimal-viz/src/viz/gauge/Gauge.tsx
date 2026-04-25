import { useMemo } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { ChartProps, GaugeFormData } from '../types'
import { Echart } from '../Echart'
import { getNumberFormatter } from '../utils'

const DEFAULT_THRESHOLDS = [
  { at: 0.4, color: '#3ea04a' },   // green
  { at: 0.7, color: '#f7b500' },   // amber
  { at: 1.0, color: '#e04355' },   // red
]

export function Gauge(props: ChartProps<GaugeFormData>) {
  const { formData, queriesData, width, height, theme } = props
  const echartOptions = useMemo<EChartsCoreOption>(() => {
    const {
      metric, subheader, numberFormat = 'smart',
      min = 0, max, thresholds = DEFAULT_THRESHOLDS,
    } = formData
    const rows = queriesData[0]?.data ?? []
    const value = rows.length ? Number(rows[0][metric] ?? 0) : 0
    const autoMax = max ?? Math.max(value * 1.2, 100)
    const fmt = getNumberFormatter(numberFormat)

    const colorStops: [number, string][] = thresholds.map((t) => [t.at, t.color])

    return {
      series: [{
        type: 'gauge',
        min, max: autoMax,
        startAngle: 210,
        endAngle: -30,
        radius: '90%',
        axisLine: { lineStyle: { width: 18, color: colorStops } },
        pointer: { length: '60%', width: 6 },
        axisTick: { length: 8, lineStyle: { color: theme?.colorTextSecondary ?? '#888' } },
        splitLine: { length: 14, lineStyle: { color: theme?.colorTextSecondary ?? '#666' } },
        axisLabel: { distance: 22, fontSize: 10, color: theme?.colorTextSecondary ?? '#666', formatter: (v: number) => fmt(v) },
        title: { offsetCenter: [0, '72%'], fontSize: 12, color: theme?.colorTextSecondary ?? '#666' },
        detail: {
          offsetCenter: [0, '40%'],
          fontSize: Math.max(18, Math.min(width, height) * 0.12),
          fontWeight: 700,
          color: theme?.colorText ?? '#222',
          formatter: (v: number) => fmt(v),
        },
        data: [{ value, name: subheader ?? '' }],
      }],
    }
  }, [formData, queriesData, width, height, theme?.colorText, theme?.colorTextSecondary])

  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
