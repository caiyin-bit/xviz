import { useMemo } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import type { ChartProps, ScatterFormData } from '../types'
import { Echart } from '../Echart'
import { getNumberFormatter, makeColorScale, DEFAULT_PALETTE } from '../utils'

export function Scatter(props: ChartProps<ScatterFormData>) {
  const { formData, queriesData, width, height, theme } = props
  const echartOptions = useMemo<EChartsCoreOption>(() => {
    const {
      xAxis, yAxis, seriesColumn, sizeColumn,
      colorScheme, showLegend = true, legendOrientation = 'top',
      numberFormat = 'smart', xAxisLabel, yAxisLabel,
      minSize = 8, maxSize = 40,
    } = formData
    const rows = queriesData[0]?.data ?? []
    const fmt = getNumberFormatter(numberFormat)
    const colorOf = makeColorScale(colorScheme?.length ? colorScheme : DEFAULT_PALETTE)

    // Normalize size column to [minSize, maxSize]
    let sizeMin = Infinity, sizeMax = -Infinity
    if (sizeColumn) {
      for (const r of rows) {
        const v = Number(r[sizeColumn] ?? 0)
        if (v < sizeMin) sizeMin = v
        if (v > sizeMax) sizeMax = v
      }
    }
    const sizeFor = (v: number) => {
      if (!sizeColumn || sizeMax === sizeMin) return (minSize + maxSize) / 2
      const t = (v - sizeMin) / (sizeMax - sizeMin)
      return minSize + t * (maxSize - minSize)
    }

    // Group rows into series (by seriesColumn) or a single series.
    const grouped = new Map<string, [number, number, number, string][]>()
    for (const r of rows) {
      const name = seriesColumn ? String(r[seriesColumn] ?? '') : 'Series'
      const x = Number(r[xAxis] ?? 0)
      const y = Number(r[yAxis] ?? 0)
      const sz = sizeColumn ? Number(r[sizeColumn] ?? 0) : 0
      const label = String(r[seriesColumn ?? xAxis] ?? '')
      const list = grouped.get(name) ?? []
      list.push([x, y, sz, label])
      grouped.set(name, list)
    }

    const series = Array.from(grouped.entries()).map(([name, pts]) => ({
      name,
      type: 'scatter',
      symbolSize: (val: unknown) => {
        const v = Array.isArray(val) ? Number(val[2] ?? 0) : 0
        return sizeFor(v)
      },
      itemStyle: { color: colorOf(name), opacity: 0.75 },
      data: pts,
    }))

    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: unknown) => {
          const d = (p as { value?: number[]; name?: string }).value ?? []
          return `${xAxis}: ${fmt(Number(d[0] ?? 0))}<br/>${yAxis}: ${fmt(Number(d[1] ?? 0))}` +
            (sizeColumn ? `<br/>${sizeColumn}: ${fmt(Number(d[2] ?? 0))}` : '')
        },
      },
      legend: {
        show: showLegend && grouped.size > 1,
        orient: legendOrientation === 'left' || legendOrientation === 'right' ? 'vertical' : 'horizontal',
        [legendOrientation]: 8,
      },
      grid: { left: 60, right: 24, top: 40, bottom: 48 },
      xAxis: { type: 'value', name: xAxisLabel ?? xAxis, nameLocation: 'middle', nameGap: 28, axisLabel: { formatter: (v: number) => fmt(v) } },
      yAxis: { type: 'value', name: yAxisLabel ?? yAxis, nameLocation: 'middle', nameGap: 44, axisLabel: { formatter: (v: number) => fmt(v) } },
      series,
    }
  }, [formData, queriesData])

  return <Echart width={width} height={height} echartOptions={echartOptions} theme={theme} />
}
