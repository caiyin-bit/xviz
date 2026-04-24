import { useMemo } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { ChartProps, HeatmapFormData } from '../types'
import { Echart } from '../Echart'
import { getNumberFormatter } from '../utils'

export function Heatmap(props: ChartProps<HeatmapFormData>) {
  const { formData, queriesData, width, height, theme } = props
  const echartOptions = useMemo<EChartsCoreOption>(() => {
    const {
      xAxis, yAxis, metric,
      colorRange = ['#e6f7ff', '#0050b3'],
      showValues = false,
      numberFormat = 'smart',
    } = formData
    const rows = queriesData[0]?.data ?? []
    const fmt = getNumberFormatter(numberFormat)

    const xSet = new Set<string>()
    const ySet = new Set<string>()
    let vMin = Infinity, vMax = -Infinity
    for (const r of rows) {
      xSet.add(String(r[xAxis] ?? ''))
      ySet.add(String(r[yAxis] ?? ''))
      const v = Number(r[metric] ?? 0)
      if (v < vMin) vMin = v
      if (v > vMax) vMax = v
    }
    const xValues = Array.from(xSet)
    const yValues = Array.from(ySet)
    const xIdx = new Map(xValues.map((v, i) => [v, i]))
    const yIdx = new Map(yValues.map((v, i) => [v, i]))
    const data = rows.map((r) => [
      xIdx.get(String(r[xAxis] ?? '')) ?? 0,
      yIdx.get(String(r[yAxis] ?? '')) ?? 0,
      Number(r[metric] ?? 0),
    ])

    return {
      tooltip: {
        formatter: (p: unknown) => {
          const d = (p as { value?: number[] }).value ?? []
          return `${xValues[d[0] ?? 0]} × ${yValues[d[1] ?? 0]}<br/><b>${fmt(Number(d[2] ?? 0))}</b>`
        },
      },
      grid: { left: 100, right: 40, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: xValues, splitArea: { show: true } },
      yAxis: { type: 'category', data: yValues, splitArea: { show: true } },
      visualMap: {
        min: Number.isFinite(vMin) ? vMin : 0,
        max: Number.isFinite(vMax) ? vMax : 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: { color: colorRange },
        formatter: (v: number) => fmt(v),
      },
      series: [{
        name: metric,
        type: 'heatmap',
        data,
        label: { show: showValues, formatter: (p: unknown) => {
          const d = (p as { value?: number[] }).value ?? []
          return fmt(Number(d[2] ?? 0))
        } },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
      }],
    }
  }, [formData, queriesData])

  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
