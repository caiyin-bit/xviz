// Adapted from superset-frontend/plugins/plugin-chart-echarts/src/Gantt/transformProps.ts
// ECharts has no first-class gantt series — we use a `custom` series with a
// renderItem that draws horizontal rectangles spanning [start, end] on the
// time axis. y-axis is categorical (one row per task).

import type { EChartsCoreOption } from 'echarts/core'
import type { ChartProps, GanttFormData } from '../types'
import { getNumberFormatter, makeColorScale } from '../utils'

export interface TransformedGanttProps {
  echartOptions: EChartsCoreOption
  width: number
  height: number
}

function parseTime(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v < 1e12 ? v * 1000 : v
  }
  const s = String(v ?? '')
  if (/^\d+$/.test(s)) {
    const n = Number(s)
    return n < 1e12 ? n * 1000 : n
  }
  return Date.parse(s)
}

interface GanttRow {
  task: string
  start: number
  end: number
  group?: string
  color: string
}

export function transformGanttProps(
  chartProps: ChartProps<GanttFormData>,
): TransformedGanttProps {
  const { formData, queriesData, width, height } = chartProps
  const {
    taskColumn,
    startColumn,
    endColumn,
    groupColumn,
    showLabels = true,
    showLegend = !!groupColumn,
    legendOrientation = 'top',
    numberFormat = 'smart',
    colorScheme,
    xAxisLabel,
  } = formData

  const fmt = getNumberFormatter(numberFormat)
  const palette = colorScheme?.length ? colorScheme : chartProps.theme?.palette
  const colorOf = makeColorScale(palette)
  const rawData = queriesData[0]?.data ?? []

  const rows: GanttRow[] = []
  for (const r of rawData) {
    const task = String(r[taskColumn] ?? '')
    const start = parseTime(r[startColumn])
    const end = parseTime(r[endColumn])
    if (!task || !Number.isFinite(start) || !Number.isFinite(end)) continue
    const group = groupColumn ? String(r[groupColumn] ?? '') : undefined
    const color = colorOf(group ?? task)
    rows.push({ task, start, end, group, color })
  }

  // Tasks listed top-to-bottom in input order. yAxis is reverse so first row
  // appears at the top (matches typical Gantt convention).
  const taskNames = rows.map((r) => r.task)

  // Series data: [yIndex, start, end, taskName, group, color]
  const seriesData = rows.map((r, i) => ({
    name: r.task,
    value: [i, r.start, r.end, r.task, r.group ?? '', r.color],
    itemStyle: { color: r.color },
  }))

  // ECharts custom-series typings are quite strict; widen to unknown for
  // renderItem / label.formatter and let ECharts validate at runtime.
  const series = {
    type: 'custom',
    name: 'gantt',
    data: seriesData,
    encode: { x: [1, 2], y: 0, tooltip: [3, 1, 2, 4] },
    renderItem: (_params: unknown, api: unknown) => {
      const a = api as {
        value: (i: number) => number
        coord: (xy: [number, number]) => [number, number]
        size: (xy: [number, number]) => [number, number]
        style: () => Record<string, unknown>
      }
      const yIdx = Number(a.value(0))
      const startCoord = a.coord([Number(a.value(1)), yIdx])
      const endCoord = a.coord([Number(a.value(2)), yIdx])
      const cellHeight = a.size([0, 1])[1]
      const barHeight = cellHeight * 0.6
      const x = startCoord[0]
      const y = startCoord[1] - barHeight / 2
      const w = Math.max(1, endCoord[0] - startCoord[0])
      return {
        type: 'rect',
        shape: { x, y, width: w, height: barHeight, r: 2 },
        style: a.style(),
      }
    },
    label: showLabels
      ? {
          show: true,
          position: 'insideLeft',
          formatter: (p: unknown) => {
            const x = p as { value?: unknown[] }
            return String(x.value?.[3] ?? '')
          },
          color: '#fff',
          fontSize: 11,
        }
      : { show: false },
  } as unknown as Record<string, unknown>

  const echartOptions: EChartsCoreOption = {
    animation: false,
    tooltip: {
      formatter: (p: unknown) => {
        const x = p as { value?: [number, number, number, string, string] }
        const v = x.value ?? [0, 0, 0, '', '']
        const startStr = new Date(Number(v[1])).toISOString().slice(0, 10)
        const endStr = new Date(Number(v[2])).toISOString().slice(0, 10)
        const days = Math.round((Number(v[2]) - Number(v[1])) / 86_400_000)
        const groupLine = v[4] ? `<br/>group: ${v[4]}` : ''
        return `<b>${v[3] ?? ''}</b>${groupLine}<br/>${startStr} → ${endStr} (${fmt(days)} days)`
      },
    },
    legend: showLegend
      ? {
          show: true,
          orient: legendOrientation === 'left' || legendOrientation === 'right' ? 'vertical' : 'horizontal',
          [legendOrientation]: 8,
        }
      : { show: false },
    grid: {
      left: 120,
      right: 24,
      top: showLegend && legendOrientation === 'top' ? 48 : 24,
      bottom: 48,
    },
    xAxis: {
      type: 'time',
      name: xAxisLabel ?? '',
      nameLocation: 'middle',
      nameGap: 28,
    },
    yAxis: {
      type: 'category',
      data: taskNames,
      inverse: true,
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [series],
  }

  return { echartOptions, width, height }
}
